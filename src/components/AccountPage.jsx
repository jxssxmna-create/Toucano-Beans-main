import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { EMPTY_PROFILE, PROFILE_UPDATE_FIELDS } from '../lib/profileSchema';
import {
  validateFullName,
  validatePhone,
  validateMapLink,
  normalizePhone,
} from '../lib/authHelpers';
import LocationPicker from './LocationPicker';
import LoyaltyCard from './LoyaltyCard';
import {
  deleteSavedAddress,
  fetchOrders,
  fetchSavedAddresses,
  upsertSavedAddress,
} from '../lib/commerceApi';
import { formatAddressLine, parseLatLng } from '../lib/maps';

export default function AccountPage({ session, lang = 'en' }) {
  const isAr = lang === 'ar';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [message, setMessage] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [addrForm, setAddrForm] = useState({
    label: 'Home',
    building_number: '',
    street_number: '',
    zone_number: '',
    google_map_link: '',
    lat: null,
    lng: null,
  });

  const getProfile = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const fallback = {
        ...EMPTY_PROFILE,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name || '',
        phone_number: session.user.phone || '',
      };

      if (!isSupabaseConfigured) {
        setProfile(fallback);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({ ...EMPTY_PROFILE, ...data });
      } else {
        const seed = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: fallback.full_name || null,
          phone_number: fallback.phone_number || null,
          role: 'buyer',
        };
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .upsert(seed, { onConflict: 'id' })
          .select('*')
          .maybeSingle();

        if (insertError) {
          setProfile(fallback);
        } else {
          setProfile({ ...EMPTY_PROFILE, ...(inserted || seed) });
        }
      }

      try {
        const [addrs, ords] = await Promise.all([
          fetchSavedAddresses(session.user.id),
          fetchOrders({ userId: session.user.id }),
        ]);
        setAddresses(addrs);
        setOrders(ords);
      } catch (err) {
        console.warn(err);
      }
    } catch (err) {
      console.error('Error fetching profile:', err.message);
      setMessage({
        type: 'error',
        text: isAr ? 'تعذر تحميل الملف' : 'Could not load profile. You can still edit and retry save.',
      });
      setProfile({
        ...EMPTY_PROFILE,
        email: session?.user?.email || '',
        full_name: session?.user?.user_metadata?.full_name || '',
      });
    } finally {
      setLoading(false);
    }
  }, [session, isAr]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  async function updateProfile(e) {
    e.preventDefault();
    setMessage(null);
    if (!session?.user) return;

    const nameErr = validateFullName(profile.full_name);
    if (nameErr) return setMessage({ type: 'error', text: nameErr });

    const phoneErr = validatePhone(profile.phone_number);
    if (phoneErr) return setMessage({ type: 'error', text: phoneErr });

    const mapErr = validateMapLink(profile.google_map_link);
    if (mapErr) return setMessage({ type: 'error', text: mapErr });

    if (!isSupabaseConfigured) {
      return setMessage({ type: 'error', text: 'Cannot save — Supabase is not configured.' });
    }

    try {
      setSaving(true);
      const updates = {
        id: session.user.id,
        email: session.user.email || profile.email || '',
      };
      for (const field of PROFILE_UPDATE_FIELDS) {
        if (field === 'phone_number') updates.phone_number = normalizePhone(profile.phone_number);
        else if (field === 'google_map_link') {
          updates.google_map_link = (profile.google_map_link || '').trim() || null;
        } else {
          updates[field] = (profile[field] || '').trim() || null;
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' })
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (data) setProfile({ ...EMPTY_PROFILE, ...data });
      setMessage({ type: 'success', text: isAr ? 'تم الحفظ' : 'Profile saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  }

  async function saveAddress(e) {
    e.preventDefault();
    if (!session?.user) return;
    if (!addrForm.label.trim()) {
      setMessage({ type: 'error', text: isAr ? 'اسم العنوان مطلوب' : 'Address label is required' });
      return;
    }
    try {
      setSaving(true);
      const row = await upsertSavedAddress({
        user_id: session.user.id,
        label: addrForm.label.trim(),
        building_number: addrForm.building_number.trim() || null,
        street_number: addrForm.street_number.trim() || null,
        zone_number: addrForm.zone_number.trim() || null,
        google_map_link: addrForm.google_map_link.trim() || null,
        lat: addrForm.lat,
        lng: addrForm.lng,
      });
      setAddresses((prev) => {
        const rest = prev.filter((a) => a.id !== row.id);
        return [row, ...rest];
      });
      setAddrForm({
        label: 'Home',
        building_number: '',
        street_number: '',
        zone_number: '',
        google_map_link: '',
        lat: null,
        lng: null,
      });
      setMessage({ type: 'success', text: isAr ? 'تم حفظ العنوان' : 'Address saved' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(id) {
    try {
      await deleteSavedAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  if (!session) {
    return (
      <div className="text-center py-10 font-bold">
        {isAr ? 'سجّل الدخول لعرض حسابك' : 'Please sign in to view your account.'}
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-10 font-bold">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  const parsedDefault = parseLatLng(profile.google_map_link);

  return (
    <div className="w-full space-y-6">
      <h2 className="text-2xl font-serif font-black">
        {isAr ? 'إعدادات الحساب' : 'Account Settings'}
      </h2>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {(profile.role === 'buyer' || !profile.role) && (
        <LoyaltyCard
          stamps={profile.loyalty_stamps}
          vouchers={profile.free_bag_vouchers}
          lang={lang}
        />
      )}

      <form onSubmit={updateProfile} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3" noValidate>
        <div>
          <label className="block text-xs font-black uppercase text-black/50 mb-1">Email</label>
          <input
            type="text"
            value={profile.email || session.user.email || ''}
            disabled
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-black/50 mb-1">
            {isAr ? 'الاسم الكامل' : 'Full Name'}
          </label>
          <input
            value={profile.full_name || ''}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            required
            disabled={saving}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-black/50 mb-1">
            {isAr ? 'الهاتف' : 'Phone'}
          </label>
          <input
            value={profile.phone_number || ''}
            onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
            required
            disabled={saving}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
          />
        </div>

        <h3 className="font-black pt-2">{isAr ? 'العنوان الافتراضي' : 'Default Delivery Address'}</h3>
        <div className="grid grid-cols-3 gap-2">
          {['building_number', 'street_number', 'zone_number'].map((key) => (
            <input
              key={key}
              value={profile[key] || ''}
              onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
              placeholder={key.replace('_', ' ')}
              disabled={saving}
              className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm font-bold"
            />
          ))}
        </div>

        <LocationPicker
          lang={lang}
          lat={parsedDefault?.lat}
          lng={parsedDefault?.lng}
          googleMapLink={profile.google_map_link || ''}
          onChange={({ lat, lng, google_map_link }) =>
            setProfile((p) => ({ ...p, google_map_link, lat, lng }))
          }
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-emerald-600 text-white font-black py-2.5 rounded-lg disabled:opacity-60"
        >
          {saving ? (isAr ? 'جارٍ...' : 'Saving...') : isAr ? 'حفظ الملف' : 'Save Profile'}
        </button>
      </form>

      <form onSubmit={saveAddress} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <h3 className="font-black text-lg">
          {isAr ? 'عناوين محفوظة' : 'Saved Addresses'}
        </h3>
        <input
          value={addrForm.label}
          onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
          placeholder={isAr ? 'مثلاً: المنزل، العمل، النادي' : 'Label e.g. Home, Work, Gym'}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
        />
        <div className="grid grid-cols-3 gap-2">
          {['building_number', 'street_number', 'zone_number'].map((key) => (
            <input
              key={key}
              value={addrForm[key]}
              onChange={(e) => setAddrForm({ ...addrForm, [key]: e.target.value })}
              placeholder={key.replace('_', ' ')}
              className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm font-bold"
            />
          ))}
        </div>
        <LocationPicker
          lang={lang}
          lat={addrForm.lat}
          lng={addrForm.lng}
          googleMapLink={addrForm.google_map_link}
          onChange={({ lat, lng, google_map_link }) =>
            setAddrForm((f) => ({ ...f, lat, lng, google_map_link }))
          }
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#FF5500] text-white font-black py-2.5 rounded-lg"
        >
          {isAr ? 'حفظ العنوان' : 'Save Address'}
        </button>

        <ul className="space-y-2 pt-2">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-2 border border-slate-200 rounded-xl px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-black truncate">{a.label}</p>
                <p className="text-xs font-bold text-black/60">{formatAddressLine(a)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeAddress(a.id)}
                className="text-red-600 text-xs font-black shrink-0"
              >
                {isAr ? 'حذف' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <h3 className="font-black text-lg">{isAr ? 'سجل الطلبات' : 'Order History'}</h3>
        {orders.length === 0 ? (
          <p className="text-sm font-bold text-black/50">
            {isAr ? 'لا توجد طلبات بعد' : 'No past orders yet.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.map((o) => (
              <li key={o.id} className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold">
                <div className="flex justify-between gap-2">
                  <span className="text-[#FF5500]">{Number(o.total || 0).toFixed(2)} QAR</span>
                  <span className="capitalize text-black/50">{o.status}</span>
                </div>
                <p className="text-xs text-black/50">{new Date(o.created_at).toLocaleString()}</p>
                {Array.isArray(o.items) && o.items.length > 0 && (
                  <p className="text-xs mt-1">
                    {o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
