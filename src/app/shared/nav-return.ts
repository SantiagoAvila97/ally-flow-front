/** Rutas internas permitidas para navegación de retorno. */
const ALLOWED_PREFIXES = ['/home', '/balance', '/costos', '/casos'];

/**
 * Valida un returnTo (path interno, opcionalmente con query).
 * Rechaza URLs externas o esquemas raros.
 */
export function safeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('://')) {
    return null;
  }
  const path = value.split('?')[0] ?? value;
  if (!ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return null;
  }
  return value;
}

export function returnLabel(returnTo: string): string {
  const path = returnTo.split('?')[0] ?? returnTo;
  if (path.startsWith('/balance')) return 'Volver al Balance';
  if (path.startsWith('/costos')) return 'Volver a Costos';
  if (path.startsWith('/home')) return 'Volver a bandeja';
  if (path.startsWith('/casos')) return 'Volver';
  return 'Volver';
}

/** Query params tipados para links que llevan returnTo. */
export function withReturnTo(
  base: Record<string, string | undefined | null>,
  returnTo: string,
): Record<string, string> {
  const out: Record<string, string> = { returnTo };
  for (const [k, v] of Object.entries(base)) {
    if (v != null && v !== '') out[k] = v;
  }
  return out;
}
