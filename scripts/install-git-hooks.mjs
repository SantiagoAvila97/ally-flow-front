/**
 * Instala pre-commit: bump de versión + stage de archivos.
 * Corre con: npm run prepare  (o al hacer npm install)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const gitDir = path.join(root, '.git');
const hooksDir = path.join(gitDir, 'hooks');

if (!fs.existsSync(gitDir)) {
  console.log('[hooks] no .git — skip');
  process.exit(0);
}

fs.mkdirSync(hooksDir, { recursive: true });

const hook = `#!/bin/sh
# Auto-bump patch version (Ally Flow)
if [ "$SKIP_VERSION_BUMP" = "1" ]; then
  exit 0
fi
node scripts/bump-version.mjs || exit 1
git add src/app/core/version.ts package.json
`;

const hookPath = path.join(hooksDir, 'pre-commit');
fs.writeFileSync(hookPath, hook.replace(/\r\n/g, '\n'));
try {
  fs.chmodSync(hookPath, 0o755);
} catch {
  /* Windows puede ignorar chmod */
}
console.log('[hooks] pre-commit instalado (bump versión front)');
