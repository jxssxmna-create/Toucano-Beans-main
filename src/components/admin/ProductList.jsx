import { PRODUCT_CATEGORIES } from '../../lib/productsApi';
import { LOGO_SRC, handleLogoError } from '../../lib/logo';

export default function ProductList({
  products,
  lang = 'en',
  busyId,
  onDelete,
  onMoveUp,
  onMoveDown,
}) {
  const isAr = lang === 'ar';

  return (
    <div className="space-y-8">
      {PRODUCT_CATEGORIES.map((cat) => {
        const items = products.filter((p) => p.category === cat.id);
        return (
          <section key={cat.id}>
            <h3 className="text-xl font-extrabold text-slate-800 mb-4">
              {isAr ? cat.labelAr : cat.labelEn}
              <span className="ms-2 text-sm font-medium text-slate-500">({items.length})</span>
            </h3>

            {items.length === 0 ? (
              <p className="text-sm text-slate-500 bg-white/60 border border-dashed border-slate-300 rounded-xl px-4 py-6 text-center">
                {isAr ? 'لا توجد منتجات في هذه الفئة' : 'No products in this category yet'}
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((product, index) => {
                  const busy = busyId === product.id;
                  return (
                    <li
                      key={product.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center shadow-sm"
                    >
                      <img
                        src={product.image_url || LOGO_SRC}
                        alt={product.name}
                        className="h-20 w-20 rounded-lg object-contain border border-slate-100 shrink-0 bg-orange-50/50 p-1"
                        onError={handleLogoError}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{product.name}</p>
                        <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
                        <p className="text-brandorange font-bold mt-1">
                          {Number(product.price).toFixed(2)} QAR
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {isAr ? 'الترتيب' : 'Order'}: {product.display_order}
                        </p>
                      </div>
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={busy || index === 0}
                          onClick={() => onMoveUp(product, items[index - 1])}
                          className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
                        >
                          {isAr ? '↑ أعلى' : '↑ Up'}
                        </button>
                        <button
                          type="button"
                          disabled={busy || index === items.length - 1}
                          onClick={() => onMoveDown(product, items[index + 1])}
                          className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
                        >
                          {isAr ? '↓ أسفل' : '↓ Down'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onDelete(product)}
                          className="px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white disabled:opacity-40 hover:bg-red-600"
                        >
                          {busy ? '...' : isAr ? 'حذف' : 'Delete'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
