/**
 * Full storefront catalog (fallback + seed source).
 * Categories: coffee-beans | drip-coffee | essentials
 */

function beanDesc({ acidity, sweetness, body, flavor, origin, region, process, tasting, rating, altitude, variety, roastNote }) {
  return [
    'Coffee Details',
    '',
    `* Acidity: ${acidity}`,
    `* Sweetness: ${sweetness}`,
    `* Body: ${body}`,
    '',
    `Flavor profile: ${flavor}`,
    '',
    'More Information',
    '',
    `* Origin: ${origin}`,
    `* Region: ${region}`,
    `* Processing Method: ${process}`,
    `* Tasting Notes: ${tasting}`,
    `* Rating: ${rating}`,
    `* Altitude: ${altitude}`,
    `* Variety: ${variety}`,
    '',
    "Roaster's Description",
    '',
    `“${roastNote}”`,
  ].join('\n');
}

export const PRODUCT_CATALOG = [
  {
    id: 'catalog-guji',
    name: 'Guji',
    category: 'coffee-beans',
    price: 80,
    tastingNotes: 'Jasmine – Blueberry – Papaya – Milk Chocolate',
    image_url:
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800',
    display_order: 0,
    description: beanDesc({
      acidity: 'Medium-bright',
      sweetness: 'Low',
      body: 'Full',
      flavor: 'Floral and fruity',
      origin: 'Ethiopia',
      region: 'Guji',
      process: 'Washed',
      tasting: 'Jasmine – Blueberry – Papaya – Milk Chocolate',
      rating: '87',
      altitude: '1,800–2,200 m',
      variety: 'Heirloom',
      roastNote:
        'A fruity and bright coffee that offers a classic Ethiopian experience. Smooth and delicious, suitable for filter and iced coffee, and for those who enjoy light coffees.',
    }),
  },
  {
    id: 'catalog-yirgacheffe',
    name: 'Yirgacheffe',
    category: 'coffee-beans',
    price: 85,
    tastingNotes: 'Bergamot – Lemon – Honey – Floral',
    image_url:
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800',
    display_order: 1,
    description: beanDesc({
      acidity: 'Bright',
      sweetness: 'Medium',
      body: 'Silky',
      flavor: 'Citrus and floral',
      origin: 'Ethiopia',
      region: 'Yirgacheffe',
      process: 'Washed',
      tasting: 'Bergamot – Lemon – Honey – Floral',
      rating: '88',
      altitude: '1,900–2,200 m',
      variety: 'Heirloom',
      roastNote:
        'Elegant and aromatic — a landmark Ethiopian cup with sparkling citrus and a clean floral finish. Ideal for pour-over.',
    }),
  },
  {
    id: 'catalog-colombia',
    name: 'Colombia',
    category: 'coffee-beans',
    price: 70,
    tastingNotes: 'Caramel – Red Apple – Cocoa – Nut',
    image_url:
      'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&q=80&w=800',
    display_order: 2,
    description: beanDesc({
      acidity: 'Medium',
      sweetness: 'High',
      body: 'Medium-full',
      flavor: 'Sweet and balanced',
      origin: 'Colombia',
      region: 'Huila',
      process: 'Washed',
      tasting: 'Caramel – Red Apple – Cocoa – Nut',
      rating: '85',
      altitude: '1,500–1,900 m',
      variety: 'Caturra / Castillo',
      roastNote:
        'A classic balanced Colombian roast — caramel sweetness with soft fruit and a comforting cocoa finish. Excellent daily drinker.',
    }),
  },
  {
    id: 'catalog-brazil',
    name: 'Brazil Cerrado',
    category: 'coffee-beans',
    price: 65,
    tastingNotes: 'Chocolate – Hazelnut – Brown Sugar',
    image_url:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
    display_order: 3,
    description: beanDesc({
      acidity: 'Low',
      sweetness: 'High',
      body: 'Creamy',
      flavor: 'Nutty chocolate',
      origin: 'Brazil',
      region: 'Cerrado Mineiro',
      process: 'Natural',
      tasting: 'Chocolate – Hazelnut – Brown Sugar',
      rating: '84',
      altitude: '900–1,200 m',
      variety: 'Yellow Bourbon',
      roastNote:
        'Smooth and chocolate-forward with low acidity — perfect for espresso, milk drinks, and anyone who prefers a richer cup.',
    }),
  },
  {
    id: 'catalog-kenya',
    name: 'Kenya AA',
    category: 'coffee-beans',
    price: 90,
    tastingNotes: 'Blackcurrant – Tomato – Grapefruit – Brown Sugar',
    image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800',
    display_order: 4,
    description: beanDesc({
      acidity: 'High',
      sweetness: 'Medium',
      body: 'Juicy',
      flavor: 'Bold berry and citrus',
      origin: 'Kenya',
      region: 'Nyeri',
      process: 'Washed',
      tasting: 'Blackcurrant – Tomato – Grapefruit – Brown Sugar',
      rating: '89',
      altitude: '1,700–1,900 m',
      variety: 'SL28 / SL34',
      roastNote:
        'Vibrant and complex Kenyan AA with signature blackcurrant brightness. Best as filter for those who love lively acidity.',
    }),
  },
  {
    id: 'catalog-drip-signature',
    name: 'Signature Drip Box',
    category: 'drip-coffee',
    price: 45,
    tastingNotes: 'Honey – Orange – Soft Cocoa',
    image_url:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
    display_order: 0,
    description:
      'Ready-to-brew drip bags with our house blend.\n\n* Pack: 10 sachets\n* Roast: Medium\n* Brew time: ~3 minutes\n* Tasting Notes: Honey – Orange – Soft Cocoa\n\nNo equipment needed — just hot water and a mug. Balanced sweetness for everyday mornings.',
  },
  {
    id: 'catalog-drip-dark',
    name: 'Dark Roast Drip Box',
    category: 'drip-coffee',
    price: 45,
    tastingNotes: 'Dark Chocolate – Molasses – Smoke',
    image_url:
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800',
    display_order: 1,
    description:
      'Bold single-serve drip bags for a deeper cup.\n\n* Pack: 10 sachets\n* Roast: Dark\n* Brew time: ~3 minutes\n* Tasting Notes: Dark Chocolate – Molasses – Smoke\n\nRich and comforting — ideal after meals or for those who prefer intensity.',
  },
  {
    id: 'catalog-drip-ethiopia',
    name: 'Ethiopia Drip Pack',
    category: 'drip-coffee',
    price: 52,
    tastingNotes: 'Jasmine – Peach – Bergamot',
    image_url:
      'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&q=80&w=800',
    display_order: 2,
    description:
      'Light-roast Ethiopian drip bags highlighting floral clarity.\n\n* Pack: 8 sachets\n* Roast: Light\n* Origin: Ethiopia\n* Tasting Notes: Jasmine – Peach – Bergamot\n\nSpecialty filter character in an on-the-go format.',
  },
  {
    id: 'catalog-drip-colombia',
    name: 'Colombia Drip Pack',
    category: 'drip-coffee',
    price: 48,
    tastingNotes: 'Caramel – Apple – Cocoa',
    image_url:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800',
    display_order: 3,
    description:
      'Sweet Colombian drip sachets for a balanced mid-day brew.\n\n* Pack: 8 sachets\n* Roast: Medium\n* Origin: Colombia\n* Tasting Notes: Caramel – Apple – Cocoa\n\nSmooth, approachable, and travel-friendly.',
  },
  {
    id: 'catalog-kettle',
    name: 'Pour-Over Kettle',
    category: 'essentials',
    price: 180,
    tastingNotes: null,
    image_url:
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=800',
    display_order: 0,
    description:
      'Gooseneck stainless-steel kettle for precise pour-over control.\n\n* Capacity: 1.0 L\n* Material: Brushed stainless steel\n* Spout: Narrow gooseneck\n\nDesigned for even saturation and repeatable filter brewing at home.',
  },
  {
    id: 'catalog-grinder',
    name: 'Manual Coffee Grinder',
    category: 'essentials',
    price: 140,
    tastingNotes: null,
    image_url:
      'https://images.unsplash.com/photo-1610889556528-9a770639fc2b?auto=format&fit=crop&q=80&w=800',
    display_order: 1,
    description:
      'Hand grinder with adjustable ceramic burrs for espresso to French press.\n\n* Burrs: Ceramic conical\n* Grind range: Fine → coarse\n* Body: Portable metal housing\n\nFresh grounds every cup — compact enough for travel.',
  },
  {
    id: 'catalog-dripper',
    name: 'Ceramic Pour-Over Dripper',
    category: 'essentials',
    price: 95,
    tastingNotes: null,
    image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800',
    display_order: 2,
    description:
      'V-shaped ceramic dripper that holds heat for cleaner extraction.\n\n* Size: 1–2 cups\n* Material: Glazed ceramic\n* Compatible: Standard cone filters\n\nA simple, durable brew tool for everyday filter coffee.',
  },
  {
    id: 'catalog-scale',
    name: 'Brew Scale',
    category: 'essentials',
    price: 120,
    tastingNotes: null,
    image_url:
      'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=800',
    display_order: 3,
    description:
      'Compact digital scale with 0.1 g precision and built-in timer.\n\n* Precision: 0.1 g\n* Capacity: 2 kg\n* Features: Timer, tare, USB charge\n\nDial in ratios for pour-over, espresso, and batch brew.',
  },
  {
    id: 'catalog-filters',
    name: 'Paper Filters (100 pcs)',
    category: 'essentials',
    price: 25,
    tastingNotes: null,
    image_url:
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=800',
    display_order: 4,
    description:
      'Oxygen-bleached cone filters for clean, paper-forward pour-over.\n\n* Count: 100 filters\n* Shape: Cone / V60-compatible\n* Finish: Oxygen bleached\n\nStock up for daily brewing without cardboard aftertaste.',
  },
];

