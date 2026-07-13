/**
 * Sugiere correcciones de formato típicas en direcciones colombianas
 * (placa con # …) para que Google Maps no “pierda” el pin.
 *
 * Ej.: Trans 124 #130 F46 → Trans 124 #130 F-46
 */
export function suggestDireccionColombia(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed.includes('#')) return null;

  let suggested = trimmed;

  // "#130 F46" | "#130F46" → "#130 F-46"
  suggested = suggested.replace(
    /(#\s*)(\d+)\s*([A-Za-zÁÉÍÓÚÑáéíóúñ]+)\s*(\d+)\b/u,
    (_m, hash: string, n1: string, letter: string, n2: string) =>
      `${hash}${n1} ${letter}-${n2}`,
  );

  // Tras #: letra + dígitos sin guion sueltos, p.ej. "# F46" → "# F-46"
  suggested = suggested.replace(
    /(#\s*)([A-Za-zÁÉÍÓÚÑáéíóúñ]+)(\d+)\b/u,
    (_m, hash: string, letter: string, n2: string) => `${hash}${letter}-${n2}`,
  );

  // "#19 50" → "#19-50"
  suggested = suggested.replace(
    /(#\s*)(\d+)\s+(\d+)\b/,
    (_m, hash: string, a: string, b: string) => `${hash}${a}-${b}`,
  );

  // Normaliza espacios alrededor del guion de placa: "F - 46" → "F-46"
  suggested = suggested.replace(/([A-Za-zÁÉÍÓÚÑáéíóúñ])\s*-\s*(\d+)/gu, '$1-$2');
  suggested = suggested.replace(/(\d+)\s*-\s*(\d+)/g, '$1-$2');

  if (suggested === trimmed) return null;
  return suggested;
}
