import { extractTastingNotes } from '../lib/productCatalog';
import { LOGO_SRC, handleLogoError } from '../lib/logo';
import QuantitySelector from './QuantitySelector';

/**
 * Product card with inline accordion details + Add to Cart → qty controls.
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
  const tasting = extractTastingNotes(product);
  const description = String(product.description || '').trim();

  return (
    <div
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
          alt={product.name}
          onError={handleLogoError}
          className="h-40 w-full object-contain rounded-xl mb-4 bg-orange-50 p-2 pointer-events-none"
        />
        <h3 className="font-serif font-bold text-black text-lg">{product.name}</h3>
        {!expanded && tasting && (
          <p className="text-sm text-black/55 mt-1 line-clamp-1 font-medium">{tasting}</p>
        )}
        {!expanded && !tasting && description && (
          <p className="text-sm text-black/70 mt-1 line-clamp-2 font-medium">{description}</p>
        )}
        <p className="text-[#FF5F1F] font-semibold mt-2 text-base">
          {Number(product.price).toFixed(2)} QAR
        </p>
        <p className="mt-2 text-xs font-medium text-black/40">
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
        <div className="border-t border-slate-200 pt-4 space-y-3 text-start">
          {tasting && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-black/45 mb-1">
                {isAr ? 'ملاحظات التذوق' : 'Flavor Notes'}
              </p>
              <p className="text-[15px] font-medium text-black leading-relaxed">{tasting}</p>
            </div>
          )}
          {description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-black/45 mb-1">
                {isAr ? 'التفاصيل والتحميص' : 'Description & Roast Details'}
              </p>
              <pre className="whitespace-pre-wrap font-sans text-[15px] font-medium text-black/80 leading-relaxed">
                {description}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-center" onClick={(e) => e.stopPropagation()}>
        {qty > 0 ? (
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
