import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AccountPage from '../components/AccountPage';
import Logo from '../components/Logo';
import SignUp from './SignUp';
import Checkout from './Checkout';
import { fetchProducts } from '../lib/productsApi';
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
  },
};

const CATEGORY_KEYS = {
  'coffee-beans': 'beans',
  'drip-coffee': 'drip',
  essentials: 'essentials',
};

function CategoryIcon({ type }) {
  const common = 'w-14 h-14 text-slate-800 group-hover:text-brandorange transition';
  if (type === 'coffee-beans') {
    return (
      <svg className={common} viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
        <ellipse cx="18" cy="22" rx="9" ry="13" transform="rotate(-28 18 22)" />
        <path d="M14 16c2 4 3 8 2 13" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
        <ellipse cx="40" cy="20" rx="9" ry="13" transform="rotate(18 40 20)" />
        <path d="M37 14c1.5 4 2 8 1 12" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
        <ellipse cx="30" cy="42" rx="9" ry="13" transform="rotate(-8 30 42)" />
        <path d="M27 36c1.8 4 2.2 8 1 12" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      </svg>
    );
  }
  if (type === 'drip-coffee') {
    return (
      <svg className={common} viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
        <path d="M32 8c0 0 16 18 16 30a16 16 0 1 1-32 0C16 26 32 8 32 8z" />
        <path d="M32 22c0 6-3 10-3 16" fill="none" stroke="#fdf0de" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 22h28v18a10 10 0 0 1-10 10H24a10 10 0 0 1-10-10V22z" fill="currentColor" stroke="none" />
      <path d="M42 26h6a6 6 0 0 1 0 12h-6" />
      <path d="M12 56h32" />
      <path d="M22 14c0 0 2-4 6-4s6 4 6 4" opacity="0.7" />
      <path d="M28 10c0 0 1-3 4-3" opacity="0.5" />
    </svg>
  );
}

export default function Storefront({
  session,
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
  const [cartCount] = useState(0);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    if (openAccount) setActivePage('account');
  }, [openAccount]);

  useEffect(() => {
    const categories = ['coffee-beans', 'drip-coffee', 'essentials'];
    if (!categories.includes(activePage) || !isSupabaseConfigured) {
      setCategoryProducts([]);
      return;
    }

    let cancelled = false;
    async function load() {
      setProductsLoading(true);
      try {
        const data = await fetchProducts(activePage);
        if (!cancelled) setCategoryProducts(data);
      } catch (err) {
        console.error('Failed to load products:', err.message);
        if (!cancelled) setCategoryProducts([]);
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
    <div className="bg-[#fdf0de] text-slate-900 min-h-screen flex flex-col justify-between relative">
      {/* Physical left/right so menu stays top-right in both LTR and RTL */}
      <div className="fixed top-6 left-6 right-6 z-30 pointer-events-none h-12">
        <button
          onClick={() => navigateTo('checkout')}
          className="pointer-events-auto absolute left-0 top-0 p-3 text-slate-800 hover:text-brandorange transition focus:outline-none"
          aria-label="Cart"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="absolute -top-1 -right-1 bg-brandorange text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        </button>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="pointer-events-auto absolute right-0 top-0 p-3 text-slate-800 hover:text-brandorange transition focus:outline-none"
          aria-label="Menu"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div
        className={`fixed inset-y-0 ${
          lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'
        } w-64 bg-[#fdf0de] border-slate-300/60 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : lang === 'ar' ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-800">{t.menuHeading}</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-slate-500 hover:text-slate-800 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="space-y-4">
              <button
                onClick={() => navigateTo('home')}
                className="block w-full text-start text-slate-700 hover:text-brandorange font-medium"
              >
                {t.main}
              </button>
              <button
                onClick={() => navigateTo('story')}
                className="block w-full text-start text-slate-700 hover:text-brandorange font-medium"
              >
                {t.story}
              </button>

              <div>
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="w-full flex items-center justify-between text-slate-700 hover:text-brandorange font-medium focus:outline-none"
                >
                  <span>{t.categories}</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform duration-200 ${
                      isCategoriesOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isCategoriesOpen && (
                  <div
                    className={`${
                      lang === 'ar' ? 'pr-4 border-r-2' : 'pl-4 border-l-2'
                    } mt-2 space-y-2 border-brandorange/30`}
                  >
                    <button
                      onClick={() => navigateTo('coffee-beans')}
                      className="block text-sm text-slate-600 hover:text-brandorange"
                    >
                      {t.beans}
                    </button>
                    <button
                      onClick={() => navigateTo('drip-coffee')}
                      className="block text-sm text-slate-600 hover:text-brandorange"
                    >
                      {t.drip}
                    </button>
                    <button
                      onClick={() => navigateTo('essentials')}
                      className="block text-sm text-slate-600 hover:text-brandorange"
                    >
                      {t.essentials}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className="w-full flex items-center justify-between text-slate-700 hover:text-brandorange font-medium focus:outline-none"
                >
                  <span>{t.language}</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform duration-200 ${
                      isLanguageOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isLanguageOpen && (
                  <div
                    className={`${
                      lang === 'ar' ? 'pr-4 border-r-2' : 'pl-4 border-l-2'
                    } mt-2 space-y-2 border-brandorange/30`}
                  >
                    <button
                      onClick={() => {
                        setLang('en');
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-start text-sm text-slate-600 hover:text-brandorange"
                    >
                      English
                    </button>
                    <button
                      onClick={() => {
                        setLang('ar');
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-start text-sm text-slate-600 hover:text-brandorange"
                    >
                      العربية (Arabic)
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigateTo('contact')}
                className="block w-full text-start text-slate-700 hover:text-brandorange font-medium"
              >
                {t.contact}
              </button>
              <button
                onClick={() => navigateTo('account')}
                className="block w-full text-start text-slate-700 hover:text-brandorange font-medium"
              >
                {t.account}
              </button>
              <button
                onClick={() => navigateTo('checkout')}
                className="block w-full text-start text-slate-700 hover:text-brandorange font-medium"
              >
                {t.checkout}
              </button>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-start text-brandorange hover:text-orange-700 font-bold pt-2"
                >
                  {t.admin}
                </Link>
              )}

              {session && (
                <button
                  onClick={handleLogout}
                  className="block w-full text-start text-red-600 hover:text-red-700 font-medium pt-4 border-t border-slate-300"
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
          <h1 className="text-xl font-extrabold tracking-wider text-slate-900 uppercase">
            TOUCANO BEANS
          </h1>
        </header>
      )}

      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-16 pb-12">
        {activePage === 'home' && (
          <section className="w-full max-w-4xl flex flex-col items-center">
            <div className="text-center mb-16 cursor-pointer" onClick={() => navigateTo('home')}>
              <Logo size="xl" className="mx-auto mb-4" />
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-slate-900 uppercase">
                TOUCANO BEANS
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-16 w-full max-w-3xl px-4 text-center">
              {['coffee-beans', 'drip-coffee', 'essentials'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigateTo(cat)}
                  className="group flex flex-col items-center justify-center transition transform hover:-translate-y-1"
                >
                  <div className="mb-3 flex items-center justify-center">
                    <CategoryIcon type={cat} />
                  </div>
                  <span className="text-lg font-bold text-slate-800 group-hover:text-brandorange transition">
                    {t[CATEGORY_KEYS[cat]]}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {['coffee-beans', 'drip-coffee', 'essentials'].includes(activePage) && (
          <section className="w-full max-w-5xl">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-8 text-center">
              {t[CATEGORY_KEYS[activePage]]}
            </h2>
            {productsLoading ? (
              <p className="text-center text-slate-600">{t.loadingProducts}</p>
            ) : categoryProducts.length === 0 ? (
              <p className="text-center text-slate-500">{t.noProducts}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white p-5 rounded-2xl shadow border border-slate-200 text-center"
                  >
                    <img
                      src={product.image_url || LOGO_SRC}
                      alt={product.name}
                      onError={handleLogoError}
                      className="h-40 w-full object-contain rounded-xl mb-4 bg-orange-50 p-2"
                    />
                    <h3 className="font-bold text-slate-800 text-lg">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                    )}
                    <p className="text-brandorange font-bold mt-2 text-base">
                      {Number(product.price).toFixed(2)} QAR
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activePage === 'story' && (
          <section className="w-full max-w-2xl text-center">
            <h2 className="text-3xl font-bold mb-4 text-slate-900">{t.storyTitle}</h2>
            <p className="text-slate-700 leading-relaxed">{t.storyBody}</p>
          </section>
        )}

        {activePage === 'contact' && (
          <section className="w-full max-w-md text-center">
            <h2 className="text-3xl font-bold mb-6 text-slate-900">{t.contactTitle}</h2>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80 space-y-6">
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {t.officialEmail}
                </span>
                <a
                  href="mailto:toucanobeans@gmail.com"
                  className="text-lg font-bold text-brandorange hover:underline break-all"
                >
                  toucanobeans@gmail.com
                </a>
              </div>
              <hr className="border-slate-200" />
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  WhatsApp
                </span>
                <a
                  href="https://wa.me/97466609060"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-lg font-bold text-emerald-600 hover:underline"
                >
                  <span>+974 6660 9060</span>
                </a>
              </div>
            </div>
          </section>
        )}

        {activePage === 'account' && (
          <section className="w-full max-w-md">
            {session ? <AccountPage session={session} /> : <SignUp />}
            {isAdmin && session && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="mt-4 w-full bg-brandorange text-white font-bold py-2.5 rounded-lg"
              >
                {t.admin}
              </button>
            )}
          </section>
        )}

        {activePage === 'checkout' && (
          <section className="w-full max-w-md">
            <Checkout user={session?.user} />
          </section>
        )}
      </main>

      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-300">
        © 2026 Toucano Beans. All rights reserved.
      </footer>
    </div>
  );
}
