import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderControls from '../../components/HeaderControls';
import Logo from '../../components/Logo';
import { isEmployeeEmail, isEmployeeProfileComplete } from '../../lib/adminAuth';
import { updateEmployeeProfile } from '../../lib/employeeApi';

const PHONE_RE = /^\+?[0-9\s-]{8,16}$/;

export default function EmployeeProfile({ session, profile, lang = 'en', setLang, onSignOut, refreshProfile }) {
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const email = session?.user?.email || '';
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const firstTime = !isEmployeeProfileComplete(profile);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const name = fullName.trim();
    const phoneNumber = phone.trim();
    if (name.length < 2) return setError(isAr ? 'الاسم الكامل مطلوب' : 'Full name is required');
    if (!PHONE_RE.test(phoneNumber)) return setError(isAr ? 'رقم هاتف غير صالح' : 'Enter a valid phone number');
    if (!isEmployeeEmail(email)) {
      return setError(isAr ? 'يجب أن يكون البريد @toucano.com' : 'Work email must end with @toucano.com');
    }

    setSaving(true);
    try {
      await updateEmployeeProfile(session.user.id, { full_name: name, phone_number: phoneNumber });
      await refreshProfile?.(session.user);
      navigate('/employee/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const field = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-[#FF5F1F]';
  const label = 'block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1';

  return (
    <div className="bg-[#FAF0DF] min-h-screen text-slate-900 font-serif" dir="ltr">
      <header className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Logo size="sm" className="shrink-0" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-[#FF5F1F] font-bold">
              {isAr ? 'بوابة الموظفين' : 'Employee Portal'}
            </p>
            <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wide truncate">TOUCANO BEANS</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HeaderControls lang={lang} setLang={setLang} onHome={() => navigate('/')} showMenu={false} />
          <button
            type="button"
            onClick={onSignOut}
            className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium"
          >
            {isAr ? 'خروج' : 'Sign Out'}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{isAr ? 'ملف الموظف' : 'Employee Profile'}</h2>
            <p className="text-sm text-slate-600 mt-1">
              {firstTime
                ? isAr
                  ? 'أكمل بياناتك للوصول إلى لوحة الموظفين.'
                  : 'Complete your details to access the employee dashboard.'
                : isAr
                  ? 'حدّث بياناتك.'
                  : 'Update your details.'}
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <label className="block">
            <span className={label}>{isAr ? 'الاسم الكامل *' : 'Full Name *'}</span>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} autoComplete="name" />
          </label>

          <label className="block">
            <span className={label}>{isAr ? 'رقم الهاتف *' : 'Phone Number *'}</span>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+974 5555 5555"
              className={field}
              autoComplete="tel"
            />
          </label>

          <label className="block">
            <span className={label}>{isAr ? 'البريد الوظيفي *' : 'Work Email *'}</span>
            <input value={email} readOnly className={`${field} bg-slate-50 text-slate-600`} placeholder="example@toucano.com" />
            {!isEmployeeEmail(email) && (
              <span className="block text-xs text-red-600 mt-1">
                {isAr ? 'يجب أن يكون @toucano.com' : 'Must be an @toucano.com address'}
              </span>
            )}
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#FF5F1F] text-white font-bold py-2.5 rounded-lg hover:bg-[#e8521a] disabled:opacity-60"
            >
              {saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : isAr ? 'حفظ' : 'Save Profile'}
            </button>
            {!firstTime && (
              <button
                type="button"
                onClick={() => navigate('/employee/dashboard')}
                className="px-4 py-2.5 rounded-lg border border-slate-300 font-semibold"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
