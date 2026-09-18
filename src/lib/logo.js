/** Canonical logo paths — always lowercase, root-absolute for Windows/Vite. */
export const LOGO_SRC = '/assets/logo.png';
export const LOGO_FALLBACK_SRC = '/logo.png';
export const LOGO_ALT = 'Toucano Beans Logo';

export function handleLogoError(event) {
  const img = event?.currentTarget || event?.target;
  if (!img) return;
  // Prevent infinite loop if both assets fail
  if (img.dataset.logoFallback === '1') {
    img.onerror = null;
    return;
  }
  img.dataset.logoFallback = '1';
  img.src = LOGO_FALLBACK_SRC;
}
