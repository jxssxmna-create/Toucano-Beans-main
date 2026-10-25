import { useEffect, useMemo, useState } from 'react';
import { fetchPublicBrewCatalog } from '../lib/brewApi';
import { BRAND_AR, BRAND_EN, enforceBrand } from '../lib/i18n';
import { COPY, calcBrew, interpolateSteps, localizedName, pourStages } from '../lib/brewGuide';

const BOX = 'bg-[#FAF0DF] border border-[#EADBCE] rounded-2xl shadow-sm p-5 sm:p-6 space-y-4';
const FIELD = 'w-full rounded-xl border border-[#EADBCE] bg-[#FAF0DF] px-4 py-3 font-semibold outline-none focus:border-[#FF5F1F]';

function Stepper({ label, display, onDec, onInc, decDisabled, incDisabled, decLabel, incLabel }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold">{label}</span>
      <div dir="ltr" className="inline-flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label={decLabel}
          disabled={decDisabled}
          onClick={onDec}
          className="w-9 h-9 rounded-lg border border-[#EADBCE] bg-[#FAF0DF] font-semibold hover:border-[#FF5F1F] hover:text-[#FF5F1F] disabled:opacity-40"
        >
          −
        </button>
        <span className="min-w-[3.5rem] text-center font-semibold tabular-nums">{display}</span>
        <button
          type="button"
          aria-label={incLabel}
          disabled={incDisabled}
          onClick={onInc}
          className="w-9 h-9 rounded-lg border border-[#EADBCE] bg-[#FAF0DF] font-semibold hover:border-[#FF5F1F] hover:text-[#FF5F1F] disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function RecipesPage({ lang = 'en' }) {
  const isAr = lang === 'ar';
  const t = COPY[isAr ? 'ar' : 'en'];
  const align = isAr ? 'text-right' : 'text-left';

  const [catalog, setCatalog] = useState({ equipment: [], methods: [], recipes: [] });
  const [loading, setLoading] = useState(true);
  const [equipmentId, setEquipmentId] = useState('');
  const [methodId, setMethodId] = useState('');
  const [temp, setTemp] = useState('hot');
  const [ratio, setRatio] = useState(15);
  const [dose, setDose] = useState(15);

  useEffect(() => {
    let cancelled = false;
    fetchPublicBrewCatalog()
      .then((data) => {
        if (cancelled) return;
        setCatalog(data);
        const firstEq = data.equipment[0]?.id || '';
        const firstRecipe = data.recipes.find((r) => r.equipment_id === firstEq);
        setEquipmentId(firstEq);
        setMethodId(firstRecipe?.method_id || '');
        if (firstRecipe) {
          setRatio(firstRecipe.default_ratio);
          setDose(firstRecipe.default_dose_g);
        }
      })
      .catch(() => {
        if (!cancelled) setCatalog({ equipment: [], methods: [], recipes: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const methodsForEq = useMemo(() => {
    const ids = new Set(catalog.recipes.filter((r) => r.equipment_id === equipmentId).map((r) => r.method_id));
    return catalog.methods.filter((m) => ids.has(m.id));
  }, [catalog, equipmentId]);

  const recipe = catalog.recipes.find((r) => r.equipment_id === equipmentId && r.method_id === methodId);
  const method = catalog.methods.find((m) => m.id === methodId);
  const showCalc = Boolean(method?.show_calculator && recipe);
  const iced = temp === 'iced';

  const brew = useMemo(
    () =>
      calcBrew({
        dose,
        ratio,
        iced,
        icedShare: recipe?.iced_hot_share,
        doseMin: recipe?.dose_min,
        doseMax: recipe?.dose_max,
        ratioMin: recipe?.ratio_min,
        ratioMax: recipe?.ratio_max,
      }),
    [dose, ratio, iced, recipe]
  );

  const template = iced
    ? (isAr ? recipe?.steps_iced_ar : recipe?.steps_iced_en) || recipe?.steps_iced_en || recipe?.steps_hot_en
    : (isAr ? recipe?.steps_hot_ar : recipe?.steps_hot_en) || recipe?.steps_hot_en;
  const steps = interpolateSteps(template, brew, lang);
  const grind = enforceBrand((isAr ? recipe?.grind_ar : recipe?.grind_en) || recipe?.grind_en || '', lang);
  const stages = showCalc ? pourStages({ temp, brew, lang }) : [];

  function changeEquipment(id) {
    setEquipmentId(id);
    const next = catalog.recipes.find((r) => r.equipment_id === id);
    setMethodId(next?.method_id || '');
    if (next) {
      setRatio(next.default_ratio);
      setDose(next.default_dose_g);
    }
  }

  function changeMethod(id) {
    setMethodId(id);
    const next = catalog.recipes.find((r) => r.equipment_id === equipmentId && r.method_id === id);
    if (next) {
      setRatio(next.default_ratio);
      setDose(next.default_dose_g);
    }
  }

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} className={`w-full max-w-3xl ${align}`}>
      <h2 className="text-2xl md:text-4xl font-serif font-bold text-black mb-2 text-center">{t.title}</h2>
      <p className="text-center text-black/60 font-bold mb-8">{t.subtitle}</p>

      {loading ? (
        <p className="text-center font-semibold">{t.loading}</p>
      ) : !catalog.equipment.length || !catalog.recipes.length ? (
        <p className="text-center font-semibold text-black/60">{t.empty}</p>
      ) : (
        <>
          <div className={`${BOX} space-y-5`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5F1F]">{t.step1}</p>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-black/70">{t.grinder}</span>
              <select value={equipmentId} onChange={(e) => changeEquipment(e.target.value)} className={`${FIELD} ${align}`}>
                {catalog.equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>{localizedName(eq, lang)}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-black/70">{t.method}</span>
              <select value={methodId} onChange={(e) => changeMethod(e.target.value)} className={`${FIELD} ${align}`}>
                {methodsForEq.map((m) => (
                  <option key={m.id} value={m.id}>{localizedName(m, lang)}</option>
                ))}
              </select>
            </label>
            <div className="space-y-1.5">
              <span className="text-sm font-semibold text-black/70">{t.temp}</span>
              <div className="grid grid-cols-2 gap-2">
                {['hot', 'iced'].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTemp(id)}
                    className={`py-3 rounded-xl font-semibold border transition ${
                      temp === id
                        ? 'bg-[#FF5F1F] text-white border-[#FF5F1F]'
                        : 'bg-[#FAF0DF] text-black border-[#EADBCE] hover:border-[#FF5F1F]'
                    }`}
                  >
                    {t[id]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {showCalc && recipe && (
            <div className={`mt-6 ${BOX}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5F1F]">{t.step2}</p>
              <p className="text-sm text-black/60 font-medium">{t.pourOverHint}</p>
              {iced && (
                <p className="text-sm font-semibold text-[#FF5F1F]">
                  {t.icedSplit} {Math.round(Number(recipe.iced_hot_share) * 100)}% / {Math.round((1 - Number(recipe.iced_hot_share)) * 100)}%
                </p>
              )}
              <Stepper
                label={t.ratio}
                display={`1:${brew.ratio}`}
                onDec={() => setRatio((n) => Math.max(recipe.ratio_min, n - 1))}
                onInc={() => setRatio((n) => Math.min(recipe.ratio_max, n + 1))}
                decDisabled={ratio <= recipe.ratio_min}
                incDisabled={ratio >= recipe.ratio_max}
                decLabel={t.decrease}
                incLabel={t.increase}
              />
              <Stepper
                label={t.dose}
                display={`${brew.coffee}${t.grams}`}
                onDec={() => setDose((n) => Math.max(recipe.dose_min, n - 1))}
                onInc={() => setDose((n) => Math.min(recipe.dose_max, n + 1))}
                decDisabled={dose <= recipe.dose_min}
                incDisabled={dose >= recipe.dose_max}
                decLabel={t.decrease}
                incLabel={t.increase}
              />
              <div className={`grid ${iced ? 'grid-cols-3' : 'grid-cols-2'} gap-3 pt-2`}>
                <Stat label={t.water} value={`${brew.hotWater}${t.grams}`} />
                {iced && <Stat label={t.ice} value={`${brew.ice}${t.grams}`} />}
                <Stat label={t.total} value={`${brew.totalWater}${t.grams}`} />
              </div>
              <div className="space-y-2 pt-1">
                <p className="text-sm font-semibold text-black/70">{t.pourStages}</p>
                <ol className="space-y-2">
                  {stages.map((s, i) => (
                    <li key={s.label} className="flex items-center justify-between gap-3 rounded-xl border border-[#EADBCE] bg-[#FAF0DF] px-4 py-2.5">
                      <span className="font-medium">{i + 1}. {s.label}</span>
                      <span dir="ltr" className="font-semibold tabular-nums text-[#FF5F1F]">{s.value}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {recipe && (
            <div className={`mt-6 ${BOX}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5F1F]">{t.step3}</p>
              {grind && (
                <div>
                  <p className="text-sm font-semibold text-black/70 mb-1">{t.grindLabel}</p>
                  <p className="font-medium leading-relaxed">{grind}</p>
                </div>
              )}
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={`${i}-${step}`} className="flex gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-[#FF5F1F] text-white text-sm font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="font-medium leading-relaxed pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-black/45 font-medium pt-1">{isAr ? BRAND_AR : BRAND_EN}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-[#FAF0DF] border border-[#EADBCE] px-3 py-3 text-center">
      <p className="text-xs font-semibold text-black/50 mb-1">{label}</p>
      <p dir="ltr" className="text-lg font-bold tabular-nums text-[#FF5F1F]">{value}</p>
    </div>
  );
}
