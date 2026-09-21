/** Parse Google Maps URLs / free-form coords into { lat, lng, link }. */

const AT_RE = /@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
const Q_RE = /[?&](?:q|query|ll)=(-?\d+\.?\d*)[,\s+]+(-?\d+\.?\d*)/i;
const BANG_RE = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/;
const PAIR_RE = /^\s*(-?\d{1,3}\.?\d*)\s*[, ]\s*(-?\d{1,3}\.?\d*)\s*$/;

export function parseLatLng(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;

  const pair = raw.match(PAIR_RE);
  if (pair) {
    const lat = Number(pair[1]);
    const lng = Number(pair[2]);
    if (validCoords(lat, lng)) return { lat, lng };
  }

  for (const re of [AT_RE, Q_RE, BANG_RE]) {
    const m = raw.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (validCoords(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

export function validCoords(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export function mapsLinkFromCoords(lat, lng) {
  if (!validCoords(lat, lng)) return '';
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function mapsEmbedUrl(lat, lng, zoom = 15) {
  if (!validCoords(lat, lng)) {
    return 'https://maps.google.com/maps?q=Doha&z=11&output=embed';
  }
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

export function formatAddressLine(addr) {
  if (!addr) return '';
  const bits = [
    addr.label,
    addr.building_number && `Bldg ${addr.building_number}`,
    addr.street_number && `St ${addr.street_number}`,
    addr.zone_number && `Zone ${addr.zone_number}`,
  ].filter(Boolean);
  return bits.join(' · ');
}
