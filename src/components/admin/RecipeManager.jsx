import { useEffect, useState } from 'react';
import { createRecipe, deleteRecipe, fetchRecipes, updateRecipe } from '../../lib/commerceApi';
import { translateFields } from '../../lib/translateApi';
import BilingualField from './BilingualField';

const EMPTY = { id: null, title: '', title_ar: '', body: '', body_ar: '', image_url: '' };

export default function RecipeManager({ lang = 'en', userId }) {
  const isAr = lang === 'ar';
  const [recipes, setRecipes] = useState([]);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [translatingAll, setTranslatingAll] = useState(false);
  const [message, setMessage] = useState(null);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function load() {
    try {
      setRecipes(await fetchRecipes());
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function translateAll() {
    const fields = {};
    if (form.title.trim()) fields.title = form.title;
    if (form.body.trim()) fields.body = form.body;
    if (!Object.keys(fields).length) return;
    if (
      (form.title_ar.trim() || form.body_ar.trim()) &&
      !window.confirm(isAr ? 'استبدال النصوص العربية الحالية؟' : 'Replace the existing Arabic text?')
    ) {
      return;
    }
    setTranslatingAll(true);
    setMessage(null);
    try {
      const out = await translateFields(fields, { source: 'en', target: 'ar', context: 'coffee brewing recipe steps' });
      setForm((f) => ({ ...f, title_ar: out.title ?? f.title_ar, body_ar: out.body ?? f.body_ar }));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setTranslatingAll(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setMessage({ type: 'error', text: isAr ? 'العنوان بالإنجليزية مطلوب' : 'English title is required' });
      return;
    }
    setBusy(true);
    setMessage(null);
    const payload = {
      title: form.title.trim(),
      title_ar: form.title_ar.trim() || null,
      body: form.body.trim(),
      body_ar: form.body_ar.trim() || null,
      image_url: form.image_url.trim() || null,
    };
    try {
      if (form.id) {
        await updateRecipe(form.id, payload);
      } else {
        await createRecipe({ ...payload, display_order: recipes.length, created_by: userId || null });
      }
      setForm(null);
      setMessage({
        type: 'success',
        text: form.id ? (isAr ? 'تم تحديث الوصفة' : 'Recipe updated') : isAr ? 'تمت إضافة الوصفة' : 'Recipe added',
      });
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(isAr ? 'حذف الوصفة؟' : 'Delete this recipe?')) return;
    try {
      await deleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      if (form?.id === id) setForm(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  const disabled = busy || translatingAll;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#FF5500]">{isAr ? 'الوصفات' : 'Recipes'}</p>
          <h2 className="text-2xl font-black">{isAr ? 'منشئ وصفات القهوة' : 'Coffee Recipe Builder'}</h2>
        </div>
        <button
          type="button"
          onClick={() => setForm(form ? null : { ...EMPTY })}
          className="px-4 py-2 rounded-lg bg-[#FF5500] text-white font-black"
        >
          {form ? (isAr ? 'إغلاق' : 'Close') : '+ ' + (isAr ? 'إضافة وصفة' : 'Add Recipe')}
        </button>
      </div>

      {message && (
        <div
          className={`text-sm font-bold rounded-lg px-3 py-2 ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {form && (
        <form onSubmit={handleSave} className="space-y-4 border border-slate-200 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">
              {form.id ? (isAr ? 'تعديل الوصفة' : 'Edit Recipe') : isAr ? 'وصفة جديدة' : 'New Recipe'}
            </h3>
            <button
              type="button"
              onClick={translateAll}
              disabled={disabled || (!form.title.trim() && !form.body.trim())}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white disabled:opacity-40"
            >
              {translatingAll ? '…' : isAr ? 'ترجمة الكل إلى العربية' : 'Auto-Translate all → Arabic'}
            </button>
          </div>

          <BilingualField
            label={isAr ? 'عنوان الوصفة' : 'Recipe Title'}
            valueEn={form.title}
            valueAr={form.title_ar}
            onChangeEn={set('title')}
            onChangeAr={set('title_ar')}
            required
            disabled={disabled}
            context="coffee recipe title"
            uiLang={lang}
          />
          <BilingualField
            label={isAr ? 'خطوات التحضير' : 'Recipe Steps'}
            valueEn={form.body}
            valueAr={form.body_ar}
            onChangeEn={set('body')}
            onChangeAr={set('body_ar')}
            multiline
            disabled={disabled}
            context="coffee brewing recipe steps"
            uiLang={lang}
          />
          <input
            value={form.image_url}
            onChange={(e) => set('image_url')(e.target.value)}
            placeholder="https://… image URL"
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            disabled={disabled}
          />
          <button type="submit" disabled={disabled} className="bg-slate-900 text-white font-black px-4 py-2 rounded-lg disabled:opacity-60">
            {busy ? (isAr ? 'جارٍ...' : 'Saving...') : form.id ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : isAr ? 'نشر' : 'Publish'}
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {recipes.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-3 border border-slate-200 rounded-xl px-3 py-2">
            <div className="min-w-0">
              <p className="font-black truncate">
                {r.title}
                {r.title_ar && (
                  <span className="ms-2 font-medium text-slate-500" dir="rtl">
                    · {r.title_ar}
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500 line-clamp-2 font-bold">{r.body}</p>
              {!r.body_ar && r.body && (
                <span className="inline-block mt-1 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                  {isAr ? 'بدون ترجمة عربية' : 'No Arabic steps'}
                </span>
              )}
            </div>
            <div className="flex gap-3 shrink-0 text-sm font-black">
              <button
                type="button"
                onClick={() =>
                  setForm({
                    id: r.id,
                    title: r.title || '',
                    title_ar: r.title_ar || '',
                    body: r.body || '',
                    body_ar: r.body_ar || '',
                    image_url: r.image_url || '',
                  })
                }
                className="text-[#FF5500]"
              >
                {isAr ? 'تعديل' : 'Edit'}
              </button>
              <button type="button" onClick={() => handleDelete(r.id)} className="text-red-600">
                {isAr ? 'حذف' : 'Delete'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
