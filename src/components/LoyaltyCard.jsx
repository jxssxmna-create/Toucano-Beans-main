const STAMPS = 6;

export default function LoyaltyCard({ stamps = 0, vouchers = 0, lang = 'en' }) {
  const isAr = lang === 'ar';
  const filled = Math.min(STAMPS, Math.max(0, Number(stamps) || 0));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#FF5500]">
            {isAr ? 'بطاقة الولاء' : 'Loyalty Card'}
          </p>
          <h3 className="text-lg font-black text-black">
            {isAr ? '٦ مشتريات = كيس مجاني' : '6 Purchases = 1 Free Bag'}
          </h3>
        </div>
        {vouchers > 0 && (
          <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg">
            {isAr ? `${vouchers} قسيمة` : `${vouchers} voucher${vouchers > 1 ? 's' : ''}`}
          </span>
        )}
      </div>

      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: STAMPS }, (_, i) => {
          const on = i < filled;
          return (
            <div
              key={i}
              className={`aspect-square rounded-full border-2 flex items-center justify-center text-lg font-black transition ${
                on
                  ? 'border-[#FF5500] bg-[#FF5500]/15 text-[#FF5500]'
                  : 'border-slate-300 text-slate-300'
              }`}
              aria-label={on ? `Stamp ${i + 1} filled` : `Stamp ${i + 1} empty`}
            >
              {on ? '●' : '○'}
            </div>
          );
        })}
      </div>

      <p className="text-sm font-bold text-black/60">
        {filled >= STAMPS || vouchers > 0
          ? isAr
            ? '🎉 مكافأة: كيس حبوب قهوة مجاني واحد'
            : '🎉 Reward unlocked: 1 FREE Coffee Beans Bag'
          : isAr
            ? `${filled} / ${STAMPS} أختام`
            : `${filled} / ${STAMPS} stamps`}
      </p>
    </div>
  );
}
