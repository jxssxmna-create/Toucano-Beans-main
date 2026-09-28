import { supabase } from './supabaseClient';

/**
 * Admin-only auto-translation via the `translate` edge function.
 * @param {Record<string,string>} fields  e.g. { name: 'Guji', description: '…' }
 * @returns {Promise<Record<string,string>>}
 */
export async function translateFields(fields, { source = 'en', target = 'ar', context = 'product listing' } = {}) {
  const { data, error } = await supabase.functions.invoke('translate', {
    body: { fields, source, target, context },
  });
  if (error) {
    let message = error.message;
    try {
      message = (await error.context?.json())?.error || message;
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }
  return data?.translations || {};
}
