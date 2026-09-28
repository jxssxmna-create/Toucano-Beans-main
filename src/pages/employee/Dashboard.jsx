import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderControls from '../../components/HeaderControls';
import Logo from '../../components/Logo';
import { fetchProducts } from '../../lib/productsApi';
import {
  adjustOrderItem,
  fetchCustomerLoyalty,
  fetchEmployeeOrders,
  setProductStock,
  subscribeEmployeeFeed,
} from '../../lib/employeeApi';

const STAMPS_PER_CARD = 6;

const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-slate-200 text-slate-600 border-slate-300',
};

const CATEGORY_LABEL = {
  'coffee-beans': { en: 'Coffee Beans', ar: 'حبوب القهوة' },
  'drip-coffee': { en: 'Drip Coffee', ar: 'قهوة مقطرة' },
  essentials: { en: 'Coffee Essentials', ar: 'مستلزمات القهوة' },
};

function formatTime(iso, isAr) {
  return new Date(iso).toLocaleString(isAr ? 'ar-QA' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StampRow({ stamps }) {
  const filled = stamps % STAMPS_PER_CARD;
  return (
    <span className="inline-flex gap-0.5" aria-label={`${filled}/${STAMPS_PER_CARD} stamps`}>
      {Array.from({ length: STAMPS_PER_CARD }, (_, i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full border ${
            i < filled ? 'bg-[#FF5F1F] border-[#FF5F1F]' : 'bg-white border-slate-300'
          }`}
        />
      ))}
    </span>
  );
}

function LoyaltyChip({ loyalty, isAr }) {
  if (!loyalty) {
    return <span className="text-xs text-slate-500">{isAr ? 'ضيف — بدون بطاقة' : 'Guest — no loyalty card'}</span>;
  }
  const stamps = loyalty.loyalty_stamps || 0;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs font-semibold">
      <StampRow stamps={stamps} />
      <span>
        {stamps % STAMPS_PER_CARD}/{STAMPS_PER_CARD}
      </span>
      {loyalty.free_bag_vouchers > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-[#FF5F1F] text-white">
          🎁 {loyalty.free_bag_vouchers} {isAr ? 'كيس مجاني' : 'free bag'}
        </span>
      )}
    </span>
  );
}

function SubstitutePanel({ item, products, isAr, busy, onConfirm, onCancel }) {
  const candidates = useMemo(() => {
    const available = products.filter((p) => p.in_stock !== false && p.id !== item.product_id);
    const same = available.filter((p) => p.category === item.category);
    const other = available.filter((p) => p.category !== item.category);
    return { same, other };
  }, [products, item]);
  const [productId, setProductId] = useState(candidates.same[0]?.id || candidates.other[0]?.id || '');
  const [qty, setQty] = useState(item.qty || 1);
  const [note, setNote] = useState('');

  return (
    <div className="mt-2 rounded-xl border border-[#FF5F1F]/40 bg-[#FAF0DF]/60 p-3 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-[#FF5F1F]">
        {isAr ? `استبدال: ${item.name}` : `Substitute: ${item.name}`}
      </p>
      <div className="grid sm:grid-cols-[1fr_5rem] gap-2">
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="border border-slate-300 rounded-lg px-2 py-2 bg-white text-sm"
        >
          {candidates.same.length > 0 && (
            <optgroup label={isAr ? 'نفس الفئة' : 'Same category'}>
              {candidates.same.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {Number(p.price).toFixed(2)} QAR
                </option>
              ))}
            </optgroup>
          )}
          {candidates.other.length > 0 && (
            <optgroup label={isAr ? 'فئات أخرى' : 'Other categories'}>
              {candidates.other.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {Number(p.price).toFixed(2)} QAR
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <input
          type="number"
          min={1}
          max={99}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
          className="border border-slate-300 rounded-lg px-2 py-2 text-sm"
          aria-label={isAr ? 'الكمية' : 'Quantity'}
        />
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={200}
        placeholder={isAr ? 'ملاحظة للعميل (اختياري)' : 'Note for the customer (optional)'}
        className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!productId || busy}
          onClick={() => onConfirm({ productId, qty, note })}
          className="px-3 py-1.5 rounded-lg bg-[#FF5F1F] text-white text-sm font-bold disabled:opacity-50"
        >
          {isAr ? 'تأكيد الاستبدال' : 'Confirm swap'}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold">
          {isAr ? 'إلغاء' : 'Cancel'}
        </button>
      </div>
      {!candidates.same.length && !candidates.other.length && (
        <p className="text-xs text-red-600">{isAr ? 'لا توجد منتجات متوفرة' : 'No in-stock products available'}</p>
      )}
    </div>
  );
}

function OrderCard({ order, productsById, products, loyalty, isAr, onAdjust }) {
  const [subIndex, setSubIndex] = useState(null);
  const [busy, setBusy] = useState(false);
  const items = Array.isArray(order.items) ? order.items : [];
  const editable = order.status === 'pending';
  const subs = Array.isArray(order.substitutions) ? order.substitutions : [];
  const outCount = items.filter((i) => productsById[i.product_id]?.in_stock === false).length;

  async function run(args) {
    setBusy(true);
    try {
      await onAdjust({ orderId: order.id, ...args });
      setSubIndex(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`bg-white border rounded-2xl p-4 shadow-sm ${outCount ? 'border-red-300' : 'border-slate-200'}`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-lg truncate">{order.customer_name || (isAr ? 'عميل' : 'Customer')}</p>
          <p className="text-xs text-slate-500">
            #{order.id.slice(0, 8)} · {formatTime(order.created_at, isAr)}
            {order.phone_number && ` · ${order.phone_number}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {outCount > 0 && (
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
              {isAr ? `${outCount} غير متوفر` : `${outCount} out of stock`}
            </span>
          )}
          <span className={`text-xs font-bold px-2 py-1 rounded-full border capitalize ${STATUS_STYLE[order.status] || STATUS_STYLE.cancelled}`}>
            {order.status}
          </span>
        </div>
      </header>

      <div className="mt-2 grid sm:grid-cols-2 gap-2 text-sm">
        <p className="text-slate-700">
          <span className="font-semibold">{isAr ? 'التوصيل: ' : 'Delivery: '}</span>
          {[order.address_label, order.delivery_location].filter(Boolean).join(' — ') || '—'}
        </p>
        <p className="sm:text-end">
          <span className="font-semibold">{isAr ? 'الولاء: ' : 'Loyalty: '}</span>
          <LoyaltyChip loyalty={loyalty} isAr={isAr} />
        </p>
      </div>
      {order.notes && <p className="mt-1 text-sm text-slate-600 italic">“{order.notes}”</p>}

      <ul className="mt-3 divide-y divide-slate-100 border-y border-slate-100">
        {items.map((item, index) => {
          const product = productsById[item.product_id];
          const inStock = product ? product.in_stock !== false : true;
          return (
            <li key={`${item.product_id}-${index}`} className="py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {Number(item.price).toFixed(2)} QAR ·{' '}
                    <span className={inStock ? 'text-emerald-700' : 'text-red-600 font-bold'}>
                      {inStock ? (isAr ? 'متوفر' : 'In stock') : isAr ? 'غير متوفر' : 'Out of stock'}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {editable && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run({ index, qty: Math.max(0, (item.qty || 1) - 1) })}
                      className="w-7 h-7 rounded-lg border border-slate-300 font-bold disabled:opacity-40"
                      aria-label={isAr ? 'إنقاص' : 'Decrease'}
                    >
                      −
                    </button>
                  )}
                  <span className="w-8 text-center font-bold">×{item.qty || 1}</span>
                  {editable && (
                    <>
                      <button
                        type="button"
                        disabled={busy || (item.qty || 1) >= 99}
                        onClick={() => run({ index, qty: (item.qty || 1) + 1 })}
                        className="w-7 h-7 rounded-lg border border-slate-300 font-bold disabled:opacity-40"
                        aria-label={isAr ? 'زيادة' : 'Increase'}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setSubIndex(subIndex === index ? null : index)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          inStock
                            ? 'border-slate-300 text-slate-700'
                            : 'border-[#FF5F1F] bg-[#FF5F1F] text-white'
                        }`}
                      >
                        {isAr ? 'استبدال' : 'Swap'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(isAr ? `حذف ${item.name} من الطلب؟` : `Remove ${item.name} from the order?`)) {
                            run({ index, qty: 0 });
                          }
                        }}
                        className="px-2 py-1 rounded-lg text-xs font-bold text-red-600"
                      >
                        {isAr ? 'حذف' : 'Remove'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {subIndex === index && (
                <SubstitutePanel
                  item={item}
                  products={products}
                  isAr={isAr}
                  busy={busy}
                  onCancel={() => setSubIndex(null)}
                  onConfirm={({ productId, qty, note }) => run({ index, productId, qty, note })}
                />
              )}
            </li>
          );
        })}
        {!items.length && <li className="py-2 text-sm text-slate-500">{isAr ? 'لا توجد منتجات' : 'No items'}</li>}
      </ul>

      {subs.length > 0 && (
        <details className="mt-2 text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold">
            {isAr ? `سجل التعديلات (${subs.length})` : `Change log (${subs.length})`}
          </summary>
          <ul className="mt-1 space-y-0.5">
            {subs.map((s, i) => (
              <li key={i}>
                {formatTime(s.at, isAr)} · <span className="font-semibold">{s.action}</span>: {s.from?.name} ×{s.from?.qty}
                {s.to ? ` → ${s.to.name} ×${s.to.qty}` : ''}
                {s.note ? ` — “${s.note}”` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="mt-3 text-end font-bold">
        {isAr ? 'الإجمالي: ' : 'Total: '}
        <span className="text-[#FF5F1F]">{Number(order.total || 0).toFixed(2)} QAR</span>
      </p>
    </article>
  );
}

export default function EmployeeDashboard({ session, profile, lang = 'en', setLang, onSignOut }) {
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loyalty, setLoyalty] = useState({});
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [message, setMessage] = useState(null);
  const [stockBusy, setStockBusy] = useState(null);

  const productsById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);

  const refreshLoyalty = useCallback(async (list) => {
    try {
      setLoyalty(await fetchCustomerLoyalty(list.map((o) => o.user_id)));
    } catch (err) {
      console.error('[employee] loyalty', err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [o, p] = await Promise.all([fetchEmployeeOrders(), fetchProducts()]);
        if (!active) return;
        setOrders(o);
        setProducts(p);
        refreshLoyalty(o);
      } catch (err) {
        if (active) setMessage({ type: 'error', text: err.message });
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsubscribe = subscribeEmployeeFeed({
      onOrder: ({ eventType, new: row, old }) => {
        setLive(true);
        setOrders((prev) => {
          if (eventType === 'DELETE') return prev.filter((o) => o.id !== old.id);
          const exists = prev.some((o) => o.id === row.id);
          const next = exists ? prev.map((o) => (o.id === row.id ? row : o)) : [row, ...prev];
          if (!exists && row.user_id) refreshLoyalty(next);
          return next;
        });
      },
      onProduct: ({ new: row }) => {
        setLive(true);
        setProducts((prev) => prev.map((p) => (p.id === row.id ? { ...p, ...row } : p)));
      },
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [refreshLoyalty]);

  async function handleAdjust(args) {
    setMessage(null);
    try {
      const updated = await adjustOrderItem(args);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setMessage({ type: 'success', text: isAr ? 'تم تحديث الطلب' : 'Order updated' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      throw err;
    }
  }

  async function toggleStock(product) {
    const next = product.in_stock === false;
    setStockBusy(product.id);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, in_stock: next } : p)));
    try {
      await setProductStock(product.id, next);
    } catch (err) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, in_stock: !next } : p)));
      setMessage({ type: 'error', text: err.message });
    } finally {
      setStockBusy(null);
    }
  }

  const visibleOrders = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const outOfStock = products.filter((p) => p.in_stock === false).length;

  const customers = useMemo(() => {
    const map = new Map();
    for (const o of orders) {
      if (!o.user_id) continue;
      const entry = map.get(o.user_id) || { user_id: o.user_id, name: o.customer_name, orders: 0, pending: 0, last: o.created_at };
      entry.orders += 1;
      if (o.status === 'pending') entry.pending += 1;
      if (o.created_at > entry.last) entry.last = o.created_at;
      map.set(o.user_id, entry);
    }
    return [...map.values()].sort((a, b) => b.pending - a.pending || (b.last > a.last ? 1 : -1));
  }, [orders]);

  const tabs = [
    { id: 'orders', label: isAr ? `الطلبات (${pendingCount})` : `Orders (${pendingCount})` },
    { id: 'inventory', label: isAr ? `المخزون${outOfStock ? ` (${outOfStock} نفد)` : ''}` : `Inventory${outOfStock ? ` (${outOfStock} out)` : ''}` },
    { id: 'loyalty', label: isAr ? 'بطاقات الولاء' : 'Loyalty Cards' },
  ];

  return (
    <div className="bg-[#FAF0DF] text-slate-900 min-h-screen font-serif" dir="ltr">
      <header className="border-b border-slate-300/70 bg-[#FAF0DF]/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size="sm" className="shrink-0" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-[#FF5F1F] font-bold">
                {isAr ? 'لوحة الموظفين' : 'Employee Dashboard'}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide truncate">TOUCANO BEANS</h1>
              <p className="text-xs text-slate-500 truncate">
                {profile?.full_name} · {session?.user?.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${live ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
              title={isAr ? 'تحديثات مباشرة' : 'Real-time updates'}
            >
              ● {isAr ? 'مباشر' : 'Live'}
            </span>
            <button
              type="button"
              onClick={() => navigate('/employee/profile')}
              className="px-3 py-2 text-sm rounded-lg bg-white border border-slate-300 font-semibold hover:border-[#FF5F1F]"
            >
              {isAr ? 'ملفي' : 'My Profile'}
            </button>
            <HeaderControls lang={lang} setLang={setLang} onHome={() => navigate('/')} showMenu={false} />
            <button
              type="button"
              onClick={onSignOut}
              className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium"
            >
              {isAr ? 'خروج' : 'Sign Out'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {message && (
          <div
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`rounded-xl px-4 py-3 text-sm ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                tab === t.id ? 'bg-[#FF5F1F] text-white border-[#FF5F1F]' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-16 text-slate-600">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
        ) : (
          <>
            {tab === 'orders' && (
              <section className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {['pending', 'delivered', 'cancelled', 'all'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold border capitalize ${
                        statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {visibleOrders.length === 0 ? (
                  <p className="text-center py-12 text-slate-600">{isAr ? 'لا توجد طلبات' : 'No orders'}</p>
                ) : (
                  visibleOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      products={products}
                      productsById={productsById}
                      loyalty={order.user_id ? loyalty[order.user_id] : null}
                      isAr={isAr}
                      onAdjust={handleAdjust}
                    />
                  ))
                )}
              </section>
            )}

            {tab === 'inventory' && (
              <section className="space-y-6">
                {Object.keys(CATEGORY_LABEL).map((cat) => {
                  const list = products.filter((p) => p.category === cat);
                  if (!list.length) return null;
                  return (
                    <div key={cat}>
                      <h2 className="text-xl font-bold mb-3">{CATEGORY_LABEL[cat][isAr ? 'ar' : 'en']}</h2>
                      <ul className="grid sm:grid-cols-2 gap-3">
                        {list.map((p) => {
                          const inStock = p.in_stock !== false;
                          return (
                            <li
                              key={p.id}
                              className={`flex items-center justify-between gap-3 bg-white border rounded-xl px-4 py-3 ${
                                inStock ? 'border-slate-200' : 'border-red-200 bg-red-50/40'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{p.name}</p>
                                <p className="text-xs text-slate-500">{Number(p.price).toFixed(2)} QAR</p>
                              </div>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={inStock}
                                disabled={stockBusy === p.id}
                                onClick={() => toggleStock(p)}
                                className="flex items-center gap-2 text-xs font-bold shrink-0 disabled:opacity-60"
                              >
                                <span className={inStock ? 'text-emerald-700' : 'text-red-600'}>
                                  {inStock ? (isAr ? 'متوفر' : 'In stock') : isAr ? 'نفد' : 'Out of stock'}
                                </span>
                                <span
                                  className={`relative w-11 h-6 rounded-full transition ${inStock ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                  <span
                                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                                      inStock ? 'left-[1.375rem]' : 'left-0.5'
                                    }`}
                                  />
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </section>
            )}

            {tab === 'loyalty' && (
              <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {customers.length === 0 ? (
                  <p className="text-center py-12 text-slate-600">{isAr ? 'لا يوجد عملاء بعد' : 'No customers yet'}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="text-start px-4 py-3">{isAr ? 'العميل' : 'Customer'}</th>
                        <th className="text-start px-4 py-3">{isAr ? 'البطاقة' : 'Card'}</th>
                        <th className="text-start px-4 py-3">{isAr ? 'الطلبات' : 'Orders'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((c) => {
                        const l = loyalty[c.user_id];
                        return (
                          <tr key={c.user_id}>
                            <td className="px-4 py-3">
                              <p className="font-semibold">{l?.full_name || c.name || '—'}</p>
                              <p className="text-xs text-slate-500">{l?.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <LoyaltyChip loyalty={l} isAr={isAr} />
                              {l && (l.loyalty_stamps % STAMPS_PER_CARD) === STAMPS_PER_CARD - 1 && (
                                <p className="text-xs text-[#FF5F1F] font-bold mt-1">
                                  {isAr ? 'الطلب القادم = كيس مجاني!' : 'Next order earns a free bag!'}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {c.orders}
                              {c.pending > 0 && (
                                <span className="ms-2 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                  {c.pending} {isAr ? 'قيد التنفيذ' : 'incoming'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
