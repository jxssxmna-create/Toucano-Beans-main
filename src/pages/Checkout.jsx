import { useEffect, useMemo, useState } from 'react';
import VerifyModal from '../components/VerifyModal';
import QuantitySelector from '../components/QuantitySelector';
import {
  applyLoyaltyStamp,
  createOrder,
  fetchSavedAddresses,
} from '../lib/commerceApi';
import { formatAddressLine } from '../lib/maps';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function Checkout({
  user,
  profile,
  cart = {},
  onQtyChange,
  onOrderPlaced,
  lang = 'en',
}) {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [message, setMessage] = useState(null);
  const isAr = lang === 'ar';

  const isVerified = Boolean(user?.email_confirmed_at || user?.phone_confirmed_at);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id || !isSupabaseConfigured) return;
      try {
        const rows = await fetchSavedAddresses(user.id);
        if (!cancelled) {
          setAddresses(rows);
          if (rows[0]) setAddressId(rows[0].id);
        }
      } catch {
        /* ignore */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
  const selectedAddress = addresses.find((a) => a.id === addressId);

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
    setMessage(null);
    try {
      const items = lines.map(({ product, qty }) => ({
        product_id: product.id,
        name: product.name,
        qty,
        price: Number(product.price),
        category: product.category,
      }));

      const deliveryLocation =
        formatAddressLine(selectedAddress) ||
        [
          profile?.building_number && `Bldg ${profile.building_number}`,
          profile?.street_number && `St ${profile.street_number}`,
          profile?.zone_number && `Zone ${profile.zone_number}`,
        ]
          .filter(Boolean)
          .join(' · ') ||
        profile?.google_map_link ||
        'Doha';

      if (isSupabaseConfigured && user?.id) {
        await createOrder({
          user_id: user.id,
          customer_name: profile?.full_name || user.email || 'Customer',
          phone_number: profile?.phone_number || 'n/a',
          delivery_location: deliveryLocation,
          status: 'pending',
          total,
          items,
          address_label: selectedAddress?.label || null,
          address_snapshot: selectedAddress || {
            google_map_link: profile?.google_map_link,
            building_number: profile?.building_number,
            street_number: profile?.street_number,
            zone_number: profile?.zone_number,
          },
          notes: '',
        });
        await applyLoyaltyStamp(user.id);
      }

      onOrderPlaced?.();
      setMessage({
        type: 'success',
        text: isAr
          ? 'تم تقديم الطلب بنجاح! أُضيف ختم ولاء.'
          : 'Order placed successfully! Loyalty stamp added.',
      });
    } catch (error) {
      console.error('Error placing order:', error?.message || error);
      setMessage({
        type: 'error',
        text: isAr ? 'فشل تقديم الطلب.' : 'Failed to place order. Please try again.',
      });
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

      {message && (
        <div
          className={`text-sm font-bold rounded-lg px-3 py-2 ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {message.text}
        </div>
      )}

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
              <QuantitySelector value={qty} onChange={(next) => onQtyChange?.(product, next)} />
            </li>
          ))}
        </ul>
      )}

      {addresses.length > 0 && (
        <div>
          <label className="block text-xs font-black uppercase text-black/50 mb-1">
            {isAr ? 'عنوان التوصيل' : 'Delivery address'}
          </label>
          <select
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold bg-white"
          >
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} — {formatAddressLine(a)}
              </option>
            ))}
          </select>
        </div>
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
        {loading
          ? isAr
            ? 'جاري المعالجة...'
            : 'Processing...'
          : isAr
            ? 'تأكيد الطلب'
            : 'Place Order'}
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
