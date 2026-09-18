import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductForm from '../components/admin/ProductForm';
import ProductList from '../components/admin/ProductList';
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  fetchProducts,
  nextDisplayOrder,
  swapProductOrder,
  uploadProductImage,
} from '../lib/productsApi';

export default function AdminDashboard({ lang, setLang, onSignOut, session }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);
  const isAr = lang === 'ar';

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function handleCreate({ name, description, price, category, file }) {
    setSubmitting(true);
    setMessage(null);
    try {
      const { publicUrl } = await uploadProductImage(file);
      const display_order = await nextDisplayOrder(category);
      await createProduct({
        name,
        description,
        price,
        category,
        image_url: publicUrl,
        display_order,
      });
      setMessage({
        type: 'success',
        text: isAr ? 'تم إضافة المنتج بنجاح' : 'Product created successfully',
      });
      await loadProducts();
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product) {
    const confirmMsg = isAr
      ? `حذف "${product.name}"؟ سيتم حذف الصورة أيضاً.`
      : `Delete "${product.name}"? The image will also be removed.`;
    if (!window.confirm(confirmMsg)) return;

    setBusyId(product.id);
    setMessage(null);
    try {
      await deleteProduct(product.id);
      await deleteProductImage(product.image_url);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setMessage({
        type: 'success',
        text: isAr ? 'تم حذف المنتج' : 'Product deleted',
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReorder(current, neighbor) {
    if (!neighbor) return;
    setBusyId(current.id);
    setMessage(null);
    try {
      await swapProductOrder(current, neighbor);
      await loadProducts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="bg-[#fdf0de] text-slate-900 min-h-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="border-b border-slate-300/70 bg-[#fdf0de]/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-brandorange font-bold">
              {isAr ? 'لوحة التحكم' : 'Admin Panel'}
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900">Toucano Beans</h1>
            <p className="text-xs text-slate-500">{session?.user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(isAr ? 'en' : 'ar')}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-white"
            >
              {isAr ? 'English' : 'العربية'}
            </button>
            <Link
              to="/"
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-white font-medium"
            >
              {isAr ? 'المتجر' : 'Storefront'}
            </Link>
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

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
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

        <ProductForm lang={lang} onSubmit={handleCreate} submitting={submitting} />

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-extrabold text-slate-900">
              {isAr ? 'المنتجات' : 'Products'}
            </h2>
            <button
              type="button"
              onClick={loadProducts}
              className="text-sm text-brandorange font-semibold hover:underline"
            >
              {isAr ? 'تحديث' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-600">
              {isAr ? 'جاري التحميل...' : 'Loading products...'}
            </div>
          ) : (
            <ProductList
              products={products}
              lang={lang}
              busyId={busyId}
              onDelete={handleDelete}
              onMoveUp={(product, neighbor) => handleReorder(product, neighbor)}
              onMoveDown={(product, neighbor) => handleReorder(product, neighbor)}
            />
          )}
        </section>
      </main>
    </div>
  );
}
