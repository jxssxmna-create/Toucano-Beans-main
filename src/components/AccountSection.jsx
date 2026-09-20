import { useState } from 'react';
import SignUp from '../pages/SignUp';
import AccountPage from './AccountPage';
import DeliveryPortal from './DeliveryPortal';
import DeliveryAuth from './DeliveryAuth';
import { isDeliveryEmail, isDeliveryUser } from '../lib/adminAuth';

/**
 * Account area with Login / Sign Up / Delivery tabs.
 * Delivery auth is restricted to *@deliver.com via Supabase Auth.
 */
export default function AccountSection({
  session,
  profile,
  isAdmin,
  lang = 'en',
  onOpenAdmin,
}) {
  const [tab, setTab] = useState('login');
  const isAr = lang === 'ar';
  const isDelivery = isDeliveryUser(session?.user, profile);
  const profileLoading = Boolean(session && profile === null);

  const tabs = [
    { id: 'login', label: isAr ? 'تسجيل الدخول' : 'Login' },
    { id: 'signup', label: isAr ? 'إنشاء حساب' : 'Sign Up' },
    { id: 'delivery', label: isAr ? 'التوصيل' : 'Delivery' },
  ];

  if (profileLoading && tab === 'delivery') {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <TabBar tabs={tabs} tab={tab} setTab={setTab} />
        <p className="text-center font-bold py-8">
          {isAr ? 'جاري تحميل حساب التوصيل...' : 'Loading delivery account...'}
        </p>
      </div>
    );
  }

  // Logged-in delivery driver (@deliver.com / role) on Delivery tab → portal
  if (session && isDelivery && tab === 'delivery') {
    return (
      <div className="w-full max-w-lg mx-auto space-y-4">
        <TabBar tabs={tabs} tab={tab} setTab={setTab} />
        <DeliveryPortal session={session} lang={lang} />
      </div>
    );
  }

  // Logged-in user without delivery access on Delivery tab
  if (session && !isDelivery && tab === 'delivery') {
    const emailHint = session.user?.email || '';
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <TabBar tabs={tabs} tab={tab} setTab={setTab} />
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
          <p className="font-black text-black mb-2">
            {isAr ? 'هذا الحساب ليس حساب توصيل' : 'This is not a delivery account'}
          </p>
          <p className="text-sm font-bold text-black/70">
            {isAr
              ? 'سجّل الخروج ثم ادخل أو سجّل ببريد ينتهي بـ @deliver.com.'
              : `Sign out, then log in or sign up with an @deliver.com email${
                  emailHint && !isDeliveryEmail(emailHint) ? ` (current: ${emailHint})` : ''
                }.`}
          </p>
        </div>
      </div>
    );
  }

  // Logged-in on Login / Sign Up tabs → account settings
  if (session && tab !== 'delivery') {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <TabBar tabs={tabs} tab={tab} setTab={setTab} />
        {isDelivery ? (
          <button
            type="button"
            onClick={() => setTab('delivery')}
            className="w-full bg-[#FF5500] text-white font-black py-2.5 rounded-lg"
          >
            {isAr ? 'فتح بوابة التوصيل' : 'Open Delivery Portal'}
          </button>
        ) : null}
        <AccountPage session={session} />
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full bg-brandorange text-white font-black py-2.5 rounded-lg"
          >
            {isAr ? 'لوحة التحكم' : 'Admin Panel'}
          </button>
        )}
      </div>
    );
  }

  // Logged out
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <TabBar tabs={tabs} tab={tab} setTab={setTab} />
      {tab === 'delivery' ? (
        <>
          <p className="text-center text-sm font-bold text-black/70 px-2">
            {isAr
              ? 'بوابة السائقين عبر Supabase — البريد يجب أن ينتهي بـ @deliver.com'
              : 'Driver portal via Supabase Auth — email must end with @deliver.com'}
          </p>
          <DeliveryAuth lang={lang} />
        </>
      ) : (
        <SignUp
          key={tab}
          initialMode={tab === 'signup' ? 'signup' : 'login'}
          hideModeSwitch
        />
      )}
    </div>
  );
}

function TabBar({ tabs, tab, setTab }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-slate-300 bg-white">
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setTab(item.id)}
          className={`flex-1 py-2.5 text-sm font-black transition ${
            tab === item.id
              ? 'bg-[#FF5500] text-white'
              : 'text-black hover:bg-[#fdf0de]'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
