/** Construye deep-links y embed de Google Maps. Prioriza coordenadas si existen. */
export function mapsLinks(
  direccion: string,
  ciudad?: string,
  lat?: number | null,
  lon?: number | null,
): {
  google: string;
  apple: string;
  waze: string;
  geo: string;
  embed: string | null;
} {
  const hasCoords =
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lon);

  if (hasCoords) {
    return {
      google: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
      apple: `https://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(direccion || 'Ubicación')}`,
      waze: `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`,
      geo: `geo:${lat},${lon}?q=${lat},${lon}`,
      embed: `https://www.google.com/maps?q=${lat},${lon}&z=17&hl=es&output=embed`,
    };
  }

  const q = [direccion, ciudad, 'Colombia'].filter(Boolean).join(', ');
  const encoded = encodeURIComponent(q);
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    apple: `https://maps.apple.com/?q=${encoded}`,
    waze: `https://waze.com/ul?q=${encoded}&navigate=yes`,
    geo: `geo:0,0?q=${encoded}`,
    embed: `https://www.google.com/maps?q=${encoded}&z=17&hl=es&output=embed`,
  };
}
