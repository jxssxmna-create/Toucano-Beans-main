import { useEffect, useMemo, useState } from 'react';
import {
  deleteBrewRecipe,
  deleteEquipment,
  deleteRecipeMethod,
  fetchBrewRecipes,
  fetchEquipment,
  fetchRecipeMethods,
  slugify,
  upsertBrewRecipe,
  upsertEquipment,
  upsertRecipeMethod,
} from '../../lib/brewApi';
import BilingualField from './BilingualField';

const CARD = 'bg-[#FAF0DF] border border-[#EADBCE] rounded-2xl p-5 shadow-sm space-y-4';
const FIELD = 'w-full border border-[#EADBCE] rounded-lg px-3 py-2 bg-[#FAF0DF] focus:outline-none focus:border-[#FF5F1F]';
const EMPTY_EQ = { id: null, name: '', name_ar: '', slug: '', sort_order: 0, is_active: true };
const EMPTY_METHOD = { id: null, name: '', name_ar: '', slug: '', show_calculator: false, sort_order: 0, is_active: true };
const EMPTY_RECIPE = {
  id: null,
  equipment_id: '',
  method_id: '',
  default_ratio: 15,
  default_dose_g: 15,
  ratio_min: 12,
  ratio_max: 18,
  dose_min: 8,
  dose_max: 40,
  iced_hot_share: 0.6,
  grind_en: '',
  grind_ar: '',
  steps_hot_en: '',
  steps_hot_ar: '',
  steps_iced_en: '',
  steps_iced_ar: '',
  is_active: true,
  display_order: 0,
};

