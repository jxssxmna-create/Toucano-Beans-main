import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getAuthErrorMessage } from '../lib/authHelpers';

export default function VerifyModal({ user, onVerified, onClose }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isPhone = !!user?.phone;
  const target = user?.phone || user?.email;

  async function handleVerify(e) {
    e.preventDefault();
    setError('');

    if (!isSupabaseConfigured) {
      setError('Verification unavailable — Supabase is not configured.');
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    if (!target) {
      setError('No email or phone available to verify.');
      return;
    }

    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        [isPhone ? 'phone' : 'email']: target,
        token: otp.trim(),
        type: isPhone ? 'sms' : 'signup',
      });

      if (verifyError) throw verifyError;
      onVerified();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '350px', color: '#000' }}>
        <h3 style={{ marginTop: 0 }}>Account Verification Required</h3>
        <p>
          A 6-digit verification code was sent to <strong>{target || 'your account'}</strong> via{' '}
          {isPhone ? 'WhatsApp' : 'Email'}.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              padding: '8px',
              marginBottom: '10px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '4px',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} noValidate>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength={6}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Confirm Code'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 15px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
