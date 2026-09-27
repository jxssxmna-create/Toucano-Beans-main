import { createClient } from 'npm:@supabase/supabase-js@2';

const SYSTEM_PROMPT =
  'You are the official Toucano Beans AI Coffee Consultant. Your tone is warm, expert, and concise. ' +
  'Your goal is to help customers choose coffee beans and equipment available on toucanobeans.com. ' +
  'Recommend specific products when relevant and explain brewing setups clearly.';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_HISTORY = 12;
const MAX_CHARS = 2000;

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Product = { name: string; description: string | null; price: number; category: string };
type Knowledge = { category: string; title: string; content: string };

function sanitize(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
}

function buildContext(products: Product[], knowledge: Knowledge[], lang: string) {
  const catalog = products
    .map(
      (p) =>
        `- ${p.name} [${p.category}] — ${Number(p.price).toFixed(2)} QAR${
          p.description ? `: ${p.description.replace(/\s+/g, ' ').slice(0, 280)}` : ''
        }`,
    )
    .join('\n');
  const kb = knowledge.map((k) => `### [${k.category}] ${k.title}\n${k.content}`).join('\n\n');
  return [
    SYSTEM_PROMPT,
    'Only recommend products from the catalog below; never invent products or prices. ' +
      'If something is not in the catalog, say so and suggest the closest alternative.',
    lang === 'ar' ? 'Reply in Arabic.' : 'Reply in the language the customer uses.',
    `## Product catalog\n${catalog || '(empty)'}`,
    `## Knowledge base\n${kb || '(empty)'}`,
  ].join('\n\n');
}

const STOPWORDS = new Set(
  'a an and are be beans bean coffee do for how i in is it me my need of on or setup the to what with you your recommend notes'.split(
    ' ',
  ),
);

function fallbackAnswer(question: string, products: Product[], knowledge: Knowledge[]) {
  const words = question
    .toLowerCase()
    .split(/[^a-z0-9\u0600-\u06ff]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const score = (text: string) => {
    const t = text.toLowerCase();
    return words.reduce((s, w) => s + (t.includes(w) ? 1 : 0), 0);
  };

  const kbHits = knowledge
    .map((k) => ({ k, s: score(`${k.title} ${k.content}`) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 2);
  const productHits = products
    .map((p) => ({ p, s: score(`${p.name} ${p.description ?? ''} ${p.category}`) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);

  if (!kbHits.length && !productHits.length) {
    return (
      "Great question! I can help you pick beans by flavour (fruity, floral, chocolatey, nutty) " +
      'or walk you through a brew setup like V60, French press or espresso. What are you brewing with?'
    );
  }

  const parts: string[] = [];
  for (const { k } of kbHits) parts.push(`**${k.title}**\n${k.content}`);
  if (productHits.length) {
    parts.push(
      'From our shop:\n' +
        productHits.map(({ p }) => `• ${p.name} — ${Number(p.price).toFixed(2)} QAR`).join('\n'),
    );
  }
  return parts.join('\n\n');
}

function textStream(text: string) {
  const encoder = new TextEncoder();
  const chunks = text.match(/\S+\s*/g) ?? [text];
  return new ReadableStream({
    async start(controller) {
      for (const c of chunks) {
        controller.enqueue(encoder.encode(c));
        await new Promise((r) => setTimeout(r, 18));
      }
      controller.close();
    },
  });
}

function openAiToTextStream(body: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const data = line.trim().replace(/^data:\s*/, '');
          if (!data || data === '[DONE]') continue;
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch {
            // partial JSON line — wait for more data
          }
        }
      },
    }),
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS });

  let payload: { messages?: unknown; lang?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const messages = sanitize(payload.messages);
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) {
    return new Response(JSON.stringify({ error: 'No user message' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const [{ data: products }, { data: knowledge }] = await Promise.all([
    supabase.from('products').select('name, description, price, category').order('display_order'),
    supabase
      .from('ai_knowledge_base')
      .select('category, title, content')
      .eq('is_active', true)
      .order('category'),
  ]);

  const streamHeaders = { ...CORS, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' };
  const apiKey = Deno.env.get('OPENAI_API_KEY');

  if (!apiKey) {
    const answer = fallbackAnswer(lastUser.content, products ?? [], knowledge ?? []);
    return new Response(textStream(answer), { headers: streamHeaders });
  }

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
      stream: true,
      temperature: 0.6,
      max_tokens: 600,
      messages: [
        { role: 'system', content: buildContext(products ?? [], knowledge ?? [], payload.lang ?? 'en') },
        ...messages,
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    console.error('OpenAI error', upstream.status, await upstream.text().catch(() => ''));
    const answer = fallbackAnswer(lastUser.content, products ?? [], knowledge ?? []);
    return new Response(textStream(answer), { headers: streamHeaders });
  }

  return new Response(openAiToTextStream(upstream.body), { headers: streamHeaders });
});
