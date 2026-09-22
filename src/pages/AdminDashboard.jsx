import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/admin/ProductForm';
import ProductList from '../components/admin/ProductList';
import SalesAnalytics from '../components/admin/SalesAnalytics';
import UserManager from '../components/admin/UserManager';
import RecipeManager from '../components/admin/RecipeManager';
import HeaderControls from '../components/HeaderControls';
import Logo from '../components/Logo';
import { fetchOrders } from '../lib/commerceApi';
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  fetchProducts,
  nextDisplayOrder,
  swapProductOrder,
  uploadProductImage,
} from '../lib/productsApi';

const PREVIEW_KEY = 'tb_buyer_preview';

export default function AdminDashboard({ lang, setLang, onSignOut, session }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('sales');
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

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, [loadProducts, loadOrders]);

  async function handleCreate({ name, description, price, category, files }) {
    setSubmitting(true);
    setMessage(null);
    try {
      const urls = [];
      for (const file of files || []) {
        const { publicUrl } = await uploadProductImage(file);
        urls.push(publicUrl);
      }
      const display_order = await nextDisplayOrder(category);
      await createProduct({
        name,
        description,
        price,
        category,
        image_url: urls[0] || null,
        image_urls: urls,
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
      ? `حذف "${product.name}"؟ سيتم حذف الصور أيضاً.`
      : `Delete "${product.name}"? Images will also be removed.`;
    if (!window.confirm(confirmMsg)) return;

    setBusyId(product.id);
    setMessage(null);
    try {
      await deleteProduct(product.id);
      const urls = [
        product.image_url,
        ...(Array.isArray(product.image_urls) ? product.image_urls : []),
      ].filter(Boolean);
      await Promise.all(urls.map((u) => deleteProductImage(u).catch(() => {})));
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setMessage({ type: 'success', text: isAr ? 'تم حذف المنتج' : 'Product deleted' });
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

  function enterBuyerPreview() {
    sessionStorage.setItem(PREVIEW_KEY, '1');
    navigate('/', { replace: false, state: { buyerPreview: true } });
  }

  const tabs = [
    { id: 'sales', label: isAr ? 'المبيعات' : 'Sales' },
    { id: 'products', label: isAr ? 'المنتجات' : 'Products' },
    { id: 'users', label: isAr ? 'المستخدمون' : 'Users' },
    { id: 'recipes', label: isAr ? 'الوصفات' : 'Recipes' },
  ];

  return (
    <div className="bg-[#FAF0DF] text-slate-900 min-h-screen font-serif" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="border-b border-slate-300/70 bg-[#FAF0DF]/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size="sm" className="shrink-0" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-brandorange font-bold">
                {isAr ? 'لوحة التحكم' : 'Admin Panel'}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate uppercase tracking-wide">
                TOUCANO BEANS
              </h1>
              <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={enterBuyerPreview}
              className="px-3 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold"
            >
              👁️ {isAr ? 'عرض كمشتري' : 'View Site as Buyer'}
            </button>
            <HeaderControls
              lang={lang}
              setLang={setLang}
              onHome={() => navigate('/')}
              showMenu={false}
            />
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

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-black border ${
                tab === t.id
                  ? 'bg-[#FF5500] text-white border-[#FF5500]'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'sales' && <SalesAnalytics orders={orders} lang={lang} />}

        {tab === 'products' && (
          <>
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
          </>
        )}

        {tab === 'users' && <UserManager lang={lang} />}
        {tab === 'recipes' && <RecipeManager lang={lang} userId={session?.user?.id} />}
      </main>
    </div>
  );
}
