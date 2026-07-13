/**
 * Genera environment.runtime.ts desde vars de Vercel / CI.
 *
 * Vercel (automático):
 *   VERCEL_ENV=production → PROD badge
 *   VERCEL_ENV=preview    → QA badge
 *
 * Override opcional: ALLY_APP_ENV=prod|qa|local
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '../src/environments/environment.runtime.ts');

const apiUrl = (process.env.ALLY_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
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
