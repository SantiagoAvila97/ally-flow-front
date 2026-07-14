/**
 * Versión de producto Ally Flow (aparece en login y shell).
 * Súbela a mano al sacar cambios (ej. 1.0.0 → 1.0.1).
 */
export const APP_VERSION = '1.0.6';

export function formatAppVersion(version = APP_VERSION): string {
  return `v${version}`;
}
