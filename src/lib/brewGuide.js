export const GRINDERS = ['hand', 'electric', 'preground'];
export const METHODS = ['v60', 'aeropress', 'french-press', 'espresso', 'drip-bag'];
export const TEMPS = ['hot', 'iced'];

export const METHODS_BY_GRINDER = {
  hand: ['v60', 'aeropress', 'french-press', 'espresso', 'drip-bag'],
  electric: ['v60', 'aeropress', 'french-press', 'drip-bag'],
  preground: ['aeropress', 'french-press', 'drip-bag'],
};

export const POUR_OVER_METHODS = ['v60'];

export const RATIO_MIN = 12;
export const RATIO_MAX = 18;
export const RATIO_DEFAULT = 15;
export const DOSE_MIN = 8;
export const DOSE_MAX = 40;
export const DOSE_DEFAULT = 15;
export const ICED_HOT_SHARE = 0.6;

const GRIND = {
  hand: {
    v60: { en: 'Comandante 18–22 clicks · Timemore C2 15–18 clicks (medium-fine)', ar: 'كومانانتي 18–22 نقرة · تايمور C2 15–18 نقرة (متوسط ناعم)' },
    aeropress: { en: 'Comandante 16–20 clicks · Timemore C2 13–16 clicks (fine-medium)', ar: 'كومانانتي 16–20 نقرة · تايمور C2 13–16 نقرة (ناعم إلى متوسط)' },
    'french-press': { en: 'Comandante 28–32 clicks · Timemore C2 22–26 clicks (coarse)', ar: 'كومانانتي 28–32 نقرة · تايمور C2 22–26 نقرة (خشن)' },
    espresso: { en: 'Comandante 8–12 clicks · Timemore C2 8–10 clicks (fine, dial in)', ar: 'كومانانتي 8–12 نقرة · تايمور C2 8–10 نقرات (ناعم، اضبط حسب الطعم)' },
    'drip-bag': { en: 'Comandante 20–24 clicks · Timemore C2 16–20 clicks (medium)', ar: 'كومانانتي 20–24 نقرة · تايمور C2 16–20 نقرة (متوسط)' },
  },
  electric: {
    v60: { en: 'Fellow Ode 4–5 · Baratza Encore 15–18 (medium-fine)', ar: 'Fellow Ode 4–5 · Baratza Encore 15–18 (متوسط ناعم)' },
    aeropress: { en: 'Fellow Ode 3–4 · Baratza Encore 12–15 (fine-medium)', ar: 'Fellow Ode 3–4 · Baratza Encore 12–15 (ناعم إلى متوسط)' },
    'french-press': { en: 'Fellow Ode 7–8 · Baratza Encore 28–32 (coarse)', ar: 'Fellow Ode 7–8 · Baratza Encore 28–32 (خشن)' },
    'drip-bag': { en: 'Fellow Ode 5 · Baratza Encore 18 (medium)', ar: 'Fellow Ode 5 · Baratza Encore 18 (متوسط)' },
  },
  preground: {
    aeropress: { en: 'Use a medium pre-ground bag, or the “filter” grind from Toucano Beans', ar: 'استخدم بنّاً مطحوناً بدرجة متوسطة، أو طحن «فلتر» من توكانو بينز' },
    'french-press': { en: 'Use a coarse pre-ground bag labelled French press / cafetière', ar: 'استخدم بنّاً مطحوناً خشناً مخصصاً للفرنش برس' },
    'drip-bag': { en: 'Use the grind already in the Toucano Beans drip disc — no extra grinding', ar: 'استخدم الطحن الموجود داخل قرص دريب توكانو بينز — لا تحتاج طحناً إضافياً' },
  },
};

export function grindAdvice(grinder, method, lang) {
  return GRIND[grinder]?.[method]?.[lang] || GRIND[grinder]?.[method]?.en || '';
}