export default function RecipeManager({ lang = 'en', userId }) {
  const isAr = lang === 'ar';
  const [tab, setTab] = useState('equipment');
  const [equipment, setEquipment] = useState([]);
  const [methods, setMethods] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [eqForm, setEqForm] = useState(null);
  const [methodForm, setMethodForm] = useState(null);
  const [recipeForm, setRecipeForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  async function load() {
    try {
      const [eq, m, r] = await Promise.all([fetchEquipment(), fetchRecipeMethods(), fetchBrewRecipes()]);
      setEquipment(eq);
      setMethods(m);
      setRecipes(r);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const eqById = useMemo(() => Object.fromEntries(equipment.map((e) => [e.id, e])), [equipment]);
  const methodById = useMemo(() => Object.fromEntries(methods.map((m) => [m.id, m])), [methods]);

  async function saveEq(e) {
    e.preventDefault();
    if (!eqForm.name.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await upsertEquipment({ ...eqForm, slug: eqForm.slug || slugify(eqForm.name) });
      setEqForm(null);
      setMessage({ type: 'success', text: isAr ? 'تم حفظ المطحنة' : 'Equipment saved' });
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function saveMethod(e) {
    e.preventDefault();
    if (!methodForm.name.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await upsertRecipeMethod({ ...methodForm, slug: methodForm.slug || slugify(methodForm.name) });
      setMethodForm(null);
      setMessage({ type: 'success', text: isAr ? 'تم حفظ الطريقة' : 'Method saved' });
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function saveRecipe(e) {
    e.preventDefault();
    if (!recipeForm.equipment_id || !recipeForm.method_id) {
      setMessage({ type: 'error', text: isAr ? 'اختر المطحنة والطريقة' : 'Pick equipment and a method' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await upsertBrewRecipe(
        {
          ...recipeForm,
          equipment_name: eqById[recipeForm.equipment_id]?.name,
          method_name: methodById[recipeForm.method_id]?.name,
        },
        { userId }
      );
      setRecipeForm(null);
      setMessage({ type: 'success', text: isAr ? 'تم حفظ الوصفة' : 'Recipe saved' });
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    { id: 'equipment', label: isAr ? 'المطاحن' : 'Equipment' },
    { id: 'methods', label: isAr ? 'الطرق' : 'Methods' },
    { id: 'recipes', label: isAr ? 'الوصفات' : 'Brew recipes' },
  ];

  return (
    <section className={CARD}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5F1F]">
          {isAr ? 'التحضير' : 'Brew guide'}
        </p>
        <h2 className="text-2xl font-bold">{isAr ? 'المعدات والوصفات' : 'Equipment & Recipes'}</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              tab === t.id ? 'bg-[#FF5F1F] text-white border-[#FF5F1F]' : 'bg-[#FAF0DF] border-[#EADBCE]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <div
          className={`text-sm font-semibold rounded-lg px-3 py-2 border ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {tab === 'equipment' && (
        <Panel
          isAr={isAr}
          addLabel={isAr ? 'إضافة مطحنة' : 'Add grinder'}
          open={!!eqForm}
          onToggle={() => setEqForm(eqForm ? null : { ...EMPTY_EQ, sort_order: equipment.length + 1 })}
        >
          {eqForm && (
            <form onSubmit={saveEq} className="space-y-3 border border-[#EADBCE] rounded-xl p-4">
              <BilingualField
                label={isAr ? 'اسم المطحنة' : 'Grinder name'}
                valueEn={eqForm.name}
                valueAr={eqForm.name_ar}
                onChangeEn={(v) => setEqForm((f) => ({ ...f, name: v }))}
                onChangeAr={(v) => setEqForm((f) => ({ ...f, name_ar: v }))}
                required
                disabled={busy}
                context="coffee grinder name"
                uiLang={lang}
              />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={eqForm.is_active}
                  onChange={(e) => setEqForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                {isAr ? 'ظاهر في الموقع' : 'Visible on storefront'}
              </label>
              <button type="submit" disabled={busy} className="bg-slate-900 text-white font-semibold px-4 py-2 rounded-lg">
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </form>
          )}
          <RowList
            items={equipment}
            isAr={isAr}
            title={(e) => e.name}
            subtitle={(e) => e.name_ar}
            onEdit={(e) => setEqForm({ ...e })}
            onDelete={async (id) => {
              if (!window.confirm(isAr ? 'حذف المطحنة ووصفاتها؟' : 'Delete this grinder and its recipes?')) return;
              await deleteEquipment(id);
              await load();
            }}
          />
        </Panel>
      )}

      {tab === 'methods' && (
        <Panel
          isAr={isAr}
          addLabel={isAr ? 'إضافة طريقة' : 'Add method'}
          open={!!methodForm}
          onToggle={() => setMethodForm(methodForm ? null : { ...EMPTY_METHOD, sort_order: methods.length + 1 })}
        >
          {methodForm && (
            <form onSubmit={saveMethod} className="space-y-3 border border-[#EADBCE] rounded-xl p-4">
              <BilingualField
                label={isAr ? 'اسم الطريقة' : 'Method name'}
                valueEn={methodForm.name}
                valueAr={methodForm.name_ar}
                onChangeEn={(v) => setMethodForm((f) => ({ ...f, name: v }))}
                onChangeAr={(v) => setMethodForm((f) => ({ ...f, name_ar: v }))}
                required
                disabled={busy}
                context="coffee brew method name"
                uiLang={lang}
              />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={methodForm.show_calculator}
                  onChange={(e) => setMethodForm((f) => ({ ...f, show_calculator: e.target.checked }))}
                />
                {isAr ? 'إظهار حاسبة النسبة (مثل V60)' : 'Show ratio calculator (pour-over)'}
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={methodForm.is_active}
                  onChange={(e) => setMethodForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                {isAr ? 'ظاهر في الموقع' : 'Visible on storefront'}
              </label>
              <button type="submit" disabled={busy} className="bg-slate-900 text-white font-semibold px-4 py-2 rounded-lg">
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </form>
          )}
          <RowList
            items={methods}
            isAr={isAr}
            title={(m) => m.name}
            subtitle={(m) => `${m.name_ar || ''}${m.show_calculator ? ' · calculator' : ''}`}
            onEdit={(m) => setMethodForm({ ...m })}
            onDelete={async (id) => {
              if (!window.confirm(isAr ? 'حذف الطريقة ووصفاتها؟' : 'Delete this method and its recipes?')) return;
              await deleteRecipeMethod(id);
              await load();
            }}
          />
        </Panel>
      )}

      {tab === 'recipes' && (
        <Panel
          isAr={isAr}
          addLabel={isAr ? 'إضافة وصفة' : 'Add brew recipe'}
          open={!!recipeForm}
          onToggle={() =>
            setRecipeForm(
              recipeForm
                ? null
                : { ...EMPTY_RECIPE, equipment_id: equipment[0]?.id || '', method_id: methods[0]?.id || '' }
            )
          }
        >
          {recipeForm && (
            <form onSubmit={saveRecipe} className="space-y-3 border border-[#EADBCE] rounded-xl p-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block space-y-1 text-sm font-semibold">
                  <span>{isAr ? 'المطحنة' : 'Equipment'}</span>
                  <select
                    className={FIELD}
                    value={recipeForm.equipment_id}
                    onChange={(e) => setRecipeForm((f) => ({ ...f, equipment_id: e.target.value }))}
                  >
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1 text-sm font-semibold">
                  <span>{isAr ? 'الطريقة' : 'Method'}</span>
                  <select
                    className={FIELD}
                    value={recipeForm.method_id}
                    onChange={(e) => setRecipeForm((f) => ({ ...f, method_id: e.target.value }))}
                  >
                    {methods.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Num label={isAr ? 'النسبة 1:؟' : 'Ratio 1:'} value={recipeForm.default_ratio} onChange={(v) => setRecipeForm((f) => ({ ...f, default_ratio: v }))} />
                <Num label={isAr ? 'الجرعة غ' : 'Dose g'} value={recipeForm.default_dose_g} onChange={(v) => setRecipeForm((f) => ({ ...f, default_dose_g: v }))} />
                <Num label={isAr ? 'نسبة المثلج (0.6)' : 'Iced hot share'} value={recipeForm.iced_hot_share} step="0.05" onChange={(v) => setRecipeForm((f) => ({ ...f, iced_hot_share: v }))} />
                <Num label={isAr ? 'الترتيب' : 'Order'} value={recipeForm.display_order} onChange={(v) => setRecipeForm((f) => ({ ...f, display_order: v }))} />
              </div>
              <p className="text-xs text-black/50 font-medium">
                {isAr
                  ? 'استخدم {coffee} {hotWater} {ice} {bloom} {mid} {totalWater} {ratio} في الخطوات.'
                  : 'Tokens in steps: {coffee} {hotWater} {ice} {bloom} {mid} {totalWater} {ratio}'}
              </p>
              <BilingualField
                label={isAr ? 'درجة الطحن' : 'Grind setting'}
                valueEn={recipeForm.grind_en}
                valueAr={recipeForm.grind_ar}
                onChangeEn={(v) => setRecipeForm((f) => ({ ...f, grind_en: v }))}
                onChangeAr={(v) => setRecipeForm((f) => ({ ...f, grind_ar: v }))}
                disabled={busy}
                context="coffee grind setting"
                uiLang={lang}
              />
              <BilingualField
                label={isAr ? 'خطوات ساخن' : 'Hot steps'}
                valueEn={recipeForm.steps_hot_en}
                valueAr={recipeForm.steps_hot_ar}
                onChangeEn={(v) => setRecipeForm((f) => ({ ...f, steps_hot_en: v }))}
                onChangeAr={(v) => setRecipeForm((f) => ({ ...f, steps_hot_ar: v }))}
                multiline
                disabled={busy}
                context="hot coffee brew recipe steps"
                uiLang={lang}
              />
              <BilingualField
                label={isAr ? 'خطوات بارد / مثلج' : 'Iced / cold steps'}
                valueEn={recipeForm.steps_iced_en}
                valueAr={recipeForm.steps_iced_ar}
                onChangeEn={(v) => setRecipeForm((f) => ({ ...f, steps_iced_en: v }))}
                onChangeAr={(v) => setRecipeForm((f) => ({ ...f, steps_iced_ar: v }))}
                multiline
                disabled={busy}
                context="iced coffee brew recipe steps"
                uiLang={lang}
              />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={recipeForm.is_active}
                  onChange={(e) => setRecipeForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                {isAr ? 'ظاهر في الموقع' : 'Visible on storefront'}
              </label>
              <button type="submit" disabled={busy} className="bg-slate-900 text-white font-semibold px-4 py-2 rounded-lg">
                {isAr ? 'حفظ الوصفة' : 'Save recipe'}
              </button>
            </form>
          )}
          <RowList
            items={recipes}
            isAr={isAr}
            title={(r) => `${eqById[r.equipment_id]?.name || '?'} · ${methodById[r.method_id]?.name || '?'}`}
            subtitle={(r) => `1:${r.default_ratio} · ${r.default_dose_g}g`}
            onEdit={(r) =>
              setRecipeForm({
                ...EMPTY_RECIPE,
                ...r,
                grind_en: r.grind_en || '',
                grind_ar: r.grind_ar || '',
                steps_hot_en: r.steps_hot_en || '',
                steps_hot_ar: r.steps_hot_ar || '',
                steps_iced_en: r.steps_iced_en || '',
                steps_iced_ar: r.steps_iced_ar || '',
              })
            }
            onDelete={async (id) => {
              if (!window.confirm(isAr ? 'حذف الوصفة؟' : 'Delete this recipe?')) return;
              await deleteBrewRecipe(id);
              await load();
            }}
          />
        </Panel>
      )}
    </section>
  );
}

function Panel({ children, addLabel, open, onToggle }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" onClick={onToggle} className="px-4 py-2 rounded-lg bg-[#FF5F1F] text-white font-semibold">
          {open ? '×' : `+ ${addLabel}`}
        </button>
      </div>
      {children}
    </div>
  );
}

function RowList({ items, title, subtitle, onEdit, onDelete, isAr }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-3 border border-[#EADBCE] rounded-xl px-3 py-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">
              {title(item)}
              {item.is_active === false && (
                <span className="ms-2 text-[11px] font-medium text-amber-700">{isAr ? 'مخفي' : 'hidden'}</span>
              )}
            </p>
            {subtitle && <p className="text-xs text-black/50 font-medium">{subtitle(item)}</p>}
          </div>
          <div className="flex gap-3 shrink-0 text-sm font-semibold">
            <button type="button" onClick={() => onEdit(item)} className="text-[#FF5F1F]">{isAr ? 'تعديل' : 'Edit'}</button>
            <button type="button" onClick={() => onDelete(item.id)} className="text-red-600">{isAr ? 'حذف' : 'Delete'}</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Num({ label, value, onChange, step = '1' }) {
  return (
    <label className="block space-y-1 text-sm font-semibold">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(step === '1' ? Number(e.target.value) : Number(e.target.value))}
        className={FIELD}
      />
    </label>
  );
}
