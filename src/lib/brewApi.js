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

export async function fetchGrinders({ activeOnly = false } = {}) {
  assertConfigured();
  let q = supabase.from('grinders').select('*').order('sort_order').order('name');
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function fetchGrinderProductIds(grinderId) {
  assertConfigured();
  if (!grinderId) return [];
  const { data, error } = await supabase
    .from('grinder_products')
    .select('product_id')
    .eq('grinder_id', grinderId);
  if (error) throw error;
  return (data || []).map((r) => r.product_id);
}

export async function setGrinderProducts(grinderId, productIds = []) {
  assertConfigured();
  const { error: delErr } = await supabase.from('grinder_products').delete().eq('grinder_id', grinderId);
  if (delErr) throw delErr;
  const rows = [...new Set(productIds.filter(Boolean))].map((product_id) => ({
    grinder_id: grinderId,
    product_id,
  }));
  if (!rows.length) return [];
  const { data, error } = await supabase.from('grinder_products').insert(rows).select('product_id');
  if (error) throw error;
  return (data || []).map((r) => r.product_id);
}

export async function upsertGrinder(row) {
  assertConfigured();
  const payload = {
    name: row.name.trim(),
    name_ar: row.name_ar?.trim() || null,
    slug: row.slug?.trim() || slugify(row.name),
    sort_order: Number(row.sort_order) || 0,
    is_active: row.is_active !== false,
  };
  const query = row.id
    ? supabase.from('grinders').update(payload).eq('id', row.id)
    : supabase.from('grinders').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error) throw error;

  if (Array.isArray(row.product_ids)) {
    await setGrinderProducts(data.id, row.product_ids);
  }
  return { ...data, product_ids: Array.isArray(row.product_ids) ? row.product_ids : undefined };
}

export async function deleteGrinder(id) {
  assertConfigured();
  const { error } = await supabase.from('grinders').delete().eq('id', id);
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
    .not('grinder_id', 'is', null)
    .not('method_id', 'is', null)
    .order('display_order');
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function upsertBrewRecipe(row, { userId } = {}) {
  assertConfigured();
  const grinderName = row.grinder_name || 'Recipe';
  const methodName = row.method_name || '';
  const payload = {
    title: `${grinderName} · ${methodName}`.trim(),
    body: row.body || '',
    grinder_id: row.grinder_id,
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
  if (!isSupabaseConfigured) {
    return { grinders: [], methods: [], recipes: [], productsByGrinder: {} };
  }
  const [grinders, methods, recipes] = await Promise.all([
    fetchGrinders({ activeOnly: true }),
    fetchRecipeMethods({ activeOnly: true }),
    fetchBrewRecipes({ activeOnly: true }),
  ]);

  const productsByGrinder = {};
  if (grinders.length) {
    const { data: links, error } = await supabase
      .from('grinder_products')
      .select('grinder_id, product_id, products(id, name, name_ar, image_url, category, price, weight)')
      .in(
        'grinder_id',
        grinders.map((g) => g.id)
      );
    if (error) throw error;
    for (const row of links || []) {
      if (!productsByGrinder[row.grinder_id]) productsByGrinder[row.grinder_id] = [];
      if (row.products) productsByGrinder[row.grinder_id].push(row.products);
    }
  }

  return { grinders, methods, recipes, productsByGrinder };
}