export function calcBrew({ dose, ratio, iced }) {
  const coffee = clamp(Number(dose) || DOSE_DEFAULT, DOSE_MIN, DOSE_MAX);
  const r = clamp(Number(ratio) || RATIO_DEFAULT, RATIO_MIN, RATIO_MAX);
  const totalWater = Math.round(coffee * r);
  const hotWater = iced ? Math.round(totalWater * ICED_HOT_SHARE) : totalWater;
  const ice = iced ? totalWater - hotWater : 0;
  const bloom = Math.min(hotWater, Math.round(coffee * 2));
  const mid = iced ? hotWater : Math.round(totalWater * 0.6);
  return { coffee, ratio: r, totalWater, hotWater, ice, bloom, mid };
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

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
    grinders: {
      hand: 'Hand Grinder (Comandante / Timemore)',
      electric: 'Electric Grinder (Fellow Ode / Baratza Encore)',
      preground: 'Pre-Ground Coffee',
    },
    methods: {
      v60: 'V60 Pour Over',
      aeropress: 'Aeropress',
      'french-press': 'French Press',
      espresso: 'Espresso',
      'drip-bag': 'Disc Drip Bag',
    },
    ratio: 'Coffee to water ratio',
    dose: 'Coffee dose',
    water: 'Hot water',
    ice: 'Ice weight',
    total: 'Total liquid',
    grams: 'g',
    pourOverHint: 'Default 1:15. Change the ratio or dose — water updates instantly.',
    icedSplit: 'Iced split: 60% hot pour / 40% ice in the server.',
    grindLabel: 'Grind setting',
    pourStages: 'Pouring stages',
    decrease: 'Decrease',
    increase: 'Increase',
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
    grinders: {
      hand: 'مطحنة يدوية (كومانانتي / تايمور)',
      electric: 'مطحنة كهربائية (Fellow Ode / Baratza Encore)',
      preground: 'بن مطحون جاهز',
    },
    methods: {
      v60: 'تقطير V60',
      aeropress: 'إيروبرس',
      'french-press': 'فرنش برس',
      espresso: 'إسبريسو',
      'drip-bag': 'كيس دريب القرص',
    },
    ratio: 'نسبة البن إلى الماء',
    dose: 'جرعة البن',
    water: 'الماء الساخن',
    ice: 'وزن الثلج',
    total: 'إجمالي السائل',
    grams: 'غ',
    pourOverHint: 'الافتراضي 1:15. غيّر النسبة أو الجرعة — يتحدّث الماء فوراً.',
    icedSplit: 'تقسيم المثلج: 60٪ صب ساخن / 40٪ ثلج في الإبريق.',
    grindLabel: 'درجة الطحن',
    pourStages: 'مراحل الصب',
    decrease: 'إنقاص',
    increase: 'زيادة',
  },
};

