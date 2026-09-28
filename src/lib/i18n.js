/** Picks the Arabic column when viewing in Arabic and it has content; otherwise the English source. */
function pick(en, ar, lang) {
  return lang === 'ar' && ar && String(ar).trim() ? ar : en;
}

export function productName(product, lang) {
  return pick(product?.name, product?.name_ar, lang) || '';
}

export function productDescription(product, lang) {
  return pick(product?.description, product?.description_ar, lang) || '';
}

export function recipeTitle(recipe, lang) {
  return pick(recipe?.title, recipe?.title_ar, lang) || '';
}

export function recipeBody(recipe, lang) {
  return pick(recipe?.body, recipe?.body_ar, lang) || '';
}
