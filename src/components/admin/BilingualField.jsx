import { useState } from 'react';
import { translateFields } from '../../lib/translateApi';

/**
 * Side-by-side EN / AR inputs with Auto-Translate buttons (EN → AR, AR → EN).
 * Both inputs stay editable so admins can review or override any translation.
 */
export default function BilingualField({
  label,
  valueEn,
  valueAr,
  onChangeEn,
  onChangeAr,
  multiline = false,
  required = false,
  disabled = false,
  context = 'product listing',
  uiLang = 'en',
}) {
  const isAr = uiLang === 'ar';
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  async function run(direction) {
    const [source, target] = direction === 'en-ar' ? ['en', 'ar'] : ['ar', 'en'];
    const text = source === 'en' ? valueEn : valueAr;
    if (!text?.trim()) return;
    const existing = target === 'ar' ? valueAr : valueEn;
    if (
      existing?.trim() &&
      !window.confirm(isAr ? 'استبدال النص الحالي بالترجمة؟' : 'Replace the existing text with the translation?')
    ) {
      return;
    }
    setBusy(direction);
    setError('');
    try {
      const { value } = await translateFields({ value: text }, { source, target, context });
      if (value) (target === 'ar' ? onChangeAr : onChangeEn)(value);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const Input = multiline ? 'textarea' : 'input';
  const base = `w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#FF5F1F] ${
    multiline ? 'min-h-[110px]' : ''
  }`;
  const btn =
    'shrink-0 px-2 py-1 rounded-md text-[11px] font-bold border border-[#FF5F1F] text-[#FF5F1F] hover:bg-[#FF5F1F] hover:text-white disabled:opacity-40 transition';

  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-semibold uppercase text-slate-500">
        {label}
        {required && ' *'}
      </span>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500">English</span>
            <button
              type="button"
              className={btn}
              disabled={disabled || !!busy || !valueEn?.trim()}
              onClick={() => run('en-ar')}
              title="Auto-translate English → Arabic"
            >
              {busy === 'en-ar' ? '…' : 'Auto-Translate EN → AR'}
            </button>
          </div>
          <Input
            dir="ltr"
            lang="en"
            className={base}
            value={valueEn}
            onChange={(e) => onChangeEn(e.target.value)}
            disabled={disabled}
            required={required}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500">العربية</span>
            <button
              type="button"
              className={btn}
              disabled={disabled || !!busy || !valueAr?.trim()}
              onClick={() => run('ar-en')}
              title="Auto-translate Arabic → English"
            >
              {busy === 'ar-en' ? '…' : 'Auto-Translate AR → EN'}
            </button>
          </div>
          <Input
            dir="rtl"
            lang="ar"
            className={base}
            value={valueAr}
            onChange={(e) => onChangeAr(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
