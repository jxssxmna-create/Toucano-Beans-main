/** Extract tasting notes from structured description text when missing. */
export function extractTastingNotes(product) {
  if (product?.tastingNotes) return product.tastingNotes;
  const text = String(product?.description || '');
  const match = text.match(/\*?\s*Tasting Notes:\s*(.+)/i);
  return match ? match[1].trim() : null;
}
