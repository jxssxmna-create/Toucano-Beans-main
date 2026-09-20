import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function DeliveryPortal({ session, lang = 'en' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);
  const isAr = lang === 'ar';

  const loadOrders = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setMessage({
        type: 'error',
        text: isAr ? 'قاعدة البيانات غير مهيأة' : 'Database is not configured',
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, phone_number, delivery_location, status, notes, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders, session?.user?.id]);

  async function markDelivered(orderId) {
    setBusyId(orderId);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          assigned_to: session.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('status', 'pending');

      if (error) throw error;
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setMessage({
        type: 'success',
        text: isAr ? 'تم تعليم الطلب كـ مُسلَّم' : 'Order marked as delivered',
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl shadow-md p-5 text-black">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#FF5500]">
            {isAr ? 'بوابة التوصيل' : 'Delivery Portal'}
          </p>
          <h2 className="text-2xl font-black">
            {isAr ? 'الطلبات المعلقة' : 'Pending Orders'}
          </h2>
          <p className="text-sm text-black/60 font-bold mt-1 truncate">{session?.user?.email}</p>
        </div>
        <button
          type="button"
          onClick={loadOrders}
          className="text-sm font-black text-[#FF5500] hover:underline shrink-0"
        >
          {isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`mb-4 rounded-lg px-3 py-2 text-sm font-bold ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="text-center py-10 font-bold text-black/70">
          {isAr ? 'جاري التحميل...' : 'Loading orders...'}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-center py-10 font-bold text-black/60">
          {isAr ? 'لا توجد طلبات معلقة حالياً' : 'No pending orders right now'}
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="border border-slate-200 rounded-xl p-4 bg-[#fdf0de]/40 space-y-2"
            >
              <div>
                <p className="text-xs font-black uppercase text-black/50">
                  {isAr ? 'اسم العميل' : 'Customer Name'}
                </p>
                <p className="font-black text-lg">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-black/50">
                  {isAr ? 'رقم الهاتف' : 'Phone Number'}
                </p>
                <a
                  href={`tel:${order.phone_number}`}
                  className="font-bold text-[#FF5500] hover:underline"
                >
                  {order.phone_number}
                </a>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-black/50">
                  {isAr ? 'موقع التوصيل' : 'Delivery Location (Doha)'}
                </p>
                <p className="font-bold">{order.delivery_location}</p>
              </div>
              {order.notes && (
                <p className="text-sm text-black/70 font-bold">{order.notes}</p>
              )}
              <button
                type="button"
                disabled={busyId === order.id}
                onClick={() => markDelivered(order.id)}
                className="mt-2 w-full bg-[#FF5500] text-white font-black py-2.5 rounded-lg disabled:opacity-60 hover:bg-[#e64d00] transition"
              >
                {busyId === order.id
                  ? isAr
                    ? 'جاري التحديث...'
                    : 'Updating...'
                  : isAr
                    ? 'تم التسليم'
                    : 'Mark as Delivered'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
