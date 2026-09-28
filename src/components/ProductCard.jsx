import { productDescription, productName, productTastingNotes, textDir } from '../lib/i18n';
import { LOGO_SRC, handleLogoError } from '../lib/logo';
import QuantitySelector from './QuantitySelector';

/**
 * Product card with inline accordion details + Add to Cart → qty controls.
 * Layout is LTR in both languages; only text leaves switch paragraph direction.
 */
export default function ProductCard({
  product,
  qty = 0,
  expanded = false,
  onToggleExpand,
  onQtyChange,
  lang = 'en',
}) {
  const isAr = lang === 'ar';
  const dir = textDir(lang);
  const name = productName(product, lang);
  const description = String(productDescription(product, lang)).trim();
  const tasting = productTastingNotes(product, lang);
  const weight = product.weight?.trim();

  return (
    <div
      dir="ltr"
      className={`bg-white p-5 rounded-2xl shadow border transition text-center ${
        expanded ? 'border-[#FF5F1F] shadow-md' : 'border-slate-200 hover:border-[#FF5F1F]/40'
      }`}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5F1F]/40 rounded-xl"
        aria-expanded={expanded}
      >
        <img
          src={product.image_url || LOGO_SRC}
          alt={name}
          onError={handleLogoError}
          className="h-40 w-full object-contain rounded-xl mb-4 bg-orange-50 p-2 pointer-events-none"
        />
        <h3 dir={dir} className="font-serif font-bold text-black text-lg leading-snug text-center">
          {name}
        </h3>
        <div className="mt-1 h-6 flex items-center justify-center">
          {weight && (
            <span
              dir="ltr"
              className="text-xs font-semibold leading-none text-black/70 bg-[#FAF0DF] border border-black/10 rounded-full px-2.5 py-1"
            >
              {weight}
            </span>
          )}
        </div>
        {!expanded && tasting && (
          <p dir={dir} className="text-sm text-black/55 mt-1 line-clamp-1 font-medium text-center">
            {tasting}
          </p>
        )}
        {!expanded && !tasting && description && (
          <p dir={dir} className="text-sm text-black/70 mt-1 line-clamp-2 font-medium text-center">
            {description}
          </p>
        )}
        <p dir="ltr" className="text-[#FF5F1F] font-semibold mt-2 text-base text-center">
          {Number(product.price).toFixed(2)} QAR
        </p>
        <p dir={dir} className="mt-2 text-xs font-medium text-black/40 text-center">
          {expanded
            ? isAr
              ? 'اضغط للطي'
              : 'Click to collapse'
            : isAr
              ? 'اضغط للتفاصيل'
              : 'Click for details'}
        </p>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[1200px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-slate-200 pt-4 space-y-3 text-left">
          {weight && (
            <div>
              <p dir={dir} className="text-xs font-semibold uppercase tracking-wide text-black/45 mb-1 text-left">
                {isAr ? 'الوزن' : 'Weight'}
              </p>
              <p dir="ltr" className="text-[15px] font-medium text-black text-left">{weight}</p>
            </div>
          )}
          {tasting && (
            <div>
              <p dir={dir} className="text-xs font-semibold uppercase tracking-wide text-black/45 mb-1 text-left">
                {isAr ? 'ملاحظات التذوق' : 'Flavor Notes'}
              </p>
              <p dir={dir} className="text-[15px] font-medium text-black leading-relaxed text-left">{tasting}</p>
            </div>
          )}
          {description && (
            <div>
              <p dir={dir} className="text-xs font-semibold uppercase tracking-wide text-black/45 mb-1 text-left">
                {isAr ? 'التفاصيل والتحميص' : 'Description & Roast Details'}
              </p>
              <pre
                dir={dir}
                className="whitespace-pre-wrap font-serif text-[15px] font-medium text-black/80 leading-relaxed text-left"
              >
                {description}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-center" onClick={(e) => e.stopPropagation()}>
        {product.in_stock === false && qty === 0 ? (
          <span className="w-full sm:w-auto min-w-[10rem] px-5 py-2.5 rounded-xl bg-slate-200 text-slate-500 text-sm font-semibold text-center">
            {isAr ? 'نفد من المخزون' : 'Out of stock'}
          </span>
        ) : qty > 0 ? (
          <QuantitySelector value={qty} onChange={onQtyChange} />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQtyChange?.(1);
            }}
            className="w-full sm:w-auto min-w-[10rem] px-5 py-2.5 rounded-xl bg-[#FF5F1F] text-white text-sm font-semibold hover:brightness-95 transition"
          >
            {isAr ? 'أضف إلى السلة' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
}
