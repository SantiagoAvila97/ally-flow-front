/**
 * Vercel: Preview → build:qa (demos ON, aligned with local).
 *         Production → build:prod (demos OFF).
 * prebuild (generate-env) runs via npm lifecycle on build:qa/prod.
 */
import { spawnSync } from 'node:child_process';

const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase();
const forced = (process.env.ALLY_APP_ENV || '').toLowerCase();
const isProd = forced === 'prod' || vercelEnv === 'production';
const script = isProd ? 'build:prod' : 'build:qa';

console.log(`[vercel-build] VERCEL_ENV=${vercelEnv || 'n/a'} → npm run ${script}`);

const result = spawnSync('npm', ['run', script], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
