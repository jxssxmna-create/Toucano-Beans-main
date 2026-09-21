import { LOGO_SRC, handleLogoError } from '../lib/logo';

const STAMPS = 6;
const BRAT = '#FF5F1F';

function StampCircle({ filled, index }) {
  return (
    <div
      className="relative aspect-square rounded-full flex items-center justify-center overflow-hidden"
      style={{
        border: filled ? `2.5px solid ${BRAT}` : '2px dashed #cbd5e1',
        background: filled ? `${BRAT}14` : '#f8fafc',
        boxShadow: filled ? `inset 0 0 0 1px ${BRAT}55` : 'none',
        transform: filled ? `rotate(${(index % 2 === 0 ? -1 : 1) * (4 + (index % 3))}deg)` : 'none',
      }}
      aria-label={filled ? `Stamp ${index + 1} filled` : `Stamp ${index + 1} empty`}
    >
      <div
        className="flex flex-col items-center justify-center px-0.5 w-full h-full"
        style={{ opacity: filled ? 1 : 0.28, filter: filled ? 'none' : 'grayscale(1)' }}
      >
        <img
          src={LOGO_SRC}
          alt=""
          aria-hidden="true"
          onError={handleLogoError}
          className="w-[42%] h-[42%] object-contain mb-0.5"
          draggable={false}
        />
        <span
          className="leading-none text-center uppercase tracking-tighter font-black"
          style={{
            fontSize: 'clamp(4px, 1.6vw, 7px)',
            color: filled ? BRAT : '#94a3b8',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          TOUCANO
          <br />
          BEANS
        </span>
      </div>
    </div>
  );
}

export default function LoyaltyCard({ stamps = 0, vouchers = 0, lang = 'en' }) {
  const isAr = lang === 'ar';
  const filled = Math.min(STAMPS, Math.max(0, Number(stamps) || 0));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 font-sans">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: BRAT }}
          >
            {isAr ? 'بطاقة الولاء' : 'Loyalty Card'}
          </p>
          <h3 className="text-lg font-serif font-black text-black">
            {isAr ? '٦ مشتريات = كيس مجاني' : '6 Purchases = 1 Free Bag'}
          </h3>
        </div>
        {vouchers > 0 && (
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg">
            {isAr ? `${vouchers} قسيمة` : `${vouchers} voucher${vouchers > 1 ? 's' : ''}`}
          </span>
        )}
      </div>

      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {Array.from({ length: STAMPS }, (_, i) => (
          <StampCircle key={i} filled={i < filled} index={i} />
        ))}
      </div>

      <p className="text-sm font-medium text-black/60">
        {vouchers > 0
          ? isAr
            ? 'مكافأة: كيس حبوب قهوة مجاني واحد'
            : 'Reward unlocked: 1 FREE Coffee Beans Bag'
          : isAr
            ? `${filled} / ${STAMPS} أختام`
            : `${filled} / ${STAMPS} stamps`}
      </p>
    </div>
  );
}
