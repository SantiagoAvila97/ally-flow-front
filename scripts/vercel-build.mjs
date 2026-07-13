/**
 * Vercel: Preview → build:qa (demos ON).
 *         Production → build:prod (demos OFF).
 * generate-env corre vía prebuild:qa / prebuild:prod.
 */
import { spawnSync } from 'node:child_process';

const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase();
const forced = (process.env.ALLY_APP_ENV || '').toLowerCase();
const isProd = forced === 'prod' || vercelEnv === 'production';
const script = isProd ? 'build:prod' : 'build:qa';

console.log(`[vercel-build] VERCEL_ENV=${vercelEnv || 'n/a'} → npm run ${script}`);

// Generar runtime antes por si el lifecycle hook no dispara en algún runner.
const gen = spawnSync('node', ['scripts/generate-env.mjs'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
if ((gen.status ?? 1) !== 0) {
  process.exit(gen.status ?? 1);
}

const result = spawnSync('npm', ['run', script], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
