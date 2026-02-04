export function haversineKm(a: { lon: number; lat: number }, b: { lon: number; lat: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(s));
}

export function obfuscatePoint(point: { lon: number; lat: number }, radiusKm: number) {
  const r = radiusKm * 1000;
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * r;

  const dLat = (dist * Math.cos(angle)) / 111_320;
  const dLon = (dist * Math.sin(angle)) / (111_320 * Math.cos((point.lat * Math.PI) / 180));

  return { lon: point.lon + dLon, lat: point.lat + dLat };
}

// Géolocalisation approximative (~20km de rayon)
export function obfuscateApproximate(point: { lon: number; lat: number }) {
  return obfuscatePoint(point, 20);
}

// Géolocalisation précise (légère obfuscation ~2km pour la sécurité)
export function obfuscatePrecise(point: { lon: number; lat: number }) {
  return obfuscatePoint(point, 2);
}
