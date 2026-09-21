import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VerifyModal from '../components/VerifyModal';
import QuantitySelector from '../components/QuantitySelector';
import LocationPicker from '../components/LocationPicker';
import Logo from '../components/Logo';
import { useCart } from '../context/CartContext';
import {
  applyLoyaltyStamp,
  createOrder,
  fetchSavedAddresses,
  upsertSavedAddress,
} from '../lib/commerceApi';
import { formatAddressLine } from '../lib/maps';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { normalizePhone, validatePhone } from '../lib/authHelpers';

const DELIVERY_FEE = 15;
const PROMO_CODES = {
  WELCOME10: { type: 'percent', value: 10, label: '10% off' },
  TOUCANO15: { type: 'percent', value: 15, label: '15% off' },
  FREESHIP: { type: 'shipping', value: 0, label: 'Free delivery' },
};

export default function CheckoutPage({
  session,
  profile,
  lang = 'en',
  setLang,
  onSignOut,
}) {
  const isAr = lang === 'ar';
  const navigate = useNavigate();
  const { lines, subtotal, setQty, clearCart } = useCart();

  const [customer, setCustomer] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    email: session?.user?.email || profile?.email || '',
  });
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [addingLocation, setAddingLocation] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    building_number: '',
    street_number: '',
    zone_number: '',
    google_map_link: '',
    lat: null,
    lng: null,
  });
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setCustomer({
      full_name: profile?.full_name || '',
      phone_number: profile?.phone_number || '',
      email: session?.user?.email || profile?.email || '',
    });
  }, [profile, session]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!session?.user?.id || !isSupabaseConfigured) return;
      try {
        const rows = await fetchSavedAddresses(session.user.id);
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
  }, [session?.user?.id]);

  const selectedAddress = addresses.find((a) => a.id === addressId);

  const deliveryFee = useMemo(() => {
    if (promo?.type === 'shipping') return 0;
    if (subtotal <= 0) return 0;
    return DELIVERY_FEE;
  }, [promo, subtotal]);

  const discount = useMemo(() => {
    if (!promo || promo.type !== 'percent') return 0;
    return (subtotal * promo.value) / 100;
  }, [promo, subtotal]);

  const grandTotal = Math.max(0, subtotal - discount + deliveryFee);

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    const found = PROMO_CODES[code];
    if (!found) {
      setPromo(null);
      setPromoError(isAr ? 'رمز غير صالح' : 'Invalid promo code');
      return;
    }
    setPromo({ code, ...found });
    setPromoError('');
  }

  async function saveCustomerDetails() {
    if (!session?.user?.id || !isSupabaseConfigured) return;
    const phoneErr = validatePhone(customer.phone_number);
    if (phoneErr) throw new Error(phoneErr);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: customer.full_name.trim() || null,
        phone_number: normalizePhone(customer.phone_number),
      })
      .eq('id', session.user.id);
    if (error) throw error;
  }

  async function saveNewLocation() {
    if (!session?.user?.id) {
      setMessage({ type: 'error', text: isAr ? 'سجّل الدخول أولاً' : 'Please sign in first' });
      return;
    }
    if (!newAddr.label.trim()) {
      setMessage({ type: 'error', text: isAr ? 'اسم الموقع مطلوب' : 'Location label required' });
      return;
    }
    const row = await upsertSavedAddress({
      user_id: session.user.id,
      label: newAddr.label.trim(),
      building_number: newAddr.building_number.trim() || null,
      street_number: newAddr.street_number.trim() || null,
      zone_number: newAddr.zone_number.trim() || null,
      google_map_link: newAddr.google_map_link.trim() || null,
      lat: newAddr.lat,
      lng: newAddr.lng,
    });
    setAddresses((prev) => [row, ...prev.filter((a) => a.id !== row.id)]);
    setAddressId(row.id);
    setAddingLocation(false);
    setNewAddr({
      label: 'Home',
      building_number: '',
      street_number: '',
      zone_number: '',
      google_map_link: '',
      lat: null,
      lng: null,
    });
  }

  async function handlePlaceOrder() {
    if (lines.length === 0) return;
    if (!session?.user) {
      setMessage({
        type: 'error',
        text: isAr ? 'سجّل الدخول لإتمام الطلب' : 'Please sign in to place an order',
      });
      navigate('/', { state: { openAccount: true } });
      return;
    }
    if (session.user && !(session.user.email_confirmed_at || session.user.phone_confirmed_at)) {
      setShowVerifyModal(true);
      return;
    }
    await completeOrder();
  }

  async function completeOrder() {
    setLoading(true);
    setMessage(null);
    try {
      await saveCustomerDetails();

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

      if (isSupabaseConfigured) {
        await createOrder({
          user_id: session.user.id,
          customer_name: customer.full_name.trim() || session.user.email || 'Customer',
          phone_number: normalizePhone(customer.phone_number) || 'n/a',
          delivery_location: deliveryLocation,
          status: 'pending',
          total: grandTotal,
          items,
          address_label: selectedAddress?.label || null,
          address_snapshot: selectedAddress || null,
          notes: promo ? `promo:${promo.code}` : '',
        });
        await applyLoyaltyStamp(session.user.id);
      }

      clearCart();
      setMessage({
        type: 'success',
        text: isAr
          ? 'تم تقديم الطلب بنجاح!'
          : 'Order placed successfully!',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || (isAr ? 'فشل تقديم الطلب' : 'Failed to place order'),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#FAF0DF] text-black min-h-screen font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="border-b border-slate-300/70 bg-[#FAF0DF]/95 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <Logo size="sm" className="shrink-0" />
            <span className="font-serif font-black tracking-wide truncate">TOUCANO BEANS</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang?.(isAr ? 'en' : 'ar')}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 font-semibold"
            >
              {isAr ? 'English' : 'العربية'}
            </button>
            <Link
              to="/"
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 font-semibold"
            >
              {isAr ? 'المتجر' : 'Shop'}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <h1 className="text-3xl font-serif font-black text-center">
          {isAr ? 'إتمام الطلب' : 'Checkout'}
        </h1>

        {message && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Top box — customer & delivery */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xl font-serif font-black">
            {isAr ? 'بيانات العميل والتوصيل' : 'Customer & Delivery Details'}
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-black/50 mb-1">
                {isAr ? 'الاسم' : 'Name'}
              </label>
              <input
                value={customer.full_name}
                onChange={(e) => setCustomer({ ...customer, full_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-black/50 mb-1">
                {isAr ? 'الهاتف' : 'Phone'}
              </label>
              <input
                value={customer.phone_number}
                onChange={(e) => setCustomer({ ...customer, phone_number: e.target.value })}
                placeholder="+974XXXXXXXX"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-black/50 mb-1">
                Email
              </label>
              <input
                type="email"
                value={customer.email}
                disabled
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium bg-slate-50"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-semibold uppercase text-black/50">
              {isAr ? 'موقع التوصيل' : 'Delivery location'}
            </label>
            {addresses.length > 0 && !addingLocation && (
              <select
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium bg-white"
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {formatAddressLine(a)}
                  </option>
                ))}
              </select>
            )}
            {!addingLocation ? (
              <button
                type="button"
                onClick={() => setAddingLocation(true)}
                className="text-sm font-semibold text-[#FF5F1F] hover:underline"
              >
                + {isAr ? 'إضافة موقع جديد' : 'Add a new location'}
              </button>
            ) : (
              <div className="space-y-3 border border-slate-200 rounded-xl p-3">
                <input
                  value={newAddr.label}
                  onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                  placeholder={isAr ? 'مثلاً: المنزل، العمل' : 'Label e.g. Home, Work'}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                />
                <div className="grid grid-cols-3 gap-2">
                  {['building_number', 'street_number', 'zone_number'].map((key) => (
                    <input
                      key={key}
                      value={newAddr[key]}
                      onChange={(e) => setNewAddr({ ...newAddr, [key]: e.target.value })}
                      placeholder={key.replace('_', ' ')}
                      className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs font-medium"
                    />
                  ))}
                </div>
                <LocationPicker
                  lang={lang}
                  lat={newAddr.lat}
                  lng={newAddr.lng}
                  googleMapLink={newAddr.google_map_link}
                  onChange={({ lat, lng, google_map_link }) =>
                    setNewAddr((f) => ({ ...f, lat, lng, google_map_link }))
                  }
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveNewLocation}
                    className="flex-1 py-2 rounded-lg bg-[#FF5F1F] text-white text-sm font-semibold"
                  >
                    {isAr ? 'حفظ الموقع' : 'Save location'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingLocation(false)}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Bottom box — order summary */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xl font-serif font-black">
            {isAr ? 'ملخص الطلب' : 'Order Summary & Checkout'}
          </h2>

          {lines.length === 0 ? (
            <p className="text-sm font-medium text-black/50 py-6 text-center">
              {isAr ? 'سلتك فارغة.' : 'Your cart is empty.'}{' '}
              <Link to="/" className="text-[#FF5F1F] font-semibold underline">
                {isAr ? 'تسوق الآن' : 'Continue shopping'}
              </Link>
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
                      <p className="font-semibold text-sm">{product.name}</p>
                      <p className="text-xs font-medium text-black/50">
                        {Number(product.price).toFixed(2)} QAR
                      </p>
                    </div>
                    <p className="font-semibold text-[#FF5F1F] text-sm whitespace-nowrap">
                      {lineTotal.toFixed(2)} QAR
                    </p>
                  </div>
                  <QuantitySelector value={qty} onChange={(next) => setQty(product, next)} />
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2 border-t border-slate-200 pt-3 text-sm font-medium">
            <div className="flex justify-between">
              <span>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span>{subtotal.toFixed(2)} QAR</span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'رسوم التوصيل' : 'Delivery fee'}</span>
              <span>{deliveryFee.toFixed(2)} QAR</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>
                  {isAr ? 'خصم' : 'Discount'} ({promo?.code})
                </span>
                <span>−{discount.toFixed(2)} QAR</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold pt-1">
              <span>{isAr ? 'الإجمالي' : 'Total'}</span>
              <span className="text-[#FF5F1F]">{grandTotal.toFixed(2)} QAR</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-black/50 mb-1">
              {isAr ? 'رمز الخصم' : 'Promo / discount code'}
            </label>
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="WELCOME10"
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
              />
              <button
                type="button"
                onClick={applyPromo}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:border-[#FF5F1F]"
              >
                {isAr ? 'تطبيق' : 'Apply'}
              </button>
            </div>
            {promoError && <p className="text-xs text-red-600 mt-1 font-medium">{promoError}</p>}
            {promo && !promoError && (
              <p className="text-xs text-emerald-700 mt-1 font-medium">
                {promo.label} {isAr ? 'مُطبَّق' : 'applied'}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={loading || lines.length === 0}
            className="w-full py-3.5 rounded-xl bg-[#FF5F1F] text-white font-semibold text-base disabled:opacity-50 hover:brightness-95 transition"
          >
            {loading
              ? isAr
                ? 'جاري المعالجة...'
                : 'Processing...'
              : isAr
                ? 'تأكيد الطلب'
                : 'Place Order'}
          </button>
        </section>
      </main>

      {showVerifyModal && (
        <VerifyModal
          user={session?.user}
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
