/**
 * Top-right controls: Home · EN|AR · optional Menu (hamburger).
 * `stackOnMobile` stacks Menu → Home → Language vertically below `sm`.
 */
export default function HeaderControls({
  lang = 'en',
  setLang,
  onHome,
  onMenuToggle,
  showMenu = true,
  stackOnMobile = false,
  className = '',
}) {
  const layout = stackOnMobile
    ? 'flex flex-col items-end gap-1 sm:flex-row sm:items-center'
    : 'flex items-center gap-1';

  return (
    <div className={`pointer-events-auto ${layout} ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (onHome) onHome();
          else window.location.assign('/');
        }}
        className={`p-2.5 text-black hover:text-[#FF5F1F] transition focus:outline-none rounded-lg ${
          stackOnMobile ? 'order-2 sm:order-1' : ''
        }`}
        aria-label={lang === 'ar' ? 'الرئيسية' : 'Home'}
        title={lang === 'ar' ? 'الرئيسية' : 'Home'}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10.5 12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H15v-6h-6v6H4.5A1.5 1.5 0 0 1 3 20v-9.5z"
          />
        </svg>
      </button>

      <div
        className={`flex flex-col items-stretch rounded-lg border border-slate-300/80 bg-white/70 backdrop-blur-sm overflow-hidden text-[11px] font-semibold leading-none divide-y divide-slate-300/80 ${
          stackOnMobile ? 'order-3 sm:order-2' : ''
        }`}
        role="group"
        aria-label="Language"
      >
        <button
          type="button"
          onClick={() => setLang?.('en')}
          aria-pressed={lang === 'en'}
          className={`px-2.5 py-1.5 transition ${
            lang === 'en' ? 'bg-[#FF5F1F] text-white' : 'text-black hover:text-[#FF5F1F]'
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLang?.('ar')}
          aria-pressed={lang === 'ar'}
          className={`px-2.5 py-1.5 transition ${
            lang === 'ar' ? 'bg-[#FF5F1F] text-white' : 'text-black hover:text-[#FF5F1F]'
          }`}
        >
          AR
        </button>
      </div>

      {showMenu && onMenuToggle && (
        <button
          type="button"
          onClick={onMenuToggle}
          className={`p-3 text-black hover:text-[#FF5F1F] transition focus:outline-none ${
            stackOnMobile ? 'order-1 sm:order-3' : ''
          }`}
          aria-label="Menu"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
