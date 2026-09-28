import { useState } from 'react';
import { PRODUCT_CATEGORIES } from '../../lib/productsApi';
import { translateFields } from '../../lib/translateApi';
import BilingualField from './BilingualField';

const WEIGHT_PRESETS = ['250g', '500g', '1kg', '12g Drip Bag', '10 × 12g Drip Bags'];

function toForm(product) {
  return {
    name: product?.name || '',
    name_ar: product?.name_ar || '',
    description: product?.description || '',
    description_ar: product?.description_ar || '',
    weight: product?.weight || '',
    price: product?.price ?? '',
    category: product?.category || 'coffee-beans',
  };
}

/** Create (no `product`) or edit (with `product`) a product. Images are required only when creating. */
export default function ProductForm({ lang = 'en', onSubmit, submitting, product = null, onCancel }) {
  const editing = Boolean(product);
  const [form, setForm] = useState(() => toForm(product));
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [translatingAll, setTranslatingAll] = useState(false);
  const isAr = lang === 'ar';
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  function onFileChange(e) {
    const next = [...(e.target.files || [])];
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  async function translateAll() {
    const fields = {};
    if (form.name.trim()) fields.name = form.name;
    if (form.description.trim()) fields.description = form.description;
    if (!Object.keys(fields).length) return;
    if (
      (form.name_ar.trim() || form.description_ar.trim()) &&
      !window.confirm(isAr ? 'استبدال النصوص العربية الحالية؟' : 'Replace the existing Arabic text?')
    ) {
      return;
    }
    setTranslatingAll(true);
    setError('');
    try {
      const out = await translateFields(fields, { source: 'en', target: 'ar', context: 'coffee product listing' });
      setForm((f) => ({
        ...f,
        name_ar: out.name ?? f.name_ar,
        description_ar: out.description ?? f.description_ar,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setTranslatingAll(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError(isAr ? 'الاسم بالإنجليزية مطلوب' : 'English name is required');
      return;
    }
    const price = Number(form.price);
    if (form.price === '' || Number.isNaN(price) || price < 0) {
      setError(isAr ? 'السعر غير صالح' : 'Enter a valid price');
      return;
    }
    if (!editing && !files.length) {
      setError(isAr ? 'صورة واحدة على الأقل مطلوبة' : 'At least one product image is required');
      return;
    }

    try {
      await onSubmit({
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        description: form.description.trim(),
        description_ar: form.description_ar.trim() || null,
        weight: form.weight.trim() || null,
        price,
        category: form.category,
        files,
      });
      if (!editing) {
        setForm(toForm(null));
        setFiles([]);
        setPreviews([]);
        e.target.reset?.();
      }
    } catch (err) {
      setError(err.message || (isAr ? 'فشل الحفظ' : 'Save failed'));
    }
  }

  const busy = submitting || translatingAll;

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-800">
          {editing ? (isAr ? `تعديل: ${product.name}` : `Edit: ${product.name}`) : isAr ? 'إضافة منتج' : 'Add Product'}
        </h3>
        <button
          type="button"
          onClick={translateAll}
          disabled={busy || (!form.name.trim() && !form.description.trim())}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white disabled:opacity-40"
        >
          {translatingAll ? '…' : isAr ? 'ترجمة الكل إلى العربية' : 'Auto-Translate all → Arabic'}
        </button>
      </div>

      {error && (
        <div role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <BilingualField
        label={isAr ? 'اسم المنتج' : 'Product Name'}
        valueEn={form.name}
        valueAr={form.name_ar}
        onChangeEn={set('name')}
        onChangeAr={set('name_ar')}
        required
        disabled={busy}
        context="coffee product name"
        uiLang={lang}
      />

      <BilingualField
        label={isAr ? 'الوصف' : 'Description'}
        valueEn={form.description}
        valueAr={form.description_ar}
        onChangeEn={set('description')}
        onChangeAr={set('description_ar')}
        multiline
        disabled={busy}
        context="coffee product description with tasting notes"
        uiLang={lang}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
            {isAr ? 'الوزن / الحجم' : 'Weight / Size'}
          </label>
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            value={form.weight}
            onChange={(e) => set('weight')(e.target.value)}
            placeholder="250g"
            list="weight-presets"
            maxLength={40}
            disabled={busy}
          />
          <datalist id="weight-presets">
            {WEIGHT_PRESETS.map((w) => (
              <option key={w} value={w} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{isAr ? 'السعر (ر.ق)' : 'Price (QAR)'}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            value={form.price}
            onChange={(e) => set('price')(e.target.value)}
            disabled={busy}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{isAr ? 'الفئة' : 'Category'}</label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
            value={form.category}
            onChange={(e) => set('category')(e.target.value)}
            disabled={busy}
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {isAr ? c.labelAr : c.labelEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
          {editing
            ? isAr
              ? 'إضافة صور جديدة (اختياري)'
              : 'Add more gallery images (optional)'
            : isAr
              ? 'صور المنتج (معرض)'
              : 'Product Gallery Images'}
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={onFileChange}
          disabled={busy}
          className="w-full text-sm"
        />
        {previews.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {previews.map((src) => (
              <img key={src} src={src} alt="Preview" className="h-24 w-24 object-cover rounded-xl border shrink-0" />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="bg-brandorange text-white font-bold px-5 py-2.5 rounded-lg disabled:opacity-60"
        >
          {submitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : editing ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : isAr ? 'حفظ المنتج' : 'Save Product'}
        </button>
        {editing && onCancel && (
          <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-lg border border-slate-300 font-semibold">
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        )}
      </div>
    </form>
  );
}
