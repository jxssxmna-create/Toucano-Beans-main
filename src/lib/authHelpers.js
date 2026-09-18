/** Shared auth validation + error mapping for Supabase flows. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_RE = /^\+[1-9]\d{7,14}$/;

export function validateFullName(name) {
  const value = (name || '').trim();
  if (value.length < 2) return 'Please enter your full name (at least 2 characters).';
  return null;
}

export function validateEmail(email) {
  const value = (email || '').trim();
  if (!value) return 'Email is required.';
  if (!EMAIL_RE.test(value)) return 'Please enter a valid email address.';
  return null;
}

export function validatePhone(phone) {
  const value = (phone || '').trim().replace(/[\s()-]/g, '');
  if (!value) return 'Phone number is required.';
  if (!E164_RE.test(value)) {
    return 'Use international format with country code (e.g. +97412345678).';
  }
  return null;
}

export function validatePassword(password, { minLength = 6 } = {}) {
  if (!password) return 'Password is required.';
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters.`;
  }
  return null;
}

export function validateMapLink(url) {
  const value = (url || '').trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Map link must start with http:// or https://';
    }
    return null;
  } catch {
    return 'Please enter a valid Google Maps URL.';
  }
}

export function normalizePhone(phone) {
  return (phone || '').trim().replace(/[\s()-]/g, '');
}

/** Map Supabase Auth errors to clearer user-facing copy. */
export function getAuthErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.';
  const msg = (error.message || String(error)).toLowerCase();
  const status = error.status || error.code;

  if (msg.includes('invalid login credentials') || status === 400 && msg.includes('invalid')) {
    return 'Incorrect email or password.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox.';
  }
  if (msg.includes('signup is disabled')) {
    return 'New registrations are temporarily disabled.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return 'Network error. Check your connection and try again.';
  }

  return error.message || 'Authentication failed. Please try again.';
}
