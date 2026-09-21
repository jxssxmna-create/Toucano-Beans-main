import { useNavigate } from 'react-router-dom';
import QuantitySelector from './QuantitySelector';
import { useCart } from '../context/CartContext';
import { LOGO_SRC, handleLogoError } from '../lib/logo';

export default function CartDrawer({ lang = 'en' }) {
  const isAr = lang === 'ar';
  const navigate = useNavigate();
  const { lines, subtotal, cartCount, isCartOpen, closeCart, setQty } = useCart();

  function goCheckout() {
    closeCart();
    navigate('/checkout');
  }

  return (
    <>
      {isCartOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/40 z-40"
          aria-label={isAr ? 'إغلاق السلة' : 'Close cart'}
          onClick={closeCart}
        />
      )}

      <div
        dir="ltr"
        className={`fixed inset-y-0 left-0 w-[min(100%,22rem)] bg-[#FAF0DF] border-r border-slate-300/60 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isCartOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? 'سلة التسوق' : 'Shopping cart'}
      >
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          className="flex flex-col h-full font-sans"
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-300/70">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5F1F]">
                {isAr ? 'السلة' : 'Cart'}
              </p>
              <h2 className="text-xl font-serif font-black text-black">
                {isAr ? 'سلة التسوق' : 'Your Cart'}
                {cartCount > 0 ? ` (${cartCount})` : ''}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="w-9 h-9 rounded-full border border-slate-300 font-semibold text-black hover:text-[#FF5F1F]"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {lines.length === 0 ? (
              <p className="text-sm font-medium text-black/50 text-center py-12">
                {isAr ? 'سلتك فارغة' : 'Your cart is empty'}
              </p>
            ) : (
              lines.map(({ product, qty, lineTotal }) => (
                <div
                  key={product.id}
                  className="flex gap-3 bg-white border border-slate-200 rounded-xl p-3"
                >
                  <img
                    src={product.image_url || LOGO_SRC}
                    alt=""
                    onError={handleLogoError}
                    className="w-14 h-14 rounded-lg object-cover bg-orange-50 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-semibold truncate">{product.name}</p>
                      <p className="text-sm font-semibold text-[#FF5F1F] whitespace-nowrap">
                        {lineTotal.toFixed(2)}
                      </p>
                    </div>
                    <QuantitySelector
                      value={qty}
                      onChange={(next) => setQty(product, next)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-300/70 px-4 py-4 space-y-3 bg-[#FAF0DF]">
            <div className="flex justify-between text-sm font-semibold">
              <span>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span className="text-[#FF5F1F]">{subtotal.toFixed(2)} QAR</span>
            </div>
            <button
              type="button"
              onClick={goCheckout}
              disabled={lines.length === 0}
              className="w-full py-3.5 rounded-xl bg-[#FF5F1F] text-white font-semibold text-base disabled:opacity-40 hover:brightness-95 transition"
            >
              {isAr ? 'إتمام الطلب' : 'Check Out'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
