import { useEffect, useState } from 'react';
import LoyaltyCard from '../LoyaltyCard';
import { fetchOrders, updateProfileAdmin } from '../../lib/commerceApi';
import { supabase } from '../../lib/supabaseClient';

const emptyEdit = {
  full_name: '',
  email: '',
  phone_number: '',
  vehicle_type: '',
  vehicle_plate: '',
  building_number: '',
  street_number: '',
  zone_number: '',
  google_map_link: '',
  loyalty_stamps: 0,
  free_bag_vouchers: 0,
};

export default function UserManager({ lang = 'en' }) {
  const isAr = lang === 'ar';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [edit, setEdit] = useState(emptyEdit);
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['buyer', 'delivery'])
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (!cancelled) setUsers(data || []);
      } catch (err) {
        if (!cancelled) setMessage({ type: 'error', text: err.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openUser(user) {
    setSelected(user);
    setEdit({
      full_name: user.full_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      vehicle_type: user.vehicle_type || '',
      vehicle_plate: user.vehicle_plate || '',
      building_number: user.building_number || '',
      street_number: user.street_number || '',
      zone_number: user.zone_number || '',
      google_map_link: user.google_map_link || '',
      loyalty_stamps: user.loyalty_stamps || 0,
      free_bag_vouchers: user.free_bag_vouchers || 0,
    });
    setMessage(null);
    try {
      const rows = await fetchOrders({ userId: user.id });
      setOrders(rows);
    } catch {
      setOrders([]);
    }
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    try {
      const updates = {
        full_name: edit.full_name.trim() || null,
        email: edit.email.trim() || null,
        phone_number: edit.phone_number.trim() || null,
        vehicle_type: edit.vehicle_type || null,
        vehicle_plate: edit.vehicle_plate.trim() || null,
        building_number: edit.building_number.trim() || null,
        street_number: edit.street_number.trim() || null,
        zone_number: edit.zone_number.trim() || null,
        google_map_link: edit.google_map_link.trim() || null,
        loyalty_stamps: Math.min(6, Math.max(0, Number(edit.loyalty_stamps) || 0)),
        free_bag_vouchers: Math.max(0, Number(edit.free_bag_vouchers) || 0),
      };
      const updated = await updateProfileAdmin(selected.id, updates);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setSelected(updated);
      setMessage({ type: 'success', text: isAr ? 'تم الحفظ' : 'Saved' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const field = (key, label, type = 'text') => (
    <div>
      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{label}</label>
      <input
        type={type}
        value={edit[key] ?? ''}
        onChange={(e) => setEdit({ ...edit, [key]: e.target.value })}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
        disabled={saving}
      />
    </div>
  );

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-[#FF5500]">
          {isAr ? 'المستخدمون' : 'Users'}
        </p>
        <h2 className="text-2xl font-black">
          {isAr ? 'إدارة ملفات المشترين والسائقين' : 'Buyer & Driver Profiles'}
        </h2>
      </div>

      {message && (
        <div
          className={`text-sm font-bold rounded-lg px-3 py-2 ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="font-bold text-slate-500">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ul className="space-y-2 max-h-[420px] overflow-y-auto">
            {users.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => openUser(u)}
                  className={`w-full text-start border rounded-xl px-3 py-2 font-bold hover:border-[#FF5500] ${
                    selected?.id === u.id ? 'border-[#FF5500] bg-orange-50' : 'border-slate-200'
                  }`}
                >
                  <span className="text-xs uppercase text-[#FF5500]">{u.role}</span>
                  <p className="truncate">{u.full_name || u.email || u.id}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <div className="space-y-3 border border-slate-200 rounded-xl p-3">
              {field('full_name', isAr ? 'الاسم' : 'Name')}
              {field('email', isAr ? 'البريد' : 'Email', 'email')}
              {field('phone_number', isAr ? 'الهاتف' : 'Phone')}
              {selected.role === 'delivery' && (
                <>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                      {isAr ? 'نوع المركبة' : 'Vehicle Type'}
                    </label>
                    <select
                      value={edit.vehicle_type || ''}
                      onChange={(e) => setEdit({ ...edit, vehicle_type: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold bg-white"
                    >
                      <option value="">—</option>
                      <option value="car">{isAr ? 'سيارة' : 'Car'}</option>
                      <option value="bike">{isAr ? 'دراجة' : 'Bike'}</option>
                    </select>
                  </div>
                  {field('vehicle_plate', isAr ? 'رقم اللوحة' : 'Vehicle Plate')}
                </>
              )}
              {field('building_number', isAr ? 'المبنى' : 'Building')}
              {field('street_number', isAr ? 'الشارع' : 'Street')}
              {field('zone_number', isAr ? 'المنطقة' : 'Zone')}
              {field('google_map_link', isAr ? 'خرائط جوجل' : 'Delivery Address (Maps)')}

              {selected.role === 'buyer' && (
                <>
                  <LoyaltyCard
                    stamps={edit.loyalty_stamps}
                    vouchers={edit.free_bag_vouchers}
                    lang={lang}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {field('loyalty_stamps', 'Stamps', 'number')}
                    {field('free_bag_vouchers', 'Vouchers', 'number')}
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="w-full bg-[#FF5500] text-white font-black py-2.5 rounded-lg disabled:opacity-60"
              >
                {saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : isAr ? 'حفظ' : 'Save Profile'}
              </button>

              <div>
                <h4 className="font-black mb-2">
                  {isAr ? 'سجل الطلبات' : 'Order History'}
                </h4>
                {orders.length === 0 ? (
                  <p className="text-sm font-bold text-slate-500">
                    {isAr ? 'لا طلبات' : 'No orders'}
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto text-sm">
                    {orders.map((o) => (
                      <li key={o.id} className="border border-slate-200 rounded-lg px-2 py-1.5 font-bold">
                        <span className="text-[#FF5500]">{Number(o.total).toFixed(2)} QAR</span>
                        {' · '}
                        {new Date(o.created_at).toLocaleDateString()}
                        {' · '}
                        <span className="capitalize">{o.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm font-bold text-slate-500 self-center text-center">
              {isAr ? 'اختر مستخدماً' : 'Select a user to inspect'}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
