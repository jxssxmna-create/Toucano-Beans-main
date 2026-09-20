import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AccountSection from '../components/AccountSection';
import PolicyModal from '../components/PolicyModal';
import ProductDetailModal from '../components/ProductDetailModal';
import QuantitySelector from '../components/QuantitySelector';
import Logo from '../components/Logo';
import Checkout from './Checkout';
import { fetchProducts } from '../lib/productsApi';
import { resolveCategoryProducts } from '../lib/productCatalog';
import { LOGO_SRC, handleLogoError } from '../lib/logo';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const translations = {
  en: {
    menuHeading: 'Menu',
    main: 'Main',
    story: 'Our Story',
    categories: 'Categories',
    beans: 'Coffee Beans',
    drip: 'Drip Coffee',
    essentials: 'Coffee Essentials',
    language: 'Language',
    contact: 'Contact Us',
    account: 'Account',
    checkout: 'Checkout',
    admin: 'Admin Panel',
    storyTitle: 'Coffee world under one wing',
    storyBody:
      'From the heart of Doha, we gather the finest from around the world under one wing bringing together exceptional coffee and the essentials to brew it',
    contactTitle: 'Contact Us',
    officialEmail: 'Official Email',
    logout: 'Log Out',
    noProducts: 'No products available yet.',
    loadingProducts: 'Loading products...',
    tastingNotes: 'Tasting Notes',
  },
  ar: {
    menuHeading: 'القائمة',
    main: 'الرئيسية',
    story: 'قصتنا',
    categories: 'الفئات',
    beans: 'حبوب القهوة',
    drip: 'القهوة المقطرة',
    essentials: 'مستلزمات القهوة',
    language: 'اللغة',
    contact: 'اتصل بنا',
    account: 'الحساب',
    checkout: 'الدفع',
    admin: 'لوحة التحكم',
    storyTitle: 'عالم القهوة تحت جناح واحد',
    storyBody:
      'من قلب الدوحة، نجمع لك أجود ما في العالم تحت جناح واحد.. لنجمع بين القهوة الاستثنائية ومستلزمات تحضيرها',
    contactTitle: 'اتصل بنا',
    officialEmail: 'البريد الإلكتروني الرسمي',
    logout: 'تسجيل الخروج',
    noProducts: 'لا توجد منتجات حالياً.',
    loadingProducts: 'جاري تحميل المنتجات...',
    tastingNotes: 'ملاحظات التذوق',
  },
};

const CATEGORY_KEYS = {
  'coffee-beans': 'beans',
  'drip-coffee': 'drip',
  essentials: 'essentials',
};

