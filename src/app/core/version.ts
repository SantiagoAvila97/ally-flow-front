/**
 * Versión de producto Ally Flow (aparece en login y shell).
 * El patch sube solo en cada commit vía pre-commit (scripts/bump-version.mjs).
 * Major/minor: edita a mano, o SKIP_VERSION_BUMP=1 si no quieres bump.
 */
export const APP_VERSION = '1.0.1';

export function formatAppVersion(version = APP_VERSION): string {
  return `v${version}`;
}
