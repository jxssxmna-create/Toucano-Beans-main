import { useState } from 'react';
import { PRODUCT_CATEGORIES } from '../../lib/productsApi';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: 'coffee-beans',
};

export default function ProductForm({ lang = 'en', onSubmit, submitting }) {
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  const isAr = lang === 'ar';

  function onFileChange(e) {
    const next = e.target.files?.[0];
    setFile(next || null);
    setPreview(next ? URL.createObjectURL(next) : '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError(isAr ? 'الاسم مطلوب' : 'Name is required');
      return;
    }
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) {
      setError(isAr ? 'السعر غير صالح' : 'Enter a valid price');
      return;
    }
    if (!file) {
      setError(isAr ? 'الصورة مطلوبة' : 'Product image is required');
      return;
    }

    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        category: form.category,
        file,
      });
      setForm(emptyForm);
      setFile(null);
      setPreview('');
      e.target.reset?.();
    } catch (err) {
      setError(err.message || (isAr ? 'فشل الحفظ' : 'Save failed'));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4"
      noValidate
    >
      <h3 className="text-lg font-bold text-slate-800">
        {isAr ? 'إضافة منتج' : 'Add Product'}
      </h3>

      {error && (
        <div role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
          {isAr ? 'الاسم' : 'Name'}
        </label>
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          disabled={submitting}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
          {isAr ? 'الوصف' : 'Description'}
        </label>
        <textarea
          className="w-full border border-slate-300 rounded-lg px-3 py-2 min-h-[80px]"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          disabled={submitting}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
            {isAr ? 'السعر' : 'Price'}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            disabled={submitting}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
            {isAr ? 'الفئة' : 'Category'}
          </label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            disabled={submitting}
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
          {isAr ? 'صورة المنتج' : 'Product Image'}
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onFileChange}
          disabled={submitting}
          className="w-full text-sm"
        />
        {preview && (
          <img src={preview} alt="Preview" className="mt-3 h-32 w-full object-cover rounded-xl border" />
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto bg-brandorange text-white font-bold px-5 py-2.5 rounded-lg disabled:opacity-60"
      >
        {submitting
          ? isAr
            ? 'جاري الرفع...'
            : 'Uploading...'
          : isAr
            ? 'حفظ المنتج'
            : 'Save Product'}
      </button>
    </form>
  );
}
