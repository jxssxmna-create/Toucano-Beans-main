import { LOGO_ALT, LOGO_SRC, handleLogoError } from '../lib/logo';

/**
 * Shared brand logo — object-contain, transparent-friendly, responsive heights.
 */
export default function Logo({
  size = 'md',
  className = '',
  onClick,
  decorative = false,
}) {
  const sizeClass =
    {
      xs: 'h-8 w-auto',
      sm: 'h-12 w-auto',
      md: 'h-20 w-auto',
      lg: 'h-36 sm:h-44 w-auto',
      xl: 'h-44 sm:h-52 w-auto',
    }[size] || 'h-20 w-auto';

  return (
    <img
      src={LOGO_SRC}
      alt={decorative ? '' : LOGO_ALT}
      aria-hidden={decorative ? 'true' : undefined}
      onError={handleLogoError}
      onClick={onClick}
      draggable={false}
      className={`object-contain object-center select-none bg-transparent max-w-full ${sizeClass} ${className}`.trim()}
    />
  );
}
