import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { normalizePhone, validateFullName, validatePhone } from '../lib/authHelpers';

export default function DriverProfileForm({ session, lang = 'en' }) {
  const isAr = lang === 'ar';
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    vehicle_type: 'car',
    vehicle_plate: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!session?.user?.id || !isSupabaseConfigured) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone_number, vehicle_type, vehicle_plate')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!cancelled && data) {
        setForm({
          full_name: data.full_name || '',
          phone_number: data.phone_number || '',
          vehicle_type: data.vehicle_type || 'car',
          vehicle_plate: data.vehicle_plate || '',
        });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  async function save(e) {
    e.preventDefault();
    setMessage(null);
    const nameErr = validateFullName(form.full_name);
    if (nameErr) return setMessage({ type: 'error', text: nameErr });
    const phoneErr = validatePhone(form.phone_number);
    if (phoneErr) return setMessage({ type: 'error', text: phoneErr });
    if (!form.vehicle_plate.trim()) {
      return setMessage({
        type: 'error',
        text: isAr ? 'رقم اللوحة مطلوب' : 'Vehicle plate number is required',
      });
    }
    if (!['car', 'bike'].includes(form.vehicle_type)) {
      return setMessage({ type: 'error', text: isAr ? 'اختر نوع المركبة' : 'Select vehicle type' });
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          phone_number: normalizePhone(form.phone_number),
          vehicle_type: form.vehicle_type,
          vehicle_plate: form.vehicle_plate.trim().toUpperCase(),
        })
        .eq('id', session.user.id);
      if (error) throw error;
      setMessage({ type: 'success', text: isAr ? 'تم تحديث الملف' : 'Profile updated' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md space-y-3 mb-6"
    >
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-[#FF5500]">
          {isAr ? 'ملف السائق' : 'Driver Profile'}
        </p>
        <h2 className="text-xl font-black">
          {isAr ? 'الاسم · الهاتف · المركبة' : 'Name · Phone · Vehicle'}
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

      <input
        required
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        placeholder={isAr ? 'الاسم الكامل' : 'Full Name'}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
      />
      <input
        required
        value={form.phone_number}
        onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
        placeholder="+974XXXXXXXX"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
      />
      <select
        value={form.vehicle_type}
        onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold bg-white"
      >
        <option value="car">{isAr ? 'سيارة' : 'Car'}</option>
        <option value="bike">{isAr ? 'دراجة' : 'Bike'}</option>
      </select>
      <input
        required
        value={form.vehicle_plate}
        onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })}
        placeholder={isAr ? 'رقم لوحة المركبة' : 'Vehicle Plate Number'}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
      />
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#FF5500] text-white font-black py-2.5 rounded-lg disabled:opacity-60"
      >
        {saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : isAr ? 'حفظ الملف' : 'Save Profile'}
      </button>
    </form>
  );
}
