import { useMemo, useState } from 'react';
import VerifyModal from '../components/VerifyModal';
import QuantitySelector from '../components/QuantitySelector';

export default function Checkout({ user, cart = {}, onQtyChange, lang = 'en' }) {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const isAr = lang === 'ar';

  const isVerified = Boolean(user?.email_confirmed_at || user?.phone_confirmed_at);

  const lines = useMemo(
    () =>
      Object.values(cart)
        .filter((entry) => entry?.qty > 0 && entry?.product)
        .map((entry) => ({
          ...entry,
          lineTotal: Number(entry.product.price) * Number(entry.qty),
        })),
    [cart]
  );

  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  async function handlePlaceOrder() {
    if (lines.length === 0) return;
    if (user && !isVerified) {
      setShowVerifyModal(true);
      return;
    }
    await completeOrder();
  }

  async function completeOrder() {
    setLoading(true);
    try {
      alert(isAr ? 'تم تقديم الطلب بنجاح!' : 'Order placed successfully! Delivery details sent to driver.');
    } catch (error) {
      console.error('Error placing order:', error?.message || error);
      alert(isAr ? 'فشل تقديم الطلب.' : 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow p-5 space-y-4 text-black">
      <h2 className="text-2xl font-black m-0">{isAr ? 'الدفع' : 'Checkout'}</h2>
      <p className="text-sm font-bold text-black/60 m-0">
        {isAr ? 'راجع سلة القهوة وأكمل طلبك.' : 'Review your coffee cart and complete your order.'}
      </p>

      {lines.length === 0 ? (
        <p className="font-bold text-black/50 py-6 text-center">
          {isAr ? 'سلتك فارغة.' : 'Your cart is empty.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {lines.map(({ product, qty, lineTotal }) => (
            <li
              key={product.id}
              className="flex flex-col gap-2 border border-slate-200 rounded-xl p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-sm">{product.name}</p>
                  <p className="text-xs font-bold text-black/50">
                    {Number(product.price).toFixed(2)} QAR
                  </p>
                </div>
                <p className="font-black text-[#FF5500] text-sm whitespace-nowrap">
                  {lineTotal.toFixed(2)} QAR
                </p>
              </div>
              <QuantitySelector
                value={qty}
                onChange={(next) => onQtyChange?.(product, next)}
              />
            </li>
          ))}
        </ul>
      )}

      {lines.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="font-black">{isAr ? 'الإجمالي' : 'Total'}</span>
          <span className="font-black text-[#FF5500] text-lg">{total.toFixed(2)} QAR</span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={loading || lines.length === 0}
        className="w-full py-3 rounded-lg font-black bg-[#c84b1d] text-white disabled:opacity-50 hover:bg-[#a83d16] transition"
      >
        {loading ? (isAr ? 'جاري المعالجة...' : 'Processing...') : isAr ? 'تأكيد الطلب' : 'Place Order'}
      </button>

      {showVerifyModal && (
        <VerifyModal
          user={user}
          onVerified={() => {
            setShowVerifyModal(false);
            completeOrder();
          }}
          onClose={() => setShowVerifyModal(false)}
        />
      )}
    </div>
  );
}
