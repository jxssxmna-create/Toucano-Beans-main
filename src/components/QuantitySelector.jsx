export default function QuantitySelector({
  value = 0,
  onChange,
  size = 'md',
  className = '',
  stopPropagation = true,
}) {
  const qty = Math.max(0, Number(value) || 0);
  const pad = size === 'lg' ? 'w-11 h-11 text-xl' : 'w-9 h-9 text-base';
  const mid = size === 'lg' ? 'min-w-[2.5rem] text-lg' : 'min-w-[1.75rem] text-sm';

  function bump(delta, e) {
    if (stopPropagation) {
      e?.stopPropagation?.();
      e?.preventDefault?.();
    }
    onChange?.(Math.max(0, qty + delta));
  }

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      onClick={(e) => stopPropagation && e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={(e) => bump(-1, e)}
        disabled={qty <= 0}
        className={`${pad} rounded-lg border border-slate-300 bg-white font-semibold text-black hover:border-[#FF5F1F] hover:text-[#FF5F1F] disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:text-black transition`}
      >
        −
      </button>
      <span className={`${mid} text-center font-semibold tabular-nums`}>{qty}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={(e) => bump(1, e)}
        className={`${pad} rounded-lg border border-slate-300 bg-white font-semibold text-black hover:border-[#FF5F1F] hover:text-[#FF5F1F] transition`}
      >
        +
      </button>
    </div>
  );
}