/** Extract tasting notes from structured description text when missing. */
export function extractTastingNotes(product) {
  if (product?.tastingNotes) return product.tastingNotes;
  const text = String(product?.description || '');
  const match = text.match(/\*?\s*Tasting Notes:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

export function catalogByCategory(category) {
  return PRODUCT_CATALOG.filter((p) => p.category === category).sort(
    (a, b) => a.display_order - b.display_order
  );
}

/**
 * Merge local catalog with live Supabase rows.
 * Catalog guarantees a full storefront; matching remote rows (by name) override fields.
 */
export function resolveCategoryProducts(category, remoteProducts = []) {
  const catalog = catalogByCategory(category);
  const remote = Array.isArray(remoteProducts) ? remoteProducts : [];
  if (remote.length === 0) return catalog;

  const unused = new Map(
    remote.map((p) => [String(p.name || '').toLowerCase(), p])
  );

  const merged = catalog.map((c) => {
    const key = c.name.toLowerCase();
    const r = unused.get(key);
    if (!r) return c;
    unused.delete(key);
    return {
      ...c,
      ...r,
      tastingNotes: extractTastingNotes(r) || c.tastingNotes || null,
      image_url: r.image_url || c.image_url,
      description: r.description || c.description,
      price: r.price ?? c.price,
    };
  });

  for (const r of unused.values()) {
    if (r.category && r.category !== category) continue;
    merged.push({
      ...r,
      tastingNotes: extractTastingNotes(r),
      display_order: r.display_order ?? merged.length,
    });
  }

  return merged.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}
