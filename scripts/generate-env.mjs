/**
 * Genera environment.runtime.ts desde vars de Vercel / CI.
 *
 * Obligatorio en Vercel:
 *   Preview:    ALLY_API_URL = https://TU-API-QA.up.railway.app/api
 *   Production: ALLY_API_URL = https://TU-API-PROD.up.railway.app/api
 *
 * VERCEL_ENV=production → badge PROD
 * VERCEL_ENV=preview    → badge QA
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '../src/environments/environment.runtime.ts');

const onVercel = Boolean(process.env.VERCEL);
const rawApi = process.env.ALLY_API_URL?.trim();

if (onVercel && !rawApi) {
  console.error(`
[generate-env] Falta ALLY_API_URL en este entorno de Vercel.
  Settings → Environment Variables:
  - Preview:    ALLY_API_URL = https://TU-API-QA.up.railway.app/api
  - Production: ALLY_API_URL = https://TU-API-PROD.up.railway.app/api
Sin eso el front intenta localhost y el login falla por CORS.
`);
  process.exit(1);
}

const apiUrl = (rawApi || 'http://localhost:3000/api').replace(/\/$/, '');
if (onVercel && /localhost|127\.0\.0\.1/i.test(apiUrl)) {
  console.error(`[generate-env] ALLY_API_URL no puede ser localhost en Vercel: ${apiUrl}`);
  process.exit(1);
}

const showDemos = process.env.ALLY_SHOW_DEMOS === 'true' || process.env.ALLY_SHOW_DEMOS === '1';

function resolveAppEnv() {
  const forced = (process.env.ALLY_APP_ENV || '').toLowerCase();
  if (forced === 'prod' || forced === 'qa' || forced === 'local') return forced;
  const vercel = (process.env.VERCEL_ENV || '').toLowerCase();
  if (vercel === 'production') return 'prod';
  if (vercel === 'preview') return 'qa';
  return 'local';
}

const appEnv = resolveAppEnv();

const content = `/** Auto-generado por scripts/generate-env.mjs — no editar a mano en CI. */
export type AppDeployEnv = 'local' | 'qa' | 'prod';

export const runtimeApiUrl = ${JSON.stringify(apiUrl)};
export const runtimeShowDemos = ${showDemos};
export const runtimeAppEnv: AppDeployEnv = ${JSON.stringify(appEnv)};
`;

writeFileSync(out, content, 'utf8');
console.log(`[generate-env] apiUrl=${apiUrl} showDemos=${showDemos} appEnv=${appEnv}`);
