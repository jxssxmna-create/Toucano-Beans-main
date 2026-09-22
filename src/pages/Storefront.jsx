import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AccountSection from '../components/AccountSection';
import PolicyModal from '../components/PolicyModal';
import ProductCard from '../components/ProductCard';
import RecipesPage from '../components/RecipesPage';
import CartDrawer from '../components/CartDrawer';
import HeaderControls from '../components/HeaderControls';
import Logo from '../components/Logo';
import { fetchProducts } from '../lib/productsApi';
import { resolveCategoryProducts } from '../lib/productCatalog';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { useCart } from '../context/CartContext';

const PREVIEW_KEY = 'tb_buyer_preview';

const translations = {
  en: {
    menuHeading: 'Menu',
    main: 'Main',
    story: 'Our Story',
    categories: 'Categories',
    beans: 'Coffee Beans',
    drip: 'Drip Coffee',
    essentials: 'Coffee Essentials',
    recipes: 'Coffee Recipes',
    contact: 'Contact Us',
    account: 'Account',
    admin: 'Admin Panel',
    slogan: 'coffee beans under one wing',
    storyBody:
      'From the heart of Doha, we gather the finest from around the world under one wing bringing together exceptional coffee and the essentials to brew it',
    contactTitle: 'Contact Us',
    officialEmail: 'Official Email',
    logout: 'Log Out',
    noProducts: 'No products available yet.',
    loadingProducts: 'Loading products...',
  },
  ar: {
    menuHeading: 'القائمة',
    main: 'الرئيسية',
    story: 'قصتنا',
    categories: 'الفئات',
    beans: 'حبوب القهوة',
    drip: 'القهوة المقطرة',
    essentials: 'مستلزمات القهوة',
    recipes: 'وصفات القهوة',
    contact: 'اتصل بنا',
    account: 'الحساب',
    admin: 'لوحة التحكم',
    slogan: 'حبوب القهوة تحت جناح واحد',
    storyBody:
      'من قلب الدوحة، نجمع لك أجود ما في العالم تحت جناح واحد.. لنجمع بين القهوة الاستثنائية ومستلزمات تحضيرها',
    contactTitle: 'اتصل بنا',
    officialEmail: 'البريد الإلكتروني الرسمي',
    logout: 'تسجيل الخروج',
    noProducts: 'لا توجد منتجات حالياً.',
    loadingProducts: 'جاري تحميل المنتجات...',
  },
};

const CATEGORY_KEYS = {
  'coffee-beans': 'beans',
  'drip-coffee': 'drip',
  essentials: 'essentials',
};

