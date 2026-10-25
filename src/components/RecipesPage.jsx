import { useMemo, useState } from 'react';
import { BRAND_AR, BRAND_EN, enforceBrand } from '../lib/i18n';
import {
  COPY,
  DOSE_DEFAULT,
  DOSE_MAX,
  DOSE_MIN,
  METHODS_BY_GRINDER,
  POUR_OVER_METHODS,
  RATIO_DEFAULT,
  RATIO_MAX,
  RATIO_MIN,
  calcBrew,
  grindAdvice,
  pourStages,
  recipeSteps,
} from '../lib/brewGuide';

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
          className="w-9 h-9 rounded-lg border border-slate-300 bg-white font-semibold hover:border-[#FF5F1F] hover:text-[#FF5F1F] disabled:opacity-40"
        >
          −
        </button>
        <span className="min-w-[3.5rem] text-center font-semibold tabular-nums">{display}</span>
        <button
          type="button"
          aria-label={incLabel}
          disabled={incDisabled}
          onClick={onInc}
          className="w-9 h-9 rounded-lg border border-slate-300 bg-white font-semibold hover:border-[#FF5F1F] hover:text-[#FF5F1F] disabled:opacity-40"
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

  const [grinder, setGrinder] = useState('hand');
  const [method, setMethod] = useState('v60');
  const [temp, setTemp] = useState('hot');
  const [ratio, setRatio] = useState(RATIO_DEFAULT);
  const [dose, setDose] = useState(DOSE_DEFAULT);

  const methods = METHODS_BY_GRINDER[grinder];
  const activeMethod = methods.includes(method) ? method : methods[0];
  const showCalc = POUR_OVER_METHODS.includes(activeMethod);
  const iced = temp === 'iced';
  const brew = useMemo(
    () => calcBrew({ dose, ratio, iced }),
    [dose, ratio, iced]
  );
  const steps = recipeSteps({ method: activeMethod, temp, brew, lang });
  const stages = showCalc ? pourStages({ temp, brew, lang }) : [];
  const grind = enforceBrand(grindAdvice(grinder, activeMethod, lang), lang);

  function changeGrinder(next) {
    setGrinder(next);
    if (!METHODS_BY_GRINDER[next].includes(method)) {
      setMethod(METHODS_BY_GRINDER[next][0]);
    }
  }

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} className={`w-full max-w-3xl ${align}`}>
      <h2 className="text-2xl md:text-4xl font-serif font-bold text-black mb-2 text-center">
        {t.title}
      </h2>
      <p className="text-center text-black/60 font-bold mb-8">{t.subtitle}</p>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5F1F]">{t.step1}</p>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-black/70">{t.grinder}</span>
          <select
            value={grinder}
            onChange={(e) => changeGrinder(e.target.value)}
            className={`w-full rounded-xl border border-slate-300 bg-[#FAF0DF] px-4 py-3 font-semibold outline-none focus:border-[#FF5F1F] ${align}`}
          >
            {Object.keys(METHODS_BY_GRINDER).map((id) => (
              <option key={id} value={id}>{t.grinders[id]}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-black/70">{t.method}</span>
          <select
            value={activeMethod}
            onChange={(e) => setMethod(e.target.value)}
            className={`w-full rounded-xl border border-slate-300 bg-[#FAF0DF] px-4 py-3 font-semibold outline-none focus:border-[#FF5F1F] ${align}`}
          >
            {methods.map((id) => (
              <option key={id} value={id}>{t.methods[id]}</option>
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
                    : 'bg-[#FAF0DF] text-black border-slate-300 hover:border-[#FF5F1F]'
                }`}
              >
                {t[id]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showCalc && (
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5F1F]">{t.step2}</p>
          <p className="text-sm text-black/60 font-medium">{t.pourOverHint}</p>
          {iced && <p className="text-sm font-semibold text-[#FF5F1F]">{t.icedSplit}</p>}

          <Stepper
            label={t.ratio}
            display={`1:${brew.ratio}`}
            onDec={() => setRatio((n) => Math.max(RATIO_MIN, n - 1))}
            onInc={() => setRatio((n) => Math.min(RATIO_MAX, n + 1))}
            decDisabled={ratio <= RATIO_MIN}
            incDisabled={ratio >= RATIO_MAX}
            decLabel={t.decrease}
            incLabel={t.increase}
          />
          <Stepper
            label={t.dose}
            display={`${brew.coffee}${t.grams}`}
            onDec={() => setDose((n) => Math.max(DOSE_MIN, n - 1))}
            onInc={() => setDose((n) => Math.min(DOSE_MAX, n + 1))}
            decDisabled={dose <= DOSE_MIN}
            incDisabled={dose >= DOSE_MAX}
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
                <li
                  key={s.label}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[#FAF0DF] px-4 py-2.5"
                >
                  <span className="font-medium">{i + 1}. {s.label}</span>
                  <span dir="ltr" className="font-semibold tabular-nums text-[#FF5F1F]">{s.value}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5F1F]">{t.step3}</p>
        <div>
          <p className="text-sm font-semibold text-black/70 mb-1">{t.grindLabel}</p>
          <p className="font-medium leading-relaxed">{grind}</p>
        </div>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-[#FF5F1F] text-white text-sm font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="font-medium leading-relaxed pt-0.5">{step}</p>
            </li>
          ))}
        </ol>
        <p className="text-xs text-black/45 font-medium pt-1">
          {isAr ? BRAND_AR : BRAND_EN}
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-[#FAF0DF] border border-black/5 px-3 py-3 text-center">
      <p className="text-xs font-semibold text-black/50 mb-1">{label}</p>
      <p dir="ltr" className="text-lg font-bold tabular-nums text-[#FF5F1F]">{value}</p>
    </div>
  );
}
