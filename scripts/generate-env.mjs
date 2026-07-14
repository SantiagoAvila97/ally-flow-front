/**
 * Genera environment.runtime.ts desde vars de Vercel / CI.
 *
 *   Preview Vercel → Railway QA
 *   Production    → Railway PROD
 *   ng serve      → environment.ts (API Railway QA) — no usa este script
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '../src/environments/environment.runtime.ts');

const QA_API = 'https://ally-flow-back-qa.up.railway.app/api';
const PROD_API = 'https://ally-flow-back-production.up.railway.app/api';

const onVercel = Boolean(process.env.VERCEL);
const rawApi = process.env.ALLY_API_URL?.trim();

if (onVercel && !rawApi) {
  console.error(`
[generate-env] Falta ALLY_API_URL en este entorno de Vercel.
  - Preview:    ALLY_API_URL = ${QA_API}
  - Production: ALLY_API_URL = ${PROD_API}
`);
  process.exit(1);
}

function resolveAppEnv() {
  const forced = (process.env.ALLY_APP_ENV || '').toLowerCase();
  if (forced === 'prod' || forced === 'qa') return forced;
  const vercel = (process.env.VERCEL_ENV || '').toLowerCase();
  if (vercel === 'production') return 'prod';
  // preview + local generate → qa
  return 'qa';
}

const appEnv = resolveAppEnv();
const fallback = appEnv === 'prod' ? PROD_API : QA_API;
const apiUrl = (rawApi || fallback).replace(/\/$/, '');

if (onVercel && /localhost|127\.0\.0\.1/i.test(apiUrl)) {
  console.error(`[generate-env] ALLY_API_URL no puede ser localhost en Vercel: ${apiUrl}`);
  process.exit(1);
}

if (!onVercel && /localhost|127\.0\.0\.1/i.test(apiUrl) && appEnv !== 'local') {
  console.warn(
    `[generate-env] apiUrl es localhost con appEnv=${appEnv}. En Vercel Preview define ALLY_API_URL=${QA_API}`,
  );
}

// Demos en QA/Preview; nunca en Production.
const showDemos = appEnv !== 'prod';

const content = `/** Auto-generado por scripts/generate-env.mjs — no editar a mano en CI. */
export type AppDeployEnv = 'local' | 'qa' | 'prod';

export const runtimeApiUrl = ${JSON.stringify(apiUrl)};
export const runtimeShowDemos = ${showDemos};
export const runtimeAppEnv: AppDeployEnv = ${JSON.stringify(appEnv)};
`;

writeFileSync(out, content, 'utf8');
console.log(`[generate-env] apiUrl=${apiUrl} showDemos=${showDemos} appEnv=${appEnv}`);
