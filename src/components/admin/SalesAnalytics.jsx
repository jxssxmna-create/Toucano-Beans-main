import { useMemo } from 'react';
import { buildSalesChartData, flattenSalesRecords } from '../../lib/commerceApi';

function formatMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en', { month: 'short' });
}

export default function SalesAnalytics({ orders = [], lang = 'en' }) {
  const isAr = lang === 'ar';
  const { months, series } = useMemo(() => buildSalesChartData(orders, 6), [orders]);
  const records = useMemo(() => flattenSalesRecords(orders).slice(0, 80), [orders]);

  const maxY = Math.max(1, ...series.flatMap((s) => s.values));
  const W = 640;
  const H = 260;
  const pad = { t: 20, r: 16, b: 36, l: 48 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  function xAt(i) {
    return pad.l + (months.length <= 1 ? innerW / 2 : (i / (months.length - 1)) * innerW);
  }
  function yAt(v) {
    return pad.t + innerH - (v / maxY) * innerH;
  }

  const totalRevenue = records.reduce((s, r) => s + r.revenue, 0);

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#FF5500]">
            {isAr ? 'المبيعات' : 'Sales'}
          </p>
          <h2 className="text-2xl font-black text-slate-900">
            {isAr ? 'تحليلات المبيعات' : 'Sales Analytics'}
          </h2>
        </div>
        <p className="text-sm font-black text-slate-600">
          {isAr ? 'الإيرادات (المعروضة)' : 'Shown revenue'}:{' '}
          <span className="text-[#FF5500]">{totalRevenue.toFixed(2)} QAR</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px] h-auto" role="img" aria-label="Sales chart">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = yAt(maxY * t);
            return (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                <text x={pad.l - 8} y={y + 4} textAnchor="end" className="fill-slate-400" fontSize="10">
                  {Math.round(maxY * t)}
                </text>
              </g>
            );
          })}

          {months.map((m, i) => (
            <text key={m} x={xAt(i)} y={H - 10} textAnchor="middle" className="fill-slate-500" fontSize="11" fontWeight="700">
              {formatMonth(m)}
            </text>
          ))}

          {series.map((s) => {
            const d = s.values
              .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(v)}`)
              .join(' ');
            return (
              <g key={s.productId}>
                <path d={d} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />
                {s.values.map((v, i) => (
                  <circle key={i} cx={xAt(i)} cy={yAt(v)} r="3.5" fill={s.color} />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-3">
        {series.map((s) => (
          <div key={s.productId} className="flex items-center gap-2 text-xs font-black text-slate-700">
            <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
            {s.name}
          </div>
        ))}
        {series.length === 0 && (
          <p className="text-sm font-bold text-slate-500">
            {isAr ? 'لا توجد بيانات مبيعات بعد' : 'No sales data yet'}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-black mb-2">
          {isAr ? 'سجل المبيعات' : 'Sales Records'}
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-start px-3 py-2 font-black">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="text-start px-3 py-2 font-black">{isAr ? 'العميل' : 'Customer'}</th>
                <th className="text-start px-3 py-2 font-black">{isAr ? 'المنتج' : 'Product'}</th>
                <th className="text-end px-3 py-2 font-black">Qty</th>
                <th className="text-end px-3 py-2 font-black">{isAr ? 'الإيراد' : 'Revenue'}</th>
                <th className="text-start px-3 py-2 font-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-bold whitespace-nowrap">
                    {new Date(r.date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 font-bold">{r.customer}</td>
                  <td className="px-3 py-2 font-bold">{r.product}</td>
                  <td className="px-3 py-2 font-bold text-end">{r.qty}</td>
                  <td className="px-3 py-2 font-black text-end text-[#FF5500]">
                    {r.revenue.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 font-bold capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
