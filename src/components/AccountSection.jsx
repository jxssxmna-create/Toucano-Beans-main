import { useState } from 'react';
import SignUp from '../pages/SignUp';
import AccountPage from './AccountPage';
import DeliveryPortal from './DeliveryPortal';

/**
 * Account area with Login / Sign Up / Delivery tabs.
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
  const role = profile?.role || null;
  const isDelivery = role === 'delivery';
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
          {isAr ? 'جاري تحميل الحساب...' : 'Loading account...'}
        </p>
      </div>
    );
  }

  // Logged-in delivery driver on Delivery tab → portal
  if (session && isDelivery && tab === 'delivery') {
    return (
      <div className="w-full max-w-lg mx-auto space-y-4">
        <TabBar tabs={tabs} tab={tab} setTab={setTab} />
        <DeliveryPortal session={session} lang={lang} />
      </div>
    );
  }

  // Logged-in non-delivery user on Delivery tab
  if (session && !isDelivery && tab === 'delivery') {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <TabBar tabs={tabs} tab={tab} setTab={setTab} />
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
          <p className="font-black text-black mb-2">
            {isAr ? 'هذا الحساب ليس لحساب سائق توصيل' : 'This account is not a delivery driver account'}
          </p>
          <p className="text-sm font-bold text-black/70">
            {isAr
              ? 'سجّل الخروج ثم ادخل بحساب دور التوصيل للوصول إلى بوابة الطلبات.'
              : 'Sign out and log in with a delivery-role account to open the delivery portal.'}
          </p>
        </div>
      </div>
    );
  }

  // Logged-in buyer/admin (or delivery on login/signup tabs) → account settings
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
      {tab === 'delivery' && (
        <p className="text-center text-sm font-bold text-black/70 px-2">
          {isAr
            ? 'بوابة السائقين — سجّل الدخول بحساب التوصيل لعرض الطلبات المعلقة.'
            : 'Driver portal — sign in with a delivery account to view pending orders.'}
        </p>
      )}
      <SignUp
        key={tab}
        initialMode={tab === 'signup' ? 'signup' : 'login'}
        hideModeSwitch
        deliveryContext={tab === 'delivery'}
      />
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
