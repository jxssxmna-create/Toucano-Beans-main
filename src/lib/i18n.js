import { extractTastingNotes } from './productCatalog';

export const BRAND_EN = 'Toucano Beans';
export const BRAND_AR = 'توكانو بينز';

const BRAND_VARIANTS = /toucano\s+beans|تو?كانو\s*بي?ن[زس]/gi;

/** In Arabic, every brand mention (Latin or loose Arabic spelling) becomes the canonical توكانو بينز. */
export function enforceBrand(text, lang) {
  if (lang !== 'ar' || !text) return text;
  return String(text).replace(BRAND_VARIANTS, BRAND_AR);
}

/** Paragraph direction for a text leaf. Structural wrappers stay LTR so layout never mirrors. */
export function textDir(lang) {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/** Picks the Arabic column when viewing in Arabic and it has content; otherwise the English source. */
function pick(en, ar, lang) {
  const value = lang === 'ar' && ar && String(ar).trim() ? ar : en;
  return enforceBrand(value || '', lang);
}

export function productName(product, lang) {
  return pick(product?.name, product?.name_ar, lang);
}

export function productDescription(product, lang) {
  return pick(product?.description, product?.description_ar, lang);
}

export function productTastingNotes(product, lang) {
  if (lang === 'ar' && product?.description_ar) {
    const ar = product.description_ar.match(/ملاحظات التذوق\s*[:：]\s*(.+)/)?.[1]?.trim();
    if (ar) return enforceBrand(ar, lang);
  }
  return enforceBrand(extractTastingNotes(product), lang);
}

export function recipeTitle(recipe, lang) {
  return pick(recipe?.title, recipe?.title_ar, lang);
}

export function recipeBody(recipe, lang) {
  return pick(recipe?.body, recipe?.body_ar, lang);
}
