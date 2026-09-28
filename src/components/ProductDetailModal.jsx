import { useEffect, useMemo, useState } from 'react';
import QuantitySelector from './QuantitySelector';
import { productDescription, productName, productTastingNotes, textDir } from '../lib/i18n';
import { LOGO_SRC, handleLogoError } from '../lib/logo';

export function productGallery(product) {
  const urls = [];
  if (Array.isArray(product?.image_urls)) {
    for (const u of product.image_urls) {
      if (u && !urls.includes(u)) urls.push(u);
    }
  }
  if (product?.image_url && !urls.includes(product.image_url)) {
    urls.unshift(product.image_url);
  }
  return urls.length ? urls : [LOGO_SRC];
}

export default function ProductDetailModal({ product, qty = 0, onQtyChange, onClose, lang = 'en' }) {
  const isAr = lang === 'ar';
  const gallery = useMemo(() => productGallery(product), [product]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
  }, [product?.id]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!product) return null;

  const dir = textDir(lang);
  const name = productName(product, lang);
  const tasting = productTastingNotes(product, lang);
  const description = String(productDescription(product, lang)).trim();
  const weight = product.weight?.trim();
  const active = gallery[Math.min(activeIdx, gallery.length - 1)];

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={isAr ? 'إغلاق' : 'Close'}
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#fdf0de] sm:rounded-2xl shadow-2xl border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/90 border border-slate-200 font-black text-black hover:text-[#FF5500]"
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          ×
        </button>

        <img
          src={active}
          alt={name}
          onError={handleLogoError}
          className="w-full h-56 sm:h-64 object-cover bg-orange-50"
        />

        {gallery.length > 1 && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-[#fdf0de]">
            {gallery.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${
                  i === activeIdx ? 'border-[#FF5500]' : 'border-transparent opacity-80'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" onError={handleLogoError} />
              </button>
            ))}
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-4">
          <div className="text-center">
            <h2 dir={dir} className="text-2xl font-black text-black text-center">{name}</h2>
            <div className="mt-1 h-6 flex items-center justify-center">
              {weight && (
                <span
                  dir="ltr"
                  className="text-xs font-semibold leading-none text-black/70 bg-white border border-black/10 rounded-full px-2.5 py-1"
                >
                  {weight}
                </span>
              )}
            </div>
            <p dir="ltr" className="text-[#FF5500] font-black text-xl mt-1 text-center">
              {Number(product.price).toFixed(2)} QAR
            </p>
          </div>

          {tasting && (
            <div className="text-left">
              <p dir={dir} className="text-xs font-black uppercase tracking-wider text-black/50 mb-1 text-left">
                {isAr ? 'ملاحظات التذوق' : 'Tasting Notes'}
              </p>
              <p dir={dir} className="font-bold text-black text-left">{tasting}</p>
            </div>
          )}

          {description && (
            <div className="text-left">
              <p dir={dir} className="text-xs font-black uppercase tracking-wider text-black/50 mb-1 text-left">
                {isAr ? 'الوصف' : 'Description'}
              </p>
              <pre
                dir={dir}
                className="whitespace-pre-wrap font-[inherit] text-sm font-bold text-black/80 leading-relaxed text-left"
              >
                {description}
              </pre>
            </div>
          )}

          <div className="pt-2 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm font-black text-black/60">
              {isAr ? 'الكمية' : 'Quantity'}
            </p>
            <QuantitySelector size="lg" value={qty} onChange={onQtyChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
