import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { isDeliveryEmail } from '../lib/adminAuth';
import {
  validateEmail,
  validateFullName,
  validatePassword,
  getAuthErrorMessage,
} from '../lib/authHelpers';

/**
 * Delivery-only auth: login + signup restricted to *@deliver.com via Supabase Auth.
 */
export default function DeliveryAuth({ lang = 'en' }) {
  const [mode, setMode] = useState('login'); // login | signup
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isAr = lang === 'ar';
  const isSignUp = mode === 'signup';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isSupabaseConfigured) {
      setError(
        isAr
          ? 'المصادقة غير متاحة — Supabase غير مهيأ.'
          : 'Authentication unavailable — Supabase is not configured.'
      );
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (isSignUp) {
      const nameErr = validateFullName(fullName);
      if (nameErr) {
        setError(nameErr);
        return;
      }
    }

    const emailErr = validateEmail(trimmedEmail);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    if (!isDeliveryEmail(trimmedEmail)) {
      setError(
        isAr
          ? 'حسابات التوصيل يجب أن تنتهي بـ @deliver.com فقط (مثال: driver@deliver.com).'
          : 'Delivery accounts must use an email ending with @deliver.com (e.g. driver@deliver.com).'
      );
      return;
    }

    const passwordErr = validatePassword(password);
    if (passwordErr) {
      setError(passwordErr);
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role_hint: 'delivery',
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          setSuccess(
            isAr
              ? 'تم إنشاء حساب التوصيل. جاري فتح بوابة الطلبات...'
              : 'Delivery account created. Opening the delivery portal...'
          );
        } else {
          setSuccess(
            isAr
              ? 'تم إنشاء الحساب. تحقق من بريدك إن لزم التأكيد، ثم سجّل الدخول.'
              : 'Account created. Confirm your email if required, then sign in.'
          );
          setPassword('');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (signInError) throw signInError;

        setSuccess(
          isAr
            ? 'تم تسجيل الدخول. جاري تحميل الطلبات المعلقة...'
            : 'Signed in. Loading pending delivery orders...'
        );
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-5 text-black">
      <div className="flex rounded-lg overflow-hidden border border-slate-300 mb-4">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 py-2 text-sm font-black ${
            !isSignUp ? 'bg-[#FF5500] text-white' : 'bg-white text-black'
          }`}
        >
          {isAr ? 'دخول' : 'Login'}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 py-2 text-sm font-black ${
            isSignUp ? 'bg-[#FF5500] text-white' : 'bg-white text-black'
          }`}
        >
          {isAr ? 'تسجيل' : 'Sign Up'}
        </button>
      </div>

      <p className="text-sm font-bold text-black/70 mb-4 text-center">
        {isAr
          ? 'استخدم بريداً ينتهي بـ @deliver.com فقط'
          : 'Use an @deliver.com email only (e.g. driver@deliver.com)'}
      </p>

      {error && (
        <div role="alert" className="mb-3 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm font-bold">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="mb-3 rounded-lg bg-emerald-50 text-emerald-700 px-3 py-2 text-sm font-bold">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        {isSignUp && (
          <div>
            <label className="block text-xs font-black uppercase mb-1">
              {isAr ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required={isSignUp}
              disabled={loading}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
              placeholder="Driver Name"
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-black uppercase mb-1">
            {isAr ? 'البريد الإلكتروني' : 'Email'}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
            placeholder="driver@deliver.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase mb-1">
            {isAr ? 'كلمة المرور' : 'Password'}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
            placeholder="••••••••"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#FF5500] text-white font-black py-2.5 rounded-lg disabled:opacity-60 hover:bg-[#e64d00] transition"
        >
          {loading
            ? isAr
              ? 'جاري المعالجة...'
              : 'Processing...'
            : isSignUp
              ? isAr
                ? 'إنشاء حساب توصيل'
                : 'Create Delivery Account'
              : isAr
                ? 'دخول بوابة التوصيل'
                : 'Sign In to Delivery Portal'}
        </button>
      </form>
    </div>
  );
}