/** Realistic multi-bean coffee SVG with crease/seam detail */
function CategoryIcon({ type }) {
  const box = 'w-14 h-14 block mx-auto';
  if (type === 'coffee-beans') {
    return (
      <svg className={box} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        {/* Bean 1 — left */}
        <ellipse cx="20" cy="28" rx="11" ry="16" transform="rotate(-28 20 28)" fill="currentColor" />
        <path
          d="M14 18c3 4 4 10 3 16s-4 10-7 13"
          transform="rotate(-28 20 28)"
          stroke="#FAF0DF"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Bean 2 — right */}
        <ellipse cx="44" cy="26" rx="11" ry="16" transform="rotate(24 44 26)" fill="currentColor" />
        <path
          d="M38 16c3 4 4 10 3 16s-4 10-7 13"
          transform="rotate(24 44 26)"
          stroke="#FAF0DF"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Bean 3 — bottom center */}
        <ellipse cx="32" cy="46" rx="11" ry="15" transform="rotate(-4 32 46)" fill="currentColor" />
        <path
          d="M26 36c3 3.5 4 9 3 14s-3.5 9-6.5 11.5"
          transform="rotate(-4 32 46)"
          stroke="#FAF0DF"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.85"
        />
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
  buyerPreview = false,
  onExitBuyerPreview,
}) {
  const navigate = useNavigate();
  const { cartCount, getQty, setQty, openCart } = useCart();
  const [activePage, setActivePage] = useState(openAccount ? 'account' : 'home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [policyModal, setPolicyModal] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const showAdmin = isAdmin && !buyerPreview;
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    if (openAccount) setActivePage('account');
  }, [openAccount]);

  useEffect(() => {
    setExpandedId(null);
  }, [activePage]);

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

  const topOffset = buyerPreview ? 'top-14' : 'top-6';
  const isStory = activePage === 'story';

  return (
    <div className="bg-[#FAF0DF] text-black min-h-screen flex flex-col justify-between relative font-serif text-[17px]">
      {buyerPreview && (
        <div className="fixed top-0 inset-x-0 z-50 bg-slate-900 text-white text-center text-sm font-semibold py-2 px-4 flex items-center justify-center gap-3">
          <span>👁️ {lang === 'ar' ? 'معاينة كمشتري' : 'Viewing site as Buyer'}</span>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(PREVIEW_KEY);
              onExitBuyerPreview?.();
            }}
            className="underline underline-offset-2"
          >
            {lang === 'ar' ? 'العودة للأدمن' : 'Exit to Admin'}
          </button>
        </div>
      )}

      {/* Cart left · Home + Language + Menu right */}
      <div dir="ltr" className={`fixed left-6 right-6 z-30 pointer-events-none h-12 ${topOffset}`}>
        <button
          onClick={openCart}
          className="pointer-events-auto absolute left-0 top-0 p-3 text-black hover:text-[#FF5F1F] transition focus:outline-none"
          aria-label="Cart"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.25" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="absolute -top-1 -right-1 bg-[#FF5F1F] text-white text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        </button>

        <HeaderControls
          lang={lang}
          setLang={setLang}
          onHome={() => navigateTo('home')}
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          showMenu
          className="absolute right-0 top-0"
        />
      </div>

      {/* Drawer — right side */}
      <div
        dir="ltr"
        className={`fixed inset-y-0 right-0 w-64 bg-[#FAF0DF] border-l border-slate-300/60 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="p-6 flex flex-col h-full justify-between overflow-y-auto"
        >
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-serif font-bold text-black">{t.menuHeading}</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-black hover:text-[#FF5F1F] focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="#000000" strokeWidth="2.25" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="space-y-4">
              <button
                onClick={() => navigateTo('home')}
                className="block w-full text-start text-black hover:text-[#FF5F1F] font-semibold"
              >
                {t.main}
              </button>
              <button
                onClick={() => navigateTo('story')}
                className="block w-full text-start text-black hover:text-[#FF5F1F] font-semibold"
              >
                {t.story}
              </button>
              <button
                onClick={() => navigateTo('recipes')}
                className="block w-full text-start text-black hover:text-[#FF5F1F] font-semibold"
              >
                {t.recipes}
              </button>

              <div>
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="w-full flex items-center justify-between text-black hover:text-[#FF5F1F] font-semibold focus:outline-none"
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
                  <div className="ps-4 mt-2 space-y-2 border-s-2 border-[#FF5F1F]/40">
                    <button
                      onClick={() => navigateTo('coffee-beans')}
                      className="block text-sm text-black/80 hover:text-[#FF5F1F] font-medium"
                    >
                      {t.beans}
                    </button>
                    <button
                      onClick={() => navigateTo('drip-coffee')}
                      className="block text-sm text-black/80 hover:text-[#FF5F1F] font-medium"
                    >
                      {t.drip}
                    </button>
                    <button
                      onClick={() => navigateTo('essentials')}
                      className="block text-sm text-black/80 hover:text-[#FF5F1F] font-medium"
                    >
                      {t.essentials}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigateTo('contact')}
                className="block w-full text-start text-black hover:text-[#FF5F1F] font-semibold"
              >
                {t.contact}
              </button>
              <button
                onClick={() => navigateTo('account')}
                className="block w-full text-start text-black hover:text-[#FF5F1F] font-semibold"
              >
                {t.account}
              </button>

              {showAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-start text-[#FF5F1F] hover:text-orange-700 font-semibold pt-2"
                >
                  {t.admin}
                </Link>
              )}

              {session && (
                <button
                  onClick={handleLogout}
                  className="block w-full text-start text-red-700 hover:text-red-800 font-semibold pt-4 border-t border-slate-300"
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

      {/* Compact brand header on non-home / non-story pages */}
      {activePage !== 'home' && !isStory && (
        <header className="text-center pt-14 pb-2 cursor-pointer" onClick={() => navigateTo('home')}>
          <Logo size="md" className="mx-auto mb-1" />
          <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-wider text-black uppercase">
            TOUCANO BEANS
          </h1>
        </header>
      )}

      <main
        className={`flex-grow flex flex-col items-center px-4 pb-12 ${
          isStory ? 'justify-start pt-16' : activePage === 'home' ? 'justify-center pt-16' : 'justify-start pt-6'
        }`}
      >
        {activePage === 'home' && (
          <section className="w-full max-w-4xl flex flex-col items-center">
            <div className="text-center mb-10 cursor-pointer" onClick={() => navigateTo('home')}>
              <Logo size="xl" className="mx-auto mb-3" />
              <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-wider text-black uppercase">
                TOUCANO BEANS
              </h1>
              <p className="mt-3 text-xl md:text-2xl font-serif font-medium text-black/80 italic">
                {t.slogan}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-16 w-full max-w-3xl px-4 text-center">
              {['coffee-beans', 'drip-coffee', 'essentials'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigateTo(cat)}
                  className="group flex flex-col items-center justify-center transition transform hover:-translate-y-1 text-black hover:text-[#FF5F1F]"
                >
                  <div className="mb-3 flex items-center justify-center text-inherit group-hover:text-[#FF5F1F] transition-colors">
                    <CategoryIcon type={cat} />
                  </div>
                  <span className="text-lg font-semibold text-inherit group-hover:text-[#FF5F1F] transition-colors">
                    {t[CATEGORY_KEYS[cat]]}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {['coffee-beans', 'drip-coffee', 'essentials'].includes(activePage) && (
          <section className="w-full max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black mb-8 text-center">
              {t[CATEGORY_KEYS[activePage]]}
            </h2>
            {productsLoading ? (
              <p className="text-center text-black font-medium">{t.loadingProducts}</p>
            ) : categoryProducts.length === 0 ? (
              <p className="text-center text-black/70 font-medium">{t.noProducts}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {categoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    qty={getQty(product.id)}
                    expanded={expandedId === product.id}
                    onToggleExpand={() =>
                      setExpandedId((id) => (id === product.id ? null : product.id))
                    }
                    onQtyChange={(next) => setQty(product, next)}
                    lang={lang}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {isStory && (
          <section className="w-full max-w-xl text-center pt-2">
            <div className="cursor-pointer" onClick={() => navigateTo('home')}>
              <Logo size="lg" className="mx-auto mb-2" />
              <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-wider text-black uppercase mb-3">
                TOUCANO BEANS
              </h1>
            </div>
            <h2 className="font-serif font-medium text-black text-xl md:text-2xl leading-snug mb-3 italic">
              {t.slogan}
            </h2>
            <p className="text-black leading-relaxed font-medium text-[17px]">{t.storyBody}</p>
          </section>
        )}

        {activePage === 'recipes' && <RecipesPage lang={lang} />}

        {activePage === 'contact' && (
          <section className="w-full max-w-md text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-6 text-black">{t.contactTitle}</h2>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80 space-y-6">
              <div>
                <span className="block text-xs font-semibold text-black/60 uppercase tracking-wider mb-1">
                  {t.officialEmail}
                </span>
                <a
                  href="mailto:toucanobeans@gmail.com"
                  className="text-lg font-semibold text-[#FF5F1F] hover:underline break-all"
                >
                  toucanobeans@gmail.com
                </a>
              </div>
              <hr className="border-slate-200" />
              <div>
                <span className="block text-xs font-semibold text-black/60 uppercase tracking-wider mb-1">
                  WhatsApp
                </span>
                <a
                  href="https://wa.me/97466609060"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-lg font-semibold text-emerald-700 hover:underline"
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
              isAdmin={showAdmin}
              lang={lang}
              buyerPreview={buyerPreview}
              onOpenAdmin={() => navigate('/admin')}
            />
          </section>
        )}
      </main>

      <footer className="text-center py-4 text-sm text-black/70 font-medium border-t border-slate-300 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4">
          <button
            type="button"
            onClick={() => setPolicyModal('ordering')}
            className="hover:text-[#FF5F1F] underline-offset-2 hover:underline font-semibold"
          >
            {lang === 'ar' ? 'قواعد الطلب' : 'Ordering Rules'}
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setPolicyModal('returns')}
            className="hover:text-[#FF5F1F] underline-offset-2 hover:underline font-semibold"
          >
            {lang === 'ar' ? 'سياسة الإرجاع' : 'Return Policy'}
          </button>
        </div>
        <p>© 2026 Toucano Beans. All rights reserved.</p>
      </footer>

      {policyModal && (
        <PolicyModal type={policyModal} lang={lang} onClose={() => setPolicyModal(null)} />
      )}

      <CartDrawer lang={lang} />
    </div>
  );
}
