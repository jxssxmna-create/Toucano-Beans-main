import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from './supabaseClient';

const CHAT_URL = `${SUPABASE_URL}/functions/v1/ai-barista`;

export const KB_CATEGORIES = [
  { id: 'flavor_profiles', en: 'Bean flavor profiles', ar: 'نكهات الحبوب' },
  { id: 'brewing', en: 'Brewing setup advice', ar: 'نصائح التحضير' },
  { id: 'promotions', en: 'Promotions & prompts', ar: 'العروض والتوجيهات' },
  { id: 'general', en: 'General', ar: 'عام' },
];

/** Streams the barista reply; calls onChunk(text) as tokens arrive and resolves with the full text. */
export async function streamBaristaReply({ messages, lang, onChunk, signal }) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || SUPABASE_ANON_KEY;

  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, lang }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Barista unavailable (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onChunk?.(chunk);
  }
  return full;
}

export async function fetchKnowledge() {
  const { data, error } = await supabase
    .from('ai_knowledge_base')
    .select('*')
    .order('category')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveKnowledge({ id, category, title, content, is_active }) {
  const row = { category, title, content, is_active };
  const query = id
    ? supabase.from('ai_knowledge_base').update(row).eq('id', id)
    : supabase.from('ai_knowledge_base').insert(row);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function deleteKnowledge(id) {
  const { error } = await supabase.from('ai_knowledge_base').delete().eq('id', id);
  if (error) throw error;
}
