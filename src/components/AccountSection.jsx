import { useState } from 'react';
import SignUp from '../pages/SignUp';
import AccountPage from './AccountPage';
import { isAdminUser, isDeliveryUser, pathForAuthView, resolveAuthView } from '../lib/adminAuth';
import { useNavigate } from 'react-router-dom';

/**
 * Unified Account: Login | Sign Up for buyers, admins, and delivery drivers.
 * Routing to dashboards is handled in App after Supabase auth.
 */
export default function AccountSection({
  session,
  profile,
  isAdmin,
  lang = 'en',
  onOpenAdmin,
  buyerPreview = false,
}) {
  const [tab, setTab] = useState('login');
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const isDelivery = isDeliveryUser(session?.user, profile);
  const admin = !buyerPreview && (isAdmin || isAdminUser(session?.user, profile));

  const tabs = [
    { id: 'login', label: isAr ? 'تسجيل الدخول' : 'Log In' },
    { id: 'signup', label: isAr ? 'إنشاء حساب' : 'Sign Up' },
  ];

  if (session) {
    const view = resolveAuthView(session.user?.email);
    const dashPath = pathForAuthView(view);

    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-[#FF5500]">
            {view === 'admin-dashboard'
              ? isAr
                ? 'مسؤول'
                : 'Admin'
              : view === 'delivery-dashboard'
                ? isAr
                  ? 'توصيل'
                  : 'Delivery'
                : isAr
                  ? 'عميل'
                  : 'Customer'}
          </p>
          <p className="font-bold text-sm text-black/70 truncate">{session.user?.email}</p>

          {(admin || (!buyerPreview && isDelivery)) && (
            <button
              type="button"
              onClick={() => navigate(dashPath)}
              className="w-full bg-[#FF5500] text-white font-black py-2.5 rounded-lg"
            >
              {view === 'admin-dashboard'
                ? isAr
                  ? 'فتح لوحة التحكم'
                  : 'Open Admin Dashboard'
                : isAr
                  ? 'فتح لوحة التوصيل'
                  : 'Open Delivery Dashboard'}
            </button>
          )}
        </div>

        <AccountPage session={session} lang={lang} />

        {admin && onOpenAdmin && (
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

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <TabBar tabs={tabs} tab={tab} setTab={setTab} />
      <SignUp
        key={tab}
        initialMode={tab === 'signup' ? 'signup' : 'login'}
        hideModeSwitch
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
