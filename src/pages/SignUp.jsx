import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  validateEmail,
  validateFullName,
  validatePassword,
  getAuthErrorMessage,
} from '../lib/authHelpers';

export default function SignUp({
  initialMode = 'signup',
  hideModeSwitch = false,
  deliveryContext = false,
}) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function resetFeedback() {
    setErrorMessage('');
    setSuccessMessage('');
  }

  function validateForm() {
    if (isSignUp) {
      const nameErr = validateFullName(fullName);
      if (nameErr) return nameErr;
    }
    const emailErr = validateEmail(email);
    if (emailErr) return emailErr;
    const passwordErr = validatePassword(password);
    if (passwordErr) return passwordErr;
    return null;
  }

  async function handleAuth(e) {
    e.preventDefault();
    resetFeedback();

    if (!isSupabaseConfigured) {
      setErrorMessage('Authentication is unavailable. Supabase is not configured.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setAuthLoading(true);

    try {
      const trimmedEmail = email.trim();

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setSuccessMessage('Account created. Welcome!');
        } else {
          setSuccessMessage(
            'Account created. Check your email to confirm your address before signing in.'
          );
          setPassword('');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) throw error;
        setSuccessMessage(
          deliveryContext
            ? 'Signed in. Open the Delivery tab after your profile loads if you have the delivery role.'
            : 'Signed in successfully.'
        );
      }
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '24px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#000', fontWeight: 900 }}>
        {deliveryContext
          ? 'Delivery Sign In'
          : isSignUp
            ? 'Create New Account'
            : 'Sign In'}
      </h2>

      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: '10px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '6px',
            marginBottom: '15px',
            fontSize: '14px',
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          style={{
            padding: '10px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            borderRadius: '6px',
            marginBottom: '15px',
            fontSize: '14px',
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleAuth} noValidate>
        {isSignUp && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '700' }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
              required={isSignUp}
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '10px',
                boxSizing: 'border-box',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '700' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@domain.com"
            autoComplete="email"
            required
            disabled={authLoading}
            style={{
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '700' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={6}
            required
            disabled={authLoading}
            style={{
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={authLoading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#FF5500',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 900,
            cursor: authLoading ? 'not-allowed' : 'pointer',
            opacity: authLoading ? 0.7 : 1,
          }}
        >
          {authLoading
            ? 'Submitting...'
            : isSignUp
              ? 'Create Account'
              : deliveryContext
                ? 'Sign In to Delivery Portal'
                : 'Sign In'}
        </button>
      </form>

      {!hideModeSwitch && (
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            resetFeedback();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#FF5500',
            marginTop: '16px',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          {isSignUp
            ? 'Already have an account? Sign in here'
            : "Don't have an account? Click here to register"}
        </button>
      )}
    </div>
  );
}
