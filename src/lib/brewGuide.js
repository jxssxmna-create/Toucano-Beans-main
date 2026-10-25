export const COPY = {
  en: {
    title: 'Coffee Recipes',
    subtitle: 'Pick your grinder, method, and serve style — then brew with live weights.',
    step1: '1. Choose your setup',
    step2: '2. Brew ratio calculator',
    step3: '3. Recipe steps',
    grinder: 'Grinder',
    method: 'Coffee method',
    temp: 'Temperature / serve style',
    hot: 'Hot ☕',
    iced: 'Cold / Iced 🧊',
    ratio: 'Coffee to water ratio',
    dose: 'Coffee dose',
    water: 'Hot water',
    ice: 'Ice weight',
    total: 'Total liquid',
    grams: 'g',
    pourOverHint: 'Change the ratio or dose — water updates instantly.',
    icedSplit: 'Iced split: hot pour / ice in the server.',
    grindLabel: 'Grind setting',
    pourStages: 'Pouring stages',
    decrease: 'Decrease',
    increase: 'Increase',
    loading: 'Loading recipes…',
    empty: 'No brew guides yet. Add equipment and recipes in the admin panel.',
  },
  ar: {
    title: 'وصفات القهوة',
    subtitle: 'اختر المطحنة والطريقة وأسلوب التقديم — ثم حضّر بأوزان محدّثة مباشرة.',
    step1: '1. اختر إعدادك',
    step2: '2. حاسبة نسبة التحضير',
    step3: '3. خطوات الوصفة',
    grinder: 'المطحنة',
    method: 'طريقة القهوة',
    temp: 'الحرارة / أسلوب التقديم',
    hot: 'ساخن ☕',
    iced: 'بارد / مثلج 🧊',
    ratio: 'نسبة البن إلى الماء',
    dose: 'جرعة البن',
    water: 'الماء الساخن',
    ice: 'وزن الثلج',
    total: 'إجمالي السائل',
    grams: 'غ',
    pourOverHint: 'غيّر النسبة أو الجرعة — يتحدّث الماء فوراً.',
    icedSplit: 'تقسيم المثلج: صب ساخن / ثلج في الإبريق.',
    grindLabel: 'درجة الطحن',
    pourStages: 'مراحل الصب',
    decrease: 'إنقاص',
    increase: 'زيادة',
    loading: 'جاري تحميل الوصفات…',
    empty: 'لا توجد أدلة تحضير بعد. أضف المعدات والوصفات من لوحة التحكم.',
  },
};

export function localizedName(row, lang) {
  if (lang === 'ar' && row?.name_ar?.trim()) return row.name_ar;
  return row?.name || '';
}

export function calcBrew({ dose, ratio, iced, icedShare = 0.6, doseMin = 8, doseMax = 40, ratioMin = 12, ratioMax = 18 }) {
  const coffee = clamp(Number(dose) || 15, doseMin, doseMax);
  const r = clamp(Number(ratio) || 15, ratioMin, ratioMax);
  const share = clamp(Number(icedShare) || 0.6, 0.2, 1);
  const totalWater = Math.round(coffee * r);
  const hotWater = iced ? Math.round(totalWater * share) : totalWater;
  const ice = iced ? totalWater - hotWater : 0;
  const bloom = Math.min(hotWater, Math.round(coffee * 2));
  const mid = iced ? hotWater : Math.round(totalWater * 0.6);
  return { coffee, ratio: r, totalWater, hotWater, ice, bloom, mid };
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function interpolateSteps(template, brew, lang) {
  if (!template?.trim()) return [];
  const g = lang === 'ar' ? 'غ' : 'g';
  const map = {
    coffee: `${brew.coffee}${g}`,
    hotWater: `${brew.hotWater}${g}`,
    ice: `${brew.ice}${g}`,
    bloom: `${brew.bloom}${g}`,
    mid: `${brew.mid}${g}`,
    totalWater: `${brew.totalWater}${g}`,
    ratio: String(brew.ratio),
  };
  return template
    .split('\n')
    .map((line) => line.replace(/\{(coffee|hotWater|ice|bloom|mid|totalWater|ratio)\}/g, (_, k) => map[k]).trim())
    .filter(Boolean);
}

export function pourStages({ temp, brew, lang }) {
  const iced = temp === 'iced';
  const { bloom, mid, hotWater, ice } = brew;
  const g = lang === 'ar' ? 'غ' : 'g';
  if (iced) {
    return lang === 'ar'
      ? [
          { label: 'ثلج في الإبريق', value: `${ice}${g}` },
          { label: 'تزهير', value: `${bloom}${g}` },
          { label: 'إكمال الماء الساخن', value: `${hotWater}${g}` },
        ]
      : [
          { label: 'Ice in server', value: `${ice}${g}` },
          { label: 'Bloom', value: `${bloom}${g}` },
          { label: 'Finish hot pour', value: `${hotWater}${g}` },
        ];
  }
  return lang === 'ar'
    ? [
        { label: 'تزهير', value: `${bloom}${g}` },
        { label: 'الصب الأول', value: `${mid}${g}` },
        { label: 'الهدف النهائي', value: `${hotWater}${g}` },
      ]
    : [
        { label: 'Bloom', value: `${bloom}${g}` },
        { label: 'First pour', value: `${mid}${g}` },
        { label: 'Final target', value: `${hotWater}${g}` },
      ];
}
