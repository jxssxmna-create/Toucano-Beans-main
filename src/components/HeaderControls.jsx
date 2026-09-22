/**
 * Top-right controls: Home · EN|AR · optional Menu (hamburger).
 * Home routes to `/` and/or calls onHome for in-app storefront pages.
 */
export default function HeaderControls({
  lang = 'en',
  setLang,
  onHome,
  onMenuToggle,
  showMenu = true,
  className = '',
}) {
  return (
    <div className={`pointer-events-auto flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (onHome) onHome();
          else window.location.assign('/');
        }}
        className="p-2.5 text-black hover:text-[#FF5F1F] transition focus:outline-none rounded-lg"
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
        className="flex items-center rounded-lg border border-slate-300/80 bg-white/70 backdrop-blur-sm overflow-hidden text-xs font-semibold"
        role="group"
        aria-label="Language"
      >
        <button
          type="button"
          onClick={() => setLang?.('en')}
          className={`px-2.5 py-2 transition ${
            lang === 'en' ? 'bg-[#FF5F1F] text-white' : 'text-black hover:text-[#FF5F1F]'
          }`}
        >
          EN
        </button>
        <span className="text-slate-300 select-none" aria-hidden="true">
          |
        </span>
        <button
          type="button"
          onClick={() => setLang?.('ar')}
          className={`px-2.5 py-2 transition ${
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
          className="p-3 text-black hover:text-[#FF5F1F] transition focus:outline-none"
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