export function recipeSteps({ method, temp, brew, lang }) {
  const iced = temp === 'iced';
  const { coffee, hotWater, ice, bloom, mid, totalWater } = brew;
  const g = lang === 'ar' ? 'غ' : 'g';
  const ml = lang === 'ar' ? 'مل' : 'ml';

  if (method === 'v60') {
    if (iced) {
      return lang === 'ar'
        ? [
            `ضع ${ice}${g} ثلج في إبريق التقديم.`,
            'اشطف ورقة الفلتر فوق المغسلة حتى لا يذوب الثلج.',
            `أضف ${coffee}${g} بن ومهّد السطح.`,
            `التزهير: صب ${bloom}${g} ماء عند 92–94°م وانتظر 30–45 ثانية.`,
            `أكمل الصب حتى ${hotWater}${g} ماء ساخن على دفعتين حتى الدقيقة 2:00.`,
            'حرّك الإبريق بلطف ليذوب الثلج وقدّم فور انتهاء التقطير.',
          ]
        : [
            `Add ${ice}${g} of ice to the serving vessel.`,
            'Rinse the paper filter over the sink so meltwater does not dilute the ice.',
            `Add ${coffee}${g} coffee and level the bed.`,
            `Bloom: pour ${bloom}${g} water at 92–94°C and wait 30–45 seconds.`,
            `Continue pouring to ${hotWater}${g} hot water in two pulses by 2:00.`,
            'Gently swirl the server to melt the ice and serve when drawdown finishes.',
          ];
    }
    return lang === 'ar'
      ? [
          'اشطف الفلتر وسخّن الوعاء. أفرغ ماء الشطف.',
          `أضف ${coffee}${g} بن ومهّد السطح.`,
          `التزهير: صب ${bloom}${g} ماء عند 92–96°م وانتظر 30–45 ثانية.`,
          `الصب الأول: أوصل الوزن إلى ${mid}${g} حتى الدقيقة 1:15.`,
          `الصب الثاني: أكمل إلى ${hotWater}${g} حتى الدقيقة 2:00.`,
          'اترك التقطير ينتهي بين 2:30 و3:30 ثم حرّك وقدّم.',
        ]
      : [
          'Rinse the filter and preheat the server. Discard the rinse water.',
          `Add ${coffee}${g} coffee and level the bed.`,
          `Bloom: pour ${bloom}${g} water at 92–96°C and wait 30–45 seconds.`,
          `First pour: take the scale to ${mid}${g} by 1:15.`,
          `Second pour: finish at ${hotWater}${g} by 2:00.`,
          'Let drawdown finish between 2:30 and 3:30, swirl, and serve.',
        ];
  }

  if (method === 'aeropress') {
    const water = iced ? Math.round(coffee * 10) : Math.round(coffee * 14);
    const iceW = iced ? Math.round(coffee * 6) : 0;
    return lang === 'ar'
      ? iced
        ? [
            `ضع ${iceW}${g} ثلج في الكوب.`,
            'ركّب الإيروبرس وضع الفلتر المبلل (الوضع العادي).',
            `أضف ${coffee}${g} بن ثم صب ${water}${g} ماء عند 85–90°م.`,
            'حرّك 5 ثوانٍ وانتظر 60 ثانية.',
            'اضغط بلطف لمدة 20–30 ثانية فوق الثلج وقدّم.',
          ]
        : [
            'ركّب الإيروبرس وضع الفلتر المبلل (الوضع العادي).',
            `أضف ${coffee}${g} بن ثم صب ${water}${g} ماء عند 85–92°م.`,
            'حرّك 8 ثوانٍ وانتظر 60–90 ثانية.',
            'اضغط بلطف لمدة 20–30 ثانية وتوقف عند صوت الفقاعات.',
            'قدّم فوراً أو خفّف بقليل من الماء الساخن حسب الرغبة.',
          ]
      : iced
        ? [
            `Add ${iceW}${g} of ice to the cup.`,
            'Assemble the Aeropress with a rinsed paper (standard position).',
            `Add ${coffee}${g} coffee, then pour ${water}${g} water at 85–90°C.`,
            'Stir for 5 seconds and steep 60 seconds.',
            'Press gently for 20–30 seconds over the ice and serve.',
          ]
        : [
            'Assemble the Aeropress with a rinsed paper (standard position).',
            `Add ${coffee}${g} coffee, then pour ${water}${g} water at 85–92°C.`,
            'Stir for 8 seconds and steep 60–90 seconds.',
            'Press gently for 20–30 seconds and stop at the hiss.',
            'Serve as-is, or top with a splash of hot water to taste.',
          ];
  }

  if (method === 'french-press') {
    const water = Math.round(coffee * 15);
    const iceW = iced ? Math.round(water * 0.4) : 0;
    const hot = iced ? water - iceW : water;
    return lang === 'ar'
      ? iced
        ? [
            `ضع ${iceW}${g} ثلج في إبريق التقديم.`,
            `أضف ${coffee}${g} بن خشن إلى الدورق.`,
            `صب ${hot}${g} ماء عند 94°م، حرّك بلطف، وانقع 4 دقائق.`,
            'اكسر القشرة ثم اغمر المكبس ببطء.',
            'صب فوراً فوق الثلج حتى لا تستمر المرارة.',
          ]
        : [
            `سخّن الدورق ثم أضف ${coffee}${g} بن خشن.`,
            `صب ${water}${g} ماء عند 94°م وحرّك مرة واحدة.`,
            'ضع الغطاء دون ضغط وانقع 4 دقائق.',
            'اكسر القشرة واغرف الرغوة إن أحببت.',
            'اغمر المكبس ببطء وصب فوراً.',
          ]
      : iced
        ? [
            `Add ${iceW}${g} of ice to a serving jug.`,
            `Add ${coffee}${g} coarse coffee to the carafe.`,
            `Pour ${hot}${g} water at 94°C, stir once, and steep 4 minutes.`,
            'Break the crust, then plunge slowly.',
            'Decant immediately over the ice so it does not keep extracting.',
          ]
        : [
            `Preheat the carafe, then add ${coffee}${g} coarse coffee.`,
            `Pour ${water}${g} water at 94°C and stir once.`,
            'Rest the lid on top without plunging and steep 4 minutes.',
            'Break the crust and skim foam if you like.',
            'Plunge slowly and pour immediately.',
          ];
  }

  if (method === 'espresso') {
    const out = Math.round(coffee * 2);
    return lang === 'ar'
      ? iced
        ? [
            `اطحن ${coffee}${g} ناعم جداً ووزّعها في السلة.`,
            `استهدف ${out}${g} إسبريسو خلال 25–32 ثانية.`,
            'صب مباشرة فوق كوب فيه ثلج، أو ابنِ مشروباً مثلجاً بالحليب.',
            'إن كان بارداً جداً قصّر النسبة قليلاً؛ إن كان حامضاً اطحن أنعم.',
          ]
        : [
            `اطحن ${coffee}${g} ناعم جداً ووزّعها في السلة.`,
            `استهدف ${out}${g} في الكوب خلال 25–32 ثانية (نسبة 1:2).`,
            'قدّم فوراً، أو أضف ماء ساخناً لأمريكانو.',
            'إن كان مراً اطحن أخشن أو قصّر الوقت؛ إن كان حامضاً اطحن أنعم.',
          ]
      : iced
        ? [
            `Grind ${coffee}${g} very fine and distribute in the basket.`,
            `Target ${out}${g} espresso in 25–32 seconds.`,
            'Pour over a glass of ice, or build an iced milk drink.',
            'If it tastes hollow, shorten the ratio; if sour, grind finer.',
          ]
        : [
            `Grind ${coffee}${g} very fine and distribute in the basket.`,
            `Target ${out}${g} in the cup in 25–32 seconds (1:2 ratio).`,
            'Serve immediately, or add hot water for an Americano.',
            'If bitter, grind coarser or shorten the shot; if sour, grind finer.',
          ];
  }

  // Disc drip bag — Toucano house method
  if (iced) {
    return lang === 'ar'
      ? [
          'افتح الغطاء بعناية.',
          `أضف 110${g} ثلج إلى الكوب.`,
          'ضع قرص الفلتر أعلى الكوب.',
          `صب 60${ml} ماء ساخن عند 92°م.`,
          `انتظر 30 ثانية ثم صب 55${ml} وانتظر 20 ثانية.`,
          'أزل القرص واستمتع بقهوتك.',
        ]
      : [
          'Open the lid carefully.',
          `Add 110${g} of ice to the cup.`,
          'Place the filter disc on the cup.',
          `Pour 60${ml} of 92°C water.`,
          `Wait 30 seconds, then pour 55${ml} and wait 20 seconds.`,
          'Remove the disc and enjoy.',
        ];
  }

  return lang === 'ar'
    ? [
        'افتح الغطاء بعناية.',
        'ضع قرص الفلتر أعلى الكوب.',
        `صب 75${ml} — 75${ml} — 75${ml} وانتظر 15 ثانية بين كل صب.`,
        'أزل القرص واستمتع بقهوتك.',
      ]
    : [
        'Open the lid carefully.',
        'Place the filter disc on the cup.',
        `Pour 75${ml} — 75${ml} — 75${ml}, waiting 15 seconds between pours.`,
        'Remove the disc and enjoy.',
      ];
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
