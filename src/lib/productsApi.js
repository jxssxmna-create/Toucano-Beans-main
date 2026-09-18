import { supabase, isSupabaseConfigured } from './supabaseClient';

export const PRODUCT_CATEGORIES = [
  { id: 'coffee-beans', labelEn: 'Coffee Beans', labelAr: 'حبوب القهوة' },
  { id: 'drip-coffee', labelEn: 'Drip Coffee', labelAr: 'القهوة المقطرة' },
  { id: 'essentials', labelEn: 'Coffee Essentials', labelAr: 'مستلزمات القهوة' },
];

export const PRODUCT_IMAGES_BUCKET = 'product-images';

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }
}

export async function fetchProducts(category) {
  assertConfigured();
  let query = supabase
    .from('products')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createProduct(payload) {
  assertConfigured();
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, updates) {
  assertConfigured();
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  assertConfigured();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

/** Upload image file → public URL */
export async function uploadProductImage(file) {
  assertConfigured();
  if (!file) throw new Error('No image selected.');

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export function storagePathFromPublicUrl(url) {
  if (!url) return null;
  const marker = `/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function deleteProductImage(imageUrl) {
  assertConfigured();
  const path = storagePathFromPublicUrl(imageUrl);
  if (!path) return;
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
  if (error) console.warn('[productsApi] image delete failed:', error.message);
}

/** Swap display_order between two products in the same category. */
export async function swapProductOrder(productA, productB) {
  assertConfigured();
  if (!productA || !productB || productA.category !== productB.category) {
    throw new Error('Can only reorder products within the same category.');
  }

  const orderA = productA.display_order;
  const orderB = productB.display_order;

  const { error: err1 } = await supabase
    .from('products')
    .update({ display_order: orderB })
    .eq('id', productA.id);
  if (err1) throw err1;

  const { error: err2 } = await supabase
    .from('products')
    .update({ display_order: orderA })
    .eq('id', productB.id);
  if (err2) throw err2;
}

export async function nextDisplayOrder(category) {
  assertConfigured();
  const { data, error } = await supabase
    .from('products')
    .select('display_order')
    .eq('category', category)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.display_order ?? -1) + 1;
}
