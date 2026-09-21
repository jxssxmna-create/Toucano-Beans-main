import { useMemo, useState } from 'react';
import {
  mapsEmbedUrl,
  mapsLinkFromCoords,
  parseLatLng,
  validCoords,
} from '../lib/maps';

export default function LocationPicker({
  lat,
  lng,
  googleMapLink = '',
  onChange,
  lang = 'en',
}) {
  const isAr = lang === 'ar';
  const [linkDraft, setLinkDraft] = useState(googleMapLink || '');
  const [latDraft, setLatDraft] = useState(lat != null ? String(lat) : '');
  const [lngDraft, setLngDraft] = useState(lng != null ? String(lng) : '');
  const [hint, setHint] = useState('');

  const coords = useMemo(() => {
    const la = Number(latDraft);
    const ln = Number(lngDraft);
    return validCoords(la, ln) ? { lat: la, lng: ln } : null;
  }, [latDraft, lngDraft]);

  function emit(nextLat, nextLng, link) {
    onChange?.({
      lat: nextLat,
      lng: nextLng,
      google_map_link: link || mapsLinkFromCoords(nextLat, nextLng),
    });
  }

  function applyCoords() {
    const la = Number(latDraft);
    const ln = Number(lngDraft);
    if (!validCoords(la, ln)) {
      setHint(isAr ? 'إحداثيات غير صالحة' : 'Invalid coordinates');
      return;
    }
    setHint('');
    const link = mapsLinkFromCoords(la, ln);
    setLinkDraft(link);
    emit(la, ln, link);
  }

  function applyLink() {
    const parsed = parseLatLng(linkDraft);
    if (!parsed) {
      setHint(isAr ? 'تعذر قراءة الرابط' : 'Could not parse Maps link');
      return;
    }
    setHint('');
    setLatDraft(String(parsed.lat));
    setLngDraft(String(parsed.lng));
    emit(parsed.lat, parsed.lng, linkDraft.trim());
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setHint(isAr ? 'الموقع غير مدعوم' : 'Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = Number(pos.coords.latitude.toFixed(6));
        const ln = Number(pos.coords.longitude.toFixed(6));
        setLatDraft(String(la));
        setLngDraft(String(ln));
        const link = mapsLinkFromCoords(la, ln);
        setLinkDraft(link);
        setHint('');
        emit(la, ln, link);
      },
      () => setHint(isAr ? 'تعذر الحصول على الموقع' : 'Could not get location')
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-black uppercase text-black/50 mb-1">
          {isAr ? 'رابط خرائط جوجل' : 'Google Maps link'}
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            placeholder="https://maps.google.com/..."
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
          />
          <button
            type="button"
            onClick={applyLink}
            className="px-3 py-2 rounded-lg bg-[#FF5500] text-white text-sm font-black shrink-0"
          >
            {isAr ? 'تطبيق' : 'Apply'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-black uppercase text-black/50 mb-1">Lat</label>
          <input
            value={latDraft}
            onChange={(e) => setLatDraft(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
            inputMode="decimal"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-black/50 mb-1">Lng</label>
          <input
            value={lngDraft}
            onChange={(e) => setLngDraft(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={applyCoords}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-black hover:border-[#FF5500]"
        >
          {isAr ? 'تعيين الإحداثيات' : 'Set coordinates'}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-black hover:border-[#FF5500]"
        >
          {isAr ? 'موقعي الحالي' : 'Use my location'}
        </button>
      </div>

      {hint && <p className="text-xs font-bold text-red-600">{hint}</p>}

      <div className="rounded-xl overflow-hidden border border-slate-300 bg-slate-100 aspect-[16/10]">
        <iframe
          title="Google Maps"
          src={mapsEmbedUrl(coords?.lat, coords?.lng)}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <p className="text-[11px] font-bold text-black/45">
        {isAr
          ? 'الصق رابط خرائط جوجل أو أدخل الإحداثيات؛ الخريطة تتزامن فوراً.'
          : 'Paste a Google Maps link or enter coordinates — the embed stays in sync.'}
      </p>
    </div>
  );
}
