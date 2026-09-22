import { useNavigate } from 'react-router-dom';
import DeliveryPortal from '../components/DeliveryPortal';
import DriverProfileForm from '../components/DriverProfileForm';
import HeaderControls from '../components/HeaderControls';
import Logo from '../components/Logo';

export default function DeliveryDashboard({ lang, setLang, session, onSignOut }) {
  const isAr = lang === 'ar';
  const navigate = useNavigate();

  return (
    <div className="bg-[#FAF0DF] text-black min-h-screen font-serif" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="border-b border-slate-300/70 bg-[#FAF0DF]/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size="sm" className="shrink-0" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-[#FF5F1F] font-semibold">
                {isAr ? 'لوحة التوصيل' : 'Delivery Dashboard'}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold truncate uppercase tracking-wide">
                TOUCANO BEANS
              </h1>
              <p className="text-xs text-black/60 font-medium truncate">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeaderControls
              lang={lang}
              setLang={setLang}
              onHome={() => navigate('/')}
              showMenu={false}
            />
            <button
              type="button"
              onClick={onSignOut}
              className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold"
            >
              {isAr ? 'تسجيل الخروج' : 'Sign Out'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <DriverProfileForm session={session} lang={lang} />
        <DeliveryPortal session={session} lang={lang} />
      </main>
    </div>
  );
}
