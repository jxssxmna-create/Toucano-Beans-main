import { useEffect } from 'react';

const CONTENT = {
  ordering: {
    en: {
      title: 'Ordering Rules',
      bullets: [
        'Orders can be placed anytime through the Toucano Beans website.',
        'Please confirm your full name, phone number, and exact Doha delivery address before checkout.',
        'Standard delivery within Doha is typically 1–2 business days after order confirmation.',
        'Same-day delivery may be available for selected areas in Doha when ordered before 2:00 PM.',
        'Delivery outside Doha may require additional time and fees — contact us before ordering.',
        'Orders are confirmed once payment (or cash-on-delivery confirmation) is received.',
        'If an item is out of stock, we will contact you to rearrange or refund that item.',
      ],
    },
    ar: {
      title: 'قواعد الطلب',
      bullets: [
        'يمكن تقديم الطلبات في أي وقت عبر موقع توكانو بينز.',
        'يرجى تأكيد الاسم الكامل ورقم الهاتف وعنوان التوصيل داخل الدوحة قبل إتمام الطلب.',
        'التوصيل داخل الدوحة عادة خلال 1–2 يوم عمل بعد تأكيد الطلب.',
        'قد يتوفر التوصيل في نفس اليوم لمناطق محددة في الدوحة للطلبات قبل الساعة 2 ظهراً.',
        'التوصيل خارج الدوحة قد يحتاج وقتاً ورسوماً إضافية — تواصل معنا قبل الطلب.',
        'يتم تأكيد الطلب بعد استلام الدفع أو تأكيد الدفع عند الاستلام.',
        'إذا نفد منتج، سنتواصل معك لإعادة الترتيب أو استرداد قيمة ذلك المنتج.',
      ],
    },
  },
  returns: {
    en: {
      title: 'Return Policy',
      bullets: [
        'Unopened, unused products may be returned within 7 days of delivery in Doha.',
        'Coffee beans and perishable food items are eligible for return only if sealed and unused.',
        'Opened bags, used equipment, or damaged packaging due to customer handling are not eligible.',
        'To start a return, contact toucanobeans@gmail.com or WhatsApp +974 6660 9060 with your order details.',
        'Approved returns are collected in Doha or dropped off as arranged with our team.',
        'Refunds are processed within 5–10 business days after we receive and inspect the return.',
        'Faulty or incorrect items will be replaced or fully refunded at no extra cost.',
      ],
    },
    ar: {
      title: 'سياسة الإرجاع',
      bullets: [
        'يمكن إرجاع المنتجات غير المفتوحة وغير المستخدمة خلال 7 أيام من التسليم داخل الدوحة.',
        'حبوب القهوة والمنتجات الغذائية قابلة للإرجاع فقط إذا كانت مغلقة وغير مستخدمة.',
        'الأكياس المفتوحة أو المعدات المستخدمة أو التغليف التالف بسبب سوء الاستخدام غير قابلة للإرجاع.',
        'لبدء الإرجاع، تواصل عبر toucanobeans@gmail.com أو واتساب +974 6660 9060 مع تفاصيل طلبك.',
        'عمليات الإرجاع المعتمدة تُجمع داخل الدوحة أو تُسلَّم حسب التنسيق مع فريقنا.',
        'يتم استرداد المبلغ خلال 5–10 أيام عمل بعد استلام وفحص المنتج المُرجع.',
        'المنتجات المعيبة أو الخاطئة تُستبدل أو يُسترد ثمنها بالكامل دون تكلفة إضافية.',
      ],
    },
  },
};

export default function PolicyModal({ type, lang = 'en', onClose }) {
  const isAr = lang === 'ar';
  const copy = CONTENT[type]?.[isAr ? 'ar' : 'en'];

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!copy) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-modal-title"
        className="bg-[#fdf0de] text-black w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="sticky top-0 bg-[#fdf0de] border-b border-slate-200 px-5 py-4 flex items-center justify-between gap-3">
          <h2 id="policy-modal-title" className="text-xl font-black">
            {copy.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-black hover:text-[#FF5500] font-black text-lg px-2"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <ul className="px-5 py-5 space-y-3 list-disc list-outside ms-5">
          {copy.bullets.map((item) => (
            <li key={item} className="font-bold text-black/90 leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
