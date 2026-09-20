import { Link } from 'react-router-dom';
import DeliveryPortal from '../components/DeliveryPortal';
import Logo from '../components/Logo';

export default function DeliveryDashboard({ lang, setLang, session, onSignOut }) {
  const isAr = lang === 'ar';

  return (
    <div className="bg-[#fdf0de] text-black min-h-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="border-b border-slate-300/70 bg-[#fdf0de]/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size="sm" className="shrink-0" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-[#FF5500] font-black">
                {isAr ? 'لوحة التوصيل' : 'Delivery Dashboard'}
              </p>
              <h1 className="text-xl font-black truncate">Toucano Beans</h1>
              <p className="text-xs text-black/60 font-bold truncate">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(isAr ? 'en' : 'ar')}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-white font-black"
            >
              {isAr ? 'English' : 'العربية'}
            </button>
            <Link
              to="/"
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-white font-black"
            >
              {isAr ? 'المتجر' : 'Storefront'}
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 font-black"
            >
              {isAr ? 'تسجيل الخروج' : 'Sign Out'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <DeliveryPortal session={session} lang={lang} />
      </main>
    </div>
  );
}
