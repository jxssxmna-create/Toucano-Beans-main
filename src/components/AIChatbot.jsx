import { useEffect, useRef, useState } from 'react';
import { streamBaristaReply } from '../lib/aiBaristaApi';

const COPY = {
  en: {
    title: 'Toucano AI Barista',
    subtitle: 'Beans · Brewing · Gear',
    greeting:
      "Hello! I'm your Toucano AI Barista 🦜☕ How can I help you pick beans or set up your coffee brew today?",
    suggestions: [
      'What do I need for a V60 setup?',
      'Recommend beans for fruity notes',
      'Recommend beans for chocolatey notes',
    ],
    placeholder: 'Ask about beans or brewing…',
    send: 'Send',
    error: 'Sorry, I could not reach the barista right now. Please try again in a moment.',
    open: 'Open AI Barista chat',
    close: 'Close chat',
  },
  ar: {
    title: 'باريستا توكانو الذكي',
    subtitle: 'حبوب · تحضير · أدوات',
    greeting: 'مرحباً! أنا باريستا توكانو الذكي 🦜☕ كيف أساعدك في اختيار الحبوب أو تجهيز قهوتك اليوم؟',
    suggestions: [
      'ماذا أحتاج لتحضير V60؟',
      'اقترح حبوباً بنكهات فاكهية',
      'اقترح حبوباً بنكهات الشوكولاتة',
    ],
    placeholder: 'اسأل عن الحبوب أو التحضير…',
    send: 'إرسال',
    error: 'عذراً، تعذّر الوصول إلى الباريستا الآن. حاول مرة أخرى بعد قليل.',
    open: 'افتح محادثة الباريستا',
    close: 'إغلاق المحادثة',
  },
};

function ToucanCupIcon({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M17 6c1.5 2-1.5 3 0 5M23 5c1.5 2-1.5 3 0 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 18h26v10a11 11 0 0 1-11 11h-4A11 11 0 0 1 8 28V18z" fill="currentColor" />
      <path d="M34 21h3a5 5 0 0 1 0 10h-3" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="21" cy="26" r="7" fill="#FAF0DF" />
      <path d="M24 23.5c4-2 9-1.5 12 1-3 .5-7 1.8-12 3.2z" fill="#FF5F1F" />
      <circle cx="19.5" cy="25" r="1.6" fill="#111" />
    </svg>
  );
}

function renderRich(text) {
  return text.split('\n').map((line, i) => (
    <p key={i} className={line.trim() ? '' : 'h-2'}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={j}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={j}>{part}</span>
        )
      )}
    </p>
  ));
}

export default function AIChatbot({ lang = 'en' }) {
  const t = COPY[lang] || COPY.en;
  const isAr = lang === 'ar';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text) {
    const content = text.trim();
    if (!content || thinking || streaming) return;

    const history = [...messages, { role: 'user', content }];
    setMessages(history);
    setInput('');
    setThinking(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let started = false;

    try {
      await streamBaristaReply({
        messages: history,
        lang,
        signal: controller.signal,
        onChunk: (chunk) => {
          if (!started) {
            started = true;
            setThinking(false);
            setStreaming(true);
            setMessages((prev) => [...prev, { role: 'assistant', content: chunk }]);
            return;
          }
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content: last.content + chunk };
            return next;
          });
        },
      });
      if (!started) setMessages((prev) => [...prev, { role: 'assistant', content: t.error }]);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => [...prev, { role: 'assistant', content: t.error, error: true }]);
      }
    } finally {
      setThinking(false);
      setStreaming(false);
      abortRef.current = null;
    }
  }

  const busy = thinking || streaming;

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="tb-chat">
      <div
        className={`fixed bottom-24 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[380px] h-[min(560px,calc(100vh-8rem))] flex flex-col rounded-2xl overflow-hidden border border-black/10 bg-[#FAF0DF] shadow-2xl origin-bottom-right transition-all duration-300 ${
          open ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
        }`}
        role="dialog"
        aria-label={t.title}
        aria-hidden={!open}
        inert={open ? undefined : ''}
      >
        <header className="flex items-center gap-3 px-4 py-3 bg-black text-[#FAF0DF]">
          <span className="w-10 h-10 rounded-full bg-[#FF5F1F] text-black flex items-center justify-center shrink-0">
            <ToucanCupIcon className="w-7 h-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight truncate">{t.title}</p>
            <p className="text-xs text-[#FAF0DF]/70 truncate">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition"
            aria-label={t.close}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-[15px] leading-relaxed">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white border border-black/5 px-3.5 py-2.5 text-black shadow-sm">
            {t.greeting}
          </div>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {t.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="text-sm px-3 py-1.5 rounded-full border border-[#FF5F1F] text-[#FF5F1F] bg-white hover:bg-[#FF5F1F] hover:text-white transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#FF5F1F] text-white px-3.5 py-2.5 whitespace-pre-wrap break-words">
                  {m.content}
                </div>
              </div>
            ) : (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm break-words ${
                  m.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-white text-black border border-black/5'
                }`}
              >
                {renderRich(m.content)}
              </div>
            )
          )}

          {thinking && (
            <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white border border-black/5 px-4 py-3 shadow-sm" aria-label="Typing">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="w-2 h-2 rounded-full bg-[#FF5F1F] animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-black/10 bg-white/70 px-3 py-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            maxLength={1000}
            className="flex-1 min-w-0 rounded-full border border-black/15 bg-white px-4 py-2.5 text-[15px] text-black outline-none focus:border-[#FF5F1F]"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="shrink-0 rounded-full bg-[#FF5F1F] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#e8521a] disabled:opacity-50 transition"
          >
            {t.send}
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-4 sm:right-6 z-40 w-16 h-16 rounded-full bg-[#FF5F1F] text-black shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition"
        aria-label={open ? t.close : t.open}
        aria-expanded={open}
      >
        {open ? (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <ToucanCupIcon className="w-10 h-10" />
        )}
      </button>
    </div>
  );
}
