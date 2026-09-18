import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { EMPTY_PROFILE, PROFILE_UPDATE_FIELDS } from '../lib/profileSchema';
import {
  validateFullName,
  validatePhone,
  validateMapLink,
  normalizePhone,
} from '../lib/authHelpers';

export default function AccountPage({ session }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [message, setMessage] = useState(null);

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
        // Profile missing (legacy user) — create buyer row
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
          console.warn('Profile seed failed:', insertError.message);
          setProfile(fallback);
        } else {
          setProfile({ ...EMPTY_PROFILE, ...(inserted || seed) });
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err.message);
      setMessage({ type: 'error', text: 'Could not load profile. You can still edit and retry save.' });
      setProfile({
        ...EMPTY_PROFILE,
        email: session?.user?.email || '',
        full_name: session?.user?.user_metadata?.full_name || '',
      });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  async function updateProfile(e) {
    e.preventDefault();
    setMessage(null);

    if (!session?.user) return;

    const nameErr = validateFullName(profile.full_name);
    if (nameErr) {
      setMessage({ type: 'error', text: nameErr });
      return;
    }

    const phoneErr = validatePhone(profile.phone_number);
    if (phoneErr) {
      setMessage({ type: 'error', text: phoneErr });
      return;
    }

    if (!(profile.building_number || '').trim() || !(profile.street_number || '').trim() || !(profile.zone_number || '').trim()) {
      setMessage({ type: 'error', text: 'Building, street, and zone numbers are required for delivery.' });
      return;
    }

    const mapErr = validateMapLink(profile.google_map_link);
    if (mapErr) {
      setMessage({ type: 'error', text: mapErr });
      return;
    }

    if (!isSupabaseConfigured) {
      setMessage({ type: 'error', text: 'Cannot save — Supabase is not configured.' });
      return;
    }

    try {
      setSaving(true);

      const updates = {
        id: session.user.id,
        email: session.user.email || profile.email || '',
      };

      for (const field of PROFILE_UPDATE_FIELDS) {
        if (field === 'phone_number') {
          updates.phone_number = normalizePhone(profile.phone_number);
        } else if (field === 'google_map_link') {
          updates.google_map_link = (profile.google_map_link || '').trim() || null;
        } else {
          updates[field] = (profile[field] || '').trim();
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) setProfile({ ...EMPTY_PROFILE, ...data });
      setMessage({ type: 'success', text: 'Profile and delivery address saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
      setMessage({ type: 'error', text: 'Sign out failed. Please try again.' });
    }
  }

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Please sign in to view and update your account details and address.</p>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading account details...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Account Settings ({(profile.role || 'buyer').toUpperCase()})</h2>
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          style={{
            padding: '10px',
            marginBottom: '16px',
            borderRadius: '6px',
            backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: message.type === 'error' ? '#dc2626' : '#166534',
            fontSize: '14px',
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={updateProfile} noValidate>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email (Read Only)</label>
          <input
            type="text"
            value={profile.email || session.user.email || ''}
            disabled
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Full Name</label>
          <input
            type="text"
            value={profile.full_name || ''}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            required
            disabled={saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Phone Number</label>
          <input
            type="tel"
            value={profile.phone_number || ''}
            onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
            placeholder="+97412345678"
            required
            disabled={saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <h3 style={{ marginTop: '25px', marginBottom: '10px' }}>Delivery Address</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Building No.</label>
            <input
              type="text"
              value={profile.building_number || ''}
              onChange={(e) => setProfile({ ...profile, building_number: e.target.value })}
              required
              disabled={saving}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Street No.</label>
            <input
              type="text"
              value={profile.street_number || ''}
              onChange={(e) => setProfile({ ...profile, street_number: e.target.value })}
              required
              disabled={saving}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Zone No.</label>
            <input
              type="text"
              value={profile.zone_number || ''}
              onChange={(e) => setProfile({ ...profile, zone_number: e.target.value })}
              required
              disabled={saving}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Google Maps Link</label>
          <input
            type="url"
            placeholder="https://maps.google.com/..."
            value={profile.google_map_link || ''}
            onChange={(e) => setProfile({ ...profile, google_map_link: e.target.value })}
            disabled={saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
