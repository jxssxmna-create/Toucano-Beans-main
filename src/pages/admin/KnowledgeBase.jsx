import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderControls from '../../components/HeaderControls';
import Logo from '../../components/Logo';
import { KB_CATEGORIES, deleteKnowledge, fetchKnowledge, saveKnowledge } from '../../lib/aiBaristaApi';

const EMPTY = { id: null, category: 'flavor_profiles', title: '', content: '', is_active: true };

export default function KnowledgeBase({ lang = 'en', setLang, session, onSignOut }) {
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState(null);

  const catLabel = (id) => {
    const c = KB_CATEGORIES.find((x) => x.id === id);
    return c ? c[isAr ? 'ar' : 'en'] : id;
  };

  async function load() {
    setLoading(true);
    try {
      setEntries(await fetchKnowledge());
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () => (filter === 'all' ? entries : entries.filter((e) => e.category === filter)),
    [entries, filter]
  );

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const saved = await saveKnowledge({
        ...form,
        title: form.title.trim(),
        content: form.content.trim(),
      });
      setEntries((prev) =>
        form.id ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev]
      );
      setForm(null);
      setMessage({
        type: 'success',
        text: isAr ? 'تم الحفظ — الباريستا يستخدم التحديث فوراً' : 'Saved — the AI Barista uses it immediately',
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    if (!window.confirm(isAr ? `حذف "${entry.title}"؟` : `Delete "${entry.title}"?`)) return;
    try {
      await deleteKnowledge(entry.id);
      setEntries((prev) => prev.filter((x) => x.id !== entry.id));
      if (form?.id === entry.id) setForm(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function toggleActive(entry) {
    try {
      const saved = await saveKnowledge({ ...entry, is_active: !entry.is_active });
      setEntries((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <div className="bg-[#FAF0DF] text-slate-900 min-h-screen font-serif" dir="ltr">
      <header className="border-b border-slate-300/70 bg-[#FAF0DF]/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size="sm" className="shrink-0" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-[#FF5F1F] font-bold">
                {isAr ? 'قاعدة معرفة الباريستا' : 'AI Barista Knowledge Base'}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide truncate">TOUCANO BEANS</h1>
              <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-3 py-2 text-sm rounded-lg bg-white border border-slate-300 font-semibold hover:border-[#FF5F1F]"
            >
              {isAr ? '→ لوحة التحكم' : '← Admin Panel'}
            </button>
            <HeaderControls lang={lang} setLang={setLang} onHome={() => navigate('/')} showMenu={false} />
            <button
              type="button"
              onClick={onSignOut}
              className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium"
            >
              {isAr ? 'تسجيل الخروج' : 'Sign Out'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{isAr ? 'معرفة الباريستا الذكي' : 'AI Barista Knowledge'}</h2>
            <p className="text-sm text-slate-600 mt-1">
              {isAr
                ? 'حدّث نكهات الحبوب ونصائح التحضير والعروض — تُطبق على المحادثة فوراً بدون إعادة نشر.'
                : 'Update bean flavor profiles, brewing advice and promotional prompts — applied to the chat instantly, no redeploy.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...EMPTY })}
            className="px-4 py-2 rounded-lg bg-[#FF5F1F] text-white font-bold hover:bg-[#e8521a]"
          >
            + {isAr ? 'إضافة معرفة' : 'Add Entry'}
          </button>
        </section>

        {message && (
          <div
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`rounded-xl px-4 py-3 text-sm ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {form && (
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-lg font-bold">
              {form.id ? (isAr ? 'تعديل المعرفة' : 'Edit Entry') : isAr ? 'معرفة جديدة' : 'New Entry'}
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  {isAr ? 'الفئة' : 'Category'}
                </span>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  {KB_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c[isAr ? 'ar' : 'en']}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  {isAr ? 'العنوان' : 'Title'}
                </span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={isAr ? 'مثال: حبوب غوجي الإثيوبية' : 'e.g. Ethiopia Guji flavor profile'}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </label>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                {isAr ? 'المحتوى' : 'Content'}
              </span>
              <textarea
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder={
                  isAr
                    ? 'النكهات، طريقة التحضير الموصى بها، أو تعليمات العرض للباريستا…'
                    : 'Tasting notes, recommended brew method, or promo instructions for the barista…'
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 min-h-[140px]"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="accent-[#FF5F1F] w-4 h-4"
              />
              {isAr ? 'مفعّل (يستخدمه الباريستا)' : 'Active (used by the AI Barista)'}
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-slate-900 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : isAr ? 'حفظ' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 font-semibold"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {[{ id: 'all', en: 'All', ar: 'الكل' }, ...KB_CATEGORIES].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                filter === c.id ? 'bg-[#FF5F1F] text-white border-[#FF5F1F]' : 'bg-white border-slate-300'
              }`}
            >
              {c[isAr ? 'ar' : 'en']}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-12 text-slate-600">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
        ) : visible.length === 0 ? (
          <p className="text-center py-12 text-slate-600">{isAr ? 'لا توجد عناصر بعد' : 'No entries yet'}</p>
        ) : (
          <ul className="grid gap-3">
            {visible.map((entry) => (
              <li
                key={entry.id}
                className={`bg-white border rounded-2xl p-4 shadow-sm ${
                  entry.is_active ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-70'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FF5F1F]">
                        {catLabel(entry.category)}
                      </span>
                      {!entry.is_active && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {isAr ? 'غير مفعّل' : 'Inactive'}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-lg">{entry.title}</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">{entry.content}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-sm font-semibold">
                    <button type="button" onClick={() => toggleActive(entry)} className="text-slate-600 hover:underline">
                      {entry.is_active ? (isAr ? 'تعطيل' : 'Disable') : isAr ? 'تفعيل' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...entry });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[#FF5F1F] hover:underline"
                    >
                      {isAr ? 'تعديل' : 'Edit'}
                    </button>
                    <button type="button" onClick={() => handleDelete(entry)} className="text-red-600 hover:underline">
                      {isAr ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
