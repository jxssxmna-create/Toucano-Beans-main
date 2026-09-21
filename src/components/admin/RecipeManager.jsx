import { useEffect, useState } from 'react';
import { createRecipe, deleteRecipe, fetchRecipes } from '../../lib/commerceApi';

export default function RecipeManager({ lang = 'en', userId }) {
  const isAr = lang === 'ar';
  const [recipes, setRecipes] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  async function load() {
    try {
      const data = await fetchRecipes();
      setRecipes(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await createRecipe({
        title: title.trim(),
        body: body.trim(),
        image_url: imageUrl.trim() || null,
        display_order: recipes.length,
        created_by: userId || null,
      });
      setTitle('');
      setBody('');
      setImageUrl('');
      setOpen(false);
      setMessage({ type: 'success', text: isAr ? 'تمت إضافة الوصفة' : 'Recipe added' });
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
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#FF5500]">
            {isAr ? 'الوصفات' : 'Recipes'}
          </p>
          <h2 className="text-2xl font-black">
            {isAr ? 'منشئ وصفات القهوة' : 'Coffee Recipe Builder'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="px-4 py-2 rounded-lg bg-[#FF5500] text-white font-black"
        >
          {open ? (isAr ? 'إغلاق' : 'Close') : '+ ' + (isAr ? 'إضافة وصفة' : 'Add Recipe')}
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

      {open && (
        <form onSubmit={handleAdd} className="space-y-3 border border-slate-200 rounded-xl p-3">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isAr ? 'عنوان جريء' : 'Bold recipe title'}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-black"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={isAr ? 'خطوات التحضير' : 'Brewing steps'}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 min-h-[100px] font-bold"
          />
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… image URL"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-slate-900 text-white font-black px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {busy ? (isAr ? 'جارٍ...' : 'Saving...') : isAr ? 'نشر' : 'Publish'}
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {recipes.map((r) => (
          <li
            key={r.id}
            className="flex items-start justify-between gap-3 border border-slate-200 rounded-xl px-3 py-2"
          >
            <div className="min-w-0">
              <p className="font-black truncate">{r.title}</p>
              <p className="text-xs text-slate-500 line-clamp-2 font-bold">{r.body}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(r.id)}
              className="text-red-600 text-sm font-black shrink-0"
            >
              {isAr ? 'حذف' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
