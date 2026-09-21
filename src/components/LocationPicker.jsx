import { useEffect, useMemo, useState } from 'react';
import {
  mapsEmbedUrl,
  mapsLinkFromCoords,
  parseLatLng,
  validCoords,
} from '../lib/maps';

/** Lat/lng stay in state only — no Lat/Lng inputs in the UI. */
export default function LocationPicker({
  lat,
  lng,
  googleMapLink = '',
  onChange,
  lang = 'en',
}) {
  const isAr = lang === 'ar';
  const [linkDraft, setLinkDraft] = useState(googleMapLink || '');
  const [coords, setCoords] = useState(() =>
    validCoords(Number(lat), Number(lng)) ? { lat: Number(lat), lng: Number(lng) } : null
  );
  const [hint, setHint] = useState('');

  useEffect(() => {
    setLinkDraft(googleMapLink || '');
    if (validCoords(Number(lat), Number(lng))) {
      setCoords({ lat: Number(lat), lng: Number(lng) });
    }
  }, [googleMapLink, lat, lng]);

  const embedSrc = useMemo(
    () => mapsEmbedUrl(coords?.lat, coords?.lng),
    [coords]
  );

  function emit(nextLat, nextLng, link) {
    setCoords({ lat: nextLat, lng: nextLng });
    onChange?.({
      lat: nextLat,
      lng: nextLng,
      google_map_link: link || mapsLinkFromCoords(nextLat, nextLng),
    });
  }

  function applyLink() {
    const parsed = parseLatLng(linkDraft);
    if (!parsed) {
      setHint(isAr ? 'تعذر قراءة الرابط' : 'Could not parse Maps link');
      return;
    }
    setHint('');
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
        const link = mapsLinkFromCoords(la, ln);
        setLinkDraft(link);
        setHint('');
        emit(la, ln, link);
      },
      () => setHint(isAr ? 'تعذر الحصول على الموقع' : 'Could not get location')
    );
  }

  return (
    <div className="space-y-3 font-sans">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-black/50 mb-1">
          {isAr ? 'رابط خرائط جوجل' : 'Google Maps link'}
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            placeholder="https://maps.google.com/..."
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
          />
          <button
            type="button"
            onClick={applyLink}
            className="px-3 py-2 rounded-lg bg-[#FF5F1F] text-white text-sm font-semibold shrink-0"
          >
            {isAr ? 'تطبيق' : 'Apply'}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:border-[#FF5F1F]"
      >
        {isAr ? 'موقعي الحالي' : 'Use my location'}
      </button>

      {hint && <p className="text-xs font-medium text-red-600">{hint}</p>}

      <div className="rounded-xl overflow-hidden border border-slate-300 bg-slate-100 aspect-[16/10]">
        <iframe
          title="Google Maps"
          src={embedSrc}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <p className="text-[11px] font-medium text-black/45">
        {isAr
          ? 'الصق رابط خرائط جوجل أو استخدم موقعك؛ الخريطة تتزامن تلقائياً.'
          : 'Paste a Google Maps link or use your location — the map stays in sync.'}
      </p>
    </div>
  );
}
