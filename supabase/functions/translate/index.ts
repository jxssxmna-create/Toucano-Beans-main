import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BRAND = { en: 'Toucano Beans', ar: 'توكانو بينز' } as const;
const BRAND_TOKEN = 'ZQXBRANDQZ';
const MAX_TOTAL_CHARS = 12000;
const MAX_FIELDS = 12;

type Lang = 'en' | 'ar';
type Fields = Record<string, string>;

const BRAND_EN_RE = /toucano\s+beans/gi;
const BRAND_AR_RE = /(توكانو\s*بينز|حبوب\s*(ال)?توكانو|فاصوليا\s*(ال)?توكانو|توكانو\s*بينس)/g;

function protectBrand(text: string, source: Lang) {
  return text.replace(source === 'en' ? BRAND_EN_RE : BRAND_AR_RE, BRAND_TOKEN);
}

/** Restores the brand token and normalises any stray brand renderings to the canonical form. */
function enforceBrand(text: string, target: Lang) {
  let out = text.replace(new RegExp(BRAND_TOKEN, 'gi'), BRAND[target]);
  if (target === 'ar') out = out.replace(BRAND_AR_RE, BRAND.ar).replace(BRAND_EN_RE, BRAND.ar);
  else out = out.replace(BRAND_AR_RE, BRAND.en).replace(BRAND_EN_RE, BRAND.en);
  return out;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

async function viaOpenAI(fields: Fields, source: Lang, target: Lang, context: string): Promise<Fields> {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('no-openai');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_TRANSLATE_MODEL') ?? Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            `You are a professional e-commerce translator for a specialty coffee roaster in Qatar. ` +
            `Translate every value of the JSON object from ${source === 'en' ? 'English' : 'Arabic'} to ` +
            `${target === 'en' ? 'British English' : 'Modern Standard Arabic suitable for a Gulf audience'}. ` +
            `Context: ${context}. Rules: keep the same JSON keys; preserve line breaks, bullet markers (*, -, 1.), ` +
            `numbers, units (g, kg, ml, °C, QAR) and markdown bold (**); keep coffee origin names recognisable; ` +
            `the token ${BRAND_TOKEN} must be kept exactly as-is. Return only the JSON object.`,
        },
        { role: 'user', content: JSON.stringify(fields) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
  const out: Fields = {};
  for (const k of Object.keys(fields)) out[k] = typeof parsed[k] === 'string' ? parsed[k] : '';
  return out;
}

/** Translates line-by-line so bullets/markers survive plain MT engines. */
async function perLine(text: string, translateLine: (s: string) => Promise<string>) {
  const lines = text.split('\n');
  const out: string[] = [];
  for (const line of lines) {
    const m = line.match(/^(\s*(?:[*\-•]|\d+[.)])?\s*)(.*)$/);
    const prefix = m?.[1] ?? '';
    const body = m?.[2] ?? line;
    out.push(body.trim() ? prefix + (await translateLine(body)) : line);
  }
  return out.join('\n');
}

async function viaGoogle(fields: Fields, source: Lang, target: Lang): Promise<Fields> {
  const key = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
  if (!key) throw new Error('no-google');
  const out: Fields = {};
  for (const [k, text] of Object.entries(fields)) {
    out[k] = await perLine(text, async (line) => {
      const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: line, source, target, format: 'text' }),
      });
      if (!res.ok) throw new Error(`google ${res.status}`);
      const data = await res.json();
      return data.data?.translations?.[0]?.translatedText ?? line;
    });
  }
  return out;
}

async function viaMyMemory(fields: Fields, source: Lang, target: Lang): Promise<Fields> {
  const out: Fields = {};
  const email = Deno.env.get('MYMEMORY_EMAIL');
  for (const [k, text] of Object.entries(fields)) {
    out[k] = await perLine(text, async (line) => {
      const params = new URLSearchParams({ q: line.slice(0, 480), langpair: `${source}|${target}` });
      if (email) params.set('de', email);
      const res = await fetch(`https://api.mymemory.translated.net/get?${params}`);
      if (!res.ok) throw new Error(`mymemory ${res.status}`);
      const data = await res.json();
      if (data.responseStatus && Number(data.responseStatus) !== 200) throw new Error(`mymemory ${data.responseStatus}`);
      return data.responseData?.translatedText ?? line;
    });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  });
  const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin');
  if (adminErr || !isAdmin) return json({ error: 'Admins only' }, 403);

  let body: { fields?: unknown; source?: string; target?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const source: Lang = body.source === 'ar' ? 'ar' : 'en';
  const target: Lang = body.target === 'en' ? 'en' : 'ar';
  if (source === target) return json({ error: 'source and target must differ' }, 400);

  const raw = body.fields && typeof body.fields === 'object' ? (body.fields as Record<string, unknown>) : {};
  const entries = Object.entries(raw)
    .filter(([, v]) => typeof v === 'string' && v.trim())
    .slice(0, MAX_FIELDS) as [string, string][];
  if (!entries.length) return json({ translations: {}, provider: 'none' });
  if (entries.reduce((n, [, v]) => n + v.length, 0) > MAX_TOTAL_CHARS) return json({ error: 'Text too long' }, 413);

  const context = String(body.context ?? 'product listing').slice(0, 60);
  const protectedFields = Object.fromEntries(entries.map(([k, v]) => [k, protectBrand(v, source)]));

  const providers: [string, () => Promise<Fields>][] = [
    ['openai', () => viaOpenAI(protectedFields, source, target, context)],
    ['google', () => viaGoogle(protectedFields, source, target)],
    ['mymemory', () => viaMyMemory(protectedFields, source, target)],
  ];

  for (const [name, run] of providers) {
    try {
      const result = await run();
      const translations = Object.fromEntries(Object.entries(result).map(([k, v]) => [k, enforceBrand(v, target)]));
      return json({ translations, provider: name });
    } catch (err) {
      if (!String(err).includes('no-')) console.error(`translate provider ${name} failed`, err);
    }
  }
  return json({ error: 'All translation providers failed' }, 502);
});
