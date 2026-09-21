import { useEffect, useState } from 'react';
import { fetchRecipes } from '../lib/commerceApi';
import { LOGO_SRC, handleLogoError } from '../lib/logo';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const FALLBACK = [
  {
    id: 'local-1',
    title: 'Classic Pour-Over',
    body: '**Ratio:** 1:16\n\n1. Rinse filter.\n2. Add 20g grounds.\n3. Bloom 40g / 30s.\n4. Pour to 320g.\n5. Finish ~3:00.',
    image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=900',
  },
];

export default function RecipesPage({ lang = 'en' }) {
  const isAr = lang === 'ar';
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        if (isSupabaseConfigured) {
          const data = await fetchRecipes();
          if (!cancelled) setRecipes(data.length ? data : FALLBACK);
        } else if (!cancelled) {
          setRecipes(FALLBACK);
        }
      } catch {
        if (!cancelled) setRecipes(FALLBACK);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="w-full max-w-4xl">
      <h2 className="text-3xl sm:text-4xl font-black text-black mb-2 text-center">
        {isAr ? 'وصفات القهوة' : 'Coffee Recipes'}
      </h2>
      <p className="text-center text-black/60 font-bold mb-8">
        {isAr ? 'طرق تحضير جريئة من توكانو بينز' : 'Bold brew guides from Toucano Beans'}
      </p>

      {loading ? (
        <p className="text-center font-bold">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      ) : (
        <div className="space-y-8">
          {recipes.map((r) => (
            <article
              key={r.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
            >
              {r.image_url && (
                <img
                  src={r.image_url || LOGO_SRC}
                  alt={r.title}
                  onError={handleLogoError}
                  className="w-full h-48 object-cover bg-orange-50"
                />
              )}
              <div className="p-5 sm:p-6 space-y-3">
                <h3 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                  {r.title}
                </h3>
                <pre className="whitespace-pre-wrap font-[inherit] text-sm sm:text-base font-bold text-black/80 leading-relaxed">
                  {r.body}
                </pre>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
