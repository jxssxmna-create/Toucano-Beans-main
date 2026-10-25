import { isSupabaseConfigured, supabase } from './supabaseClient';

function assertConfigured() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
}

export function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || `item-${Date.now()}`;
}

export async function fetchEquipment({ activeOnly = false } = {}) {
  assertConfigured();
  let q = supabase.from('equipment').select('*').order('sort_order').order('name');
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function upsertEquipment(row) {
  assertConfigured();
  const payload = {
    name: row.name.trim(),
    name_ar: row.name_ar?.trim() || null,
    slug: row.slug?.trim() || slugify(row.name),
    sort_order: Number(row.sort_order) || 0,
    is_active: row.is_active !== false,
  };
  const query = row.id
    ? supabase.from('equipment').update(payload).eq('id', row.id)
    : supabase.from('equipment').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteEquipment(id) {
  assertConfigured();
  const { error } = await supabase.from('equipment').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchRecipeMethods({ activeOnly = false } = {}) {
  assertConfigured();
  let q = supabase.from('recipe_methods').select('*').order('sort_order').order('name');
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function upsertRecipeMethod(row) {
  assertConfigured();
  const payload = {
    name: row.name.trim(),
    name_ar: row.name_ar?.trim() || null,
    slug: row.slug?.trim() || slugify(row.name),
    show_calculator: Boolean(row.show_calculator),
    sort_order: Number(row.sort_order) || 0,
    is_active: row.is_active !== false,
  };
  const query = row.id
    ? supabase.from('recipe_methods').update(payload).eq('id', row.id)
    : supabase.from('recipe_methods').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteRecipeMethod(id) {
  assertConfigured();
  const { error } = await supabase.from('recipe_methods').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchBrewRecipes({ activeOnly = false } = {}) {
  assertConfigured();
  let q = supabase
    .from('recipes')
    .select('*')
    .not('equipment_id', 'is', null)
    .not('method_id', 'is', null)
    .order('display_order');
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function upsertBrewRecipe(row, { userId } = {}) {
  assertConfigured();
  const eqName = row.equipment_name || 'Recipe';
  const methodName = row.method_name || '';
  const payload = {
    title: `${eqName} · ${methodName}`.trim(),
    body: row.body || '',
    equipment_id: row.equipment_id,
    method_id: row.method_id,
    default_ratio: Number(row.default_ratio) || 15,
    default_dose_g: Number(row.default_dose_g) || 15,
    ratio_min: Number(row.ratio_min) || (Number(row.default_ratio) <= 4 ? 1 : 12),
    ratio_max: Number(row.ratio_max) || (Number(row.default_ratio) <= 4 ? 4 : 18),
    dose_min: Number(row.dose_min) || 8,
    dose_max: Number(row.dose_max) || 40,
    iced_hot_share: Number(row.iced_hot_share) || 0.6,
    grind_en: row.grind_en?.trim() || null,
    grind_ar: row.grind_ar?.trim() || null,
    steps_hot_en: row.steps_hot_en?.trim() || null,
    steps_hot_ar: row.steps_hot_ar?.trim() || null,
    steps_iced_en: row.steps_iced_en?.trim() || null,
    steps_iced_ar: row.steps_iced_ar?.trim() || null,
    is_active: row.is_active !== false,
    display_order: Number(row.display_order) || 0,
  };
  if (!row.id && userId) payload.created_by = userId;
  const query = row.id
    ? supabase.from('recipes').update(payload).eq('id', row.id)
    : supabase.from('recipes').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteBrewRecipe(id) {
  assertConfigured();
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPublicBrewCatalog() {
  if (!isSupabaseConfigured) return { equipment: [], methods: [], recipes: [] };
  const [equipment, methods, recipes] = await Promise.all([
    fetchEquipment({ activeOnly: true }),
    fetchRecipeMethods({ activeOnly: true }),
    fetchBrewRecipes({ activeOnly: true }),
  ]);
  return { equipment, methods, recipes };
}
