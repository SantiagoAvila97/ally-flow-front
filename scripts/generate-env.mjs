/**
 * Genera environment.runtime.ts desde vars de Vercel / CI.
 *
 * Vercel → Settings → Environment Variables:
 *   Production: ALLY_API_URL = https://api-prod.up.railway.app/api
 *   Preview:    ALLY_API_URL = https://api-qa.up.railway.app/api
 *               ALLY_SHOW_DEMOS = true
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '../src/environments/environment.runtime.ts');

const apiUrl = (process.env.ALLY_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const showDemos = process.env.ALLY_SHOW_DEMOS === 'true' || process.env.ALLY_SHOW_DEMOS === '1';

const content = `/** Auto-generado por scripts/generate-env.mjs — no editar a mano en CI. */
export const runtimeApiUrl = ${JSON.stringify(apiUrl)};
export const runtimeShowDemos = ${showDemos};
`;

writeFileSync(out, content, 'utf8');
console.log(`[generate-env] apiUrl=${apiUrl} showDemos=${showDemos}`);