function CategoryIcon({ type }) {
  const box = 'w-14 h-14 block mx-auto';
  if (type === 'coffee-beans') {
    return (
      <svg className={box} viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
        <ellipse cx="18" cy="24" rx="10" ry="14" transform="rotate(-30 18 24)" />
        <ellipse cx="42" cy="22" rx="10" ry="14" transform="rotate(22 42 22)" />
        <ellipse cx="32" cy="44" rx="10" ry="14" transform="rotate(-6 32 44)" />
      </svg>
    );
  }
  if (type === 'drip-coffee') {
    return (
      <svg className={box} viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
        <path d="M32 6C32 6 50 28 50 40a18 18 0 1 1-36 0C14 28 32 6 32 6z" />
      </svg>
    );
  }
  return (
    <svg className={box} viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
      <path d="M10 16h34v26c0 7.732-6.268 14-14 14H24C16.268 56 10 49.732 10 42V16z" />
      <path
        d="M44 22h5a11 11 0 0 1 0 22h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Storefront({
  session,
  profile,
  isAdmin,
  lang,
  setLang,
  onSignOut,
  openAccount = false,
}) {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState(openAccount ? 'account' : 'home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  /** cart: { [productId]: { qty, product } } */
  const [cart, setCart] = useState({});
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [policyModal, setPolicyModal] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const t = translations[lang];
  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, entry) => sum + (Number(entry?.qty) || 0), 0),
    [cart]
  );

  function getQty(productId) {
    return Number(cart[productId]?.qty) || 0;
  }

  function setQty(product, qty) {
    if (!product?.id) return;
    const nextQty = Math.max(0, Number(qty) || 0);
    setCart((prev) => {
      const next = { ...prev };
      if (nextQty <= 0) delete next[product.id];
      else next[product.id] = { qty: nextQty, product };
      return next;
    });
  }

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    if (openAccount) setActivePage('account');
  }, [openAccount]);

  useEffect(() => {
    const categories = ['coffee-beans', 'drip-coffee', 'essentials'];
    if (!categories.includes(activePage)) {
      setCategoryProducts([]);
      return;
    }

    let cancelled = false;
    async function load() {
      setProductsLoading(true);
      try {
        let remote = [];
        if (isSupabaseConfigured) {
          try {
            remote = await fetchProducts(activePage);
          } catch (err) {
            console.error('Failed to load products:', err.message);
          }
        }
        if (!cancelled) setCategoryProducts(resolveCategoryProducts(activePage, remote));
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activePage]);

  const navigateTo = (page) => {
    setActivePage(page);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await onSignOut();
    } finally {
      navigateTo('home');
    }
  };

  return (
    <div className="bg-[#fdf0de] text-black min-h-screen flex flex-col justify-between relative font-bold">
      {/* Cart left / Menu right — dir=ltr keeps physical sides in Arabic RTL */}
      <div dir="ltr" className="fixed top-6 left-6 right-6 z-30 pointer-events-none h-12">
        <button
          onClick={() => navigateTo('checkout')}
          className="pointer-events-auto absolute left-0 top-0 p-3 text-black hover:text-[#FF5500] transition focus:outline-none"
          aria-label="Cart"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.25" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="absolute -top-1 -right-1 bg-brandorange text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        </button>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="pointer-events-auto absolute right-0 top-0 p-3 text-black hover:text-[#FF5500] transition focus:outline-none"
          aria-label="Menu"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Drawer always right — dir=ltr locks right-0 regardless of page RTL */}
      <div
        dir="ltr"
        className={`fixed inset-y-0 right-0 w-64 bg-[#fdf0de] border-l border-slate-300/60 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="p-6 flex flex-col h-full justify-between overflow-y-auto"
        >
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-black">{t.menuHeading}</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-black hover:text-brandorange focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="#000000" strokeWidth="2.25" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="space-y-4">
              <button
                onClick={() => navigateTo('home')}
                className="block w-full text-start text-black hover:text-brandorange font-extrabold"
              >
                {t.main}
              </button>
              <button
                onClick={() => navigateTo('story')}
                className="block w-full text-start text-black hover:text-brandorange font-extrabold"
              >
                {t.story}
              </button>

              <div>
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="w-full flex items-center justify-between text-black hover:text-brandorange font-extrabold focus:outline-none"
                >
                  <span>{t.categories}</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform duration-200 ${
                      isCategoriesOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="#000000"
                    strokeWidth="2.25"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isCategoriesOpen && (
                  <div className="ps-4 mt-2 space-y-2 border-s-2 border-brandorange/40">
                    <button
                      onClick={() => navigateTo('coffee-beans')}
                      className="block text-sm text-black/80 hover:text-brandorange font-bold"
                    >
                      {t.beans}
                    </button>
                    <button
                      onClick={() => navigateTo('drip-coffee')}
                      className="block text-sm text-black/80 hover:text-brandorange font-bold"
                    >
                      {t.drip}
                    </button>
                    <button
                      onClick={() => navigateTo('essentials')}
                      className="block text-sm text-black/80 hover:text-brandorange font-bold"
                    >
                      {t.essentials}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className="w-full flex items-center justify-between text-black hover:text-brandorange font-extrabold focus:outline-none"
                >
                  <span>{t.language}</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform duration-200 ${
                      isLanguageOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="#000000"
                    strokeWidth="2.25"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isLanguageOpen && (
                  <div className="ps-4 mt-2 space-y-2 border-s-2 border-brandorange/40">
                    <button
                      onClick={() => {
                        setLang('en');
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-start text-sm text-black/80 hover:text-brandorange font-bold"
                    >
                      English
                    </button>
                    <button
                      onClick={() => {
                        setLang('ar');
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-start text-sm text-black/80 hover:text-brandorange font-bold"
                    >
                      العربية (Arabic)
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigateTo('contact')}
                className="block w-full text-start text-black hover:text-brandorange font-extrabold"
              >
                {t.contact}
              </button>
              <button
                onClick={() => navigateTo('account')}
                className="block w-full text-start text-black hover:text-brandorange font-extrabold"
              >
                {t.account}
              </button>
              <button
                onClick={() => navigateTo('checkout')}
                className="block w-full text-start text-black hover:text-brandorange font-extrabold"
              >
                {t.checkout}
              </button>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-start text-brandorange hover:text-orange-700 font-black pt-2"
                >
                  {t.admin}
                </Link>
              )}

              {session && (
                <button
                  onClick={handleLogout}
                  className="block w-full text-start text-red-700 hover:text-red-800 font-extrabold pt-4 border-t border-slate-300"
                >
                  {t.logout}
                </button>
              )}
            </nav>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/40 z-30" />
      )}

      {activePage !== 'home' && (
        <header className="text-center pt-10 pb-4 cursor-pointer" onClick={() => navigateTo('home')}>
          <Logo size="md" className="mx-auto mb-2" />
          <h1 className="text-xl font-black tracking-wider text-black uppercase">TOUCANO BEANS</h1>
        </header>
      )}

      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-16 pb-12">
        {activePage === 'home' && (
          <section className="w-full max-w-4xl flex flex-col items-center">
            <div className="text-center mb-16 cursor-pointer" onClick={() => navigateTo('home')}>
              <Logo size="xl" className="mx-auto mb-4" />
              <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-black uppercase">
                TOUCANO BEANS
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-16 w-full max-w-3xl px-4 text-center">
              {['coffee-beans', 'drip-coffee', 'essentials'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigateTo(cat)}
                  className="group flex flex-col items-center justify-center transition transform hover:-translate-y-1 text-black hover:text-[#FF5500]"
                >
                  <div className="mb-3 flex items-center justify-center text-inherit group-hover:text-[#FF5500] transition-colors">
                    <CategoryIcon type={cat} />
                  </div>
                  <span className="text-lg font-black text-inherit group-hover:text-[#FF5500] transition-colors">
                    {t[CATEGORY_KEYS[cat]]}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {['coffee-beans', 'drip-coffee', 'essentials'].includes(activePage) && (
          <section className="w-full max-w-5xl">
            <h2 className="text-3xl font-black text-black mb-8 text-center">
              {t[CATEGORY_KEYS[activePage]]}
            </h2>
            {productsLoading ? (
              <p className="text-center text-black font-bold">{t.loadingProducts}</p>
            ) : categoryProducts.length === 0 ? (
              <p className="text-center text-black/70 font-bold">{t.noProducts}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryProducts.map((product) => {
                  const qty = getQty(product.id);
                  return (
                    <button
                      type="button"
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="bg-white p-5 rounded-2xl shadow border border-slate-200 text-center hover:border-[#FF5500]/40 transition text-start focus:outline-none focus:ring-2 focus:ring-[#FF5500]/40"
                    >
                      <img
                        src={product.image_url || LOGO_SRC}
                        alt={product.name}
                        onError={handleLogoError}
                        className="h-40 w-full object-contain rounded-xl mb-4 bg-orange-50 p-2 pointer-events-none"
                      />
                      <h3 className="font-black text-black text-lg text-center">{product.name}</h3>
                      {product.tastingNotes && (
                        <p className="text-xs text-black/55 mt-1 line-clamp-1 font-bold text-center">
                          {product.tastingNotes}
                        </p>
                      )}
                      {!product.tastingNotes && product.description && (
                        <p className="text-sm text-black/70 mt-1 line-clamp-2 font-bold text-center">
                          {product.description}
                        </p>
                      )}
                      <p className="text-brandorange font-black mt-2 text-base text-center">
                        {Number(product.price).toFixed(2)} QAR
                      </p>
                      <div className="mt-4 flex justify-center">
                        <QuantitySelector
                          value={qty}
                          onChange={(next) => setQty(product, next)}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activePage === 'story' && (
          <section className="w-full max-w-2xl text-center">
            <h2 className="text-3xl font-black mb-4 text-black">{t.storyTitle}</h2>
            <p className="text-black leading-relaxed font-bold">{t.storyBody}</p>
          </section>
        )}

        {activePage === 'contact' && (
          <section className="w-full max-w-md text-center">
            <h2 className="text-3xl font-black mb-6 text-black">{t.contactTitle}</h2>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80 space-y-6">
              <div>
                <span className="block text-xs font-black text-black/60 uppercase tracking-wider mb-1">
                  {t.officialEmail}
                </span>
                <a
                  href="mailto:toucanobeans@gmail.com"
                  className="text-lg font-black text-brandorange hover:underline break-all"
                >
                  toucanobeans@gmail.com
                </a>
              </div>
              <hr className="border-slate-200" />
              <div>
                <span className="block text-xs font-black text-black/60 uppercase tracking-wider mb-1">
                  WhatsApp
                </span>
                <a
                  href="https://wa.me/97466609060"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-lg font-black text-emerald-700 hover:underline"
                >
                  <span>+974 6660 9060</span>
                </a>
              </div>
            </div>
          </section>
        )}

        {activePage === 'account' && (
          <section className="w-full max-w-lg">
            <AccountSection
              session={session}
              profile={profile}
              isAdmin={isAdmin}
              lang={lang}
              onOpenAdmin={() => navigate('/admin')}
            />
          </section>
        )}

        {activePage === 'checkout' && (
          <section className="w-full max-w-md">
            <Checkout
              user={session?.user}
              cart={cart}
              onQtyChange={setQty}
              lang={lang}
            />
          </section>
        )}
      </main>

      <footer className="text-center py-4 text-xs text-black/70 font-bold border-t border-slate-300 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4">
          <button
            type="button"
            onClick={() => setPolicyModal('ordering')}
            className="hover:text-[#FF5500] underline-offset-2 hover:underline font-black"
          >
            {lang === 'ar' ? 'قواعد الطلب' : 'Ordering Rules'}
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setPolicyModal('returns')}
            className="hover:text-[#FF5500] underline-offset-2 hover:underline font-black"
          >
            {lang === 'ar' ? 'سياسة الإرجاع' : 'Return Policy'}
          </button>
        </div>
        <p>© 2026 Toucano Beans. All rights reserved.</p>
      </footer>

      {policyModal && (
        <PolicyModal type={policyModal} lang={lang} onClose={() => setPolicyModal(null)} />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          qty={getQty(selectedProduct.id)}
          onQtyChange={(next) => setQty(selectedProduct, next)}
          onClose={() => setSelectedProduct(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
