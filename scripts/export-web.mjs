// Builds the static web preview served under a sub-path.
//   PET_WEB_BASE_PATH=/iSquared/preview/pet-show-and-tell/ npm run export:web
// Output: dist-web/web (static files) and dist-web/manifest.json.
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expoBaseUrlFromEnv } from './lib/base-path.cjs';
import { verifyWebExport } from './lib/verify-web-export.mjs';
import {
  EXPORT_GENERATOR,
  outputFileHashes,
  validateWebOutputLocation,
} from './lib/web-output-safety.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = path.resolve(appRoot, 'dist-web');
const webDir = path.join(outRoot, 'web');
const stagingDir = path.join(outRoot, '.export-staging');

function git(...gitArgs) {
  const result = spawnSync('git', gitArgs, { cwd: appRoot, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
}

function removeStaging() {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}

const basePath = expoBaseUrlFromEnv();
const envBase = basePath || '/';
validateWebOutputLocation(appRoot, outRoot);
fs.mkdirSync(outRoot, { recursive: true });
removeStaging();

console.log(`[export-web] base ${envBase} -> dist-web/web`);
const expoCli = path.join(appRoot, 'node_modules', 'expo', 'bin', 'cli');
const build = spawnSync(
  process.execPath,
  [expoCli, 'export', '--platform', 'web', '--output-dir', stagingDir, '--clear'],
  {
    cwd: appRoot,
    stdio: 'inherit',
    env: { ...process.env, PET_WEB_BASE_PATH: envBase },
  }
);
if (build.status !== 0) {
  removeStaging();
  throw new Error(`expo export failed with exit code ${build.status}`);
}

const { errors, files } = verifyWebExport({ dir: stagingDir, basePath });
if (errors.length > 0) {
  console.error('[export-web] verification failed:');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  removeStaging();
  process.exit(1);
}

fs.rmSync(webDir, { recursive: true, force: true });
fs.renameSync(stagingDir, webDir);

const fileHashes = outputFileHashes(webDir);
const totalBytes = Object.keys(fileHashes).reduce(
  (sum, rel) => sum + fs.statSync(path.join(webDir, rel)).size,
  0
);
if (files.length !== Object.keys(fileHashes).length) {
  throw new Error('Verification file list does not match the manifest inventory.');
}

const manifest = {
  generator: EXPORT_GENERATOR,
  basePath: envBase,
  builtAt: new Date().toISOString(),
  gitCommit: git('rev-parse', 'HEAD') || null,
  gitDirty: git('status', '--porcelain', '--', '.') !== '',
  fileCount: Object.keys(fileHashes).length,
  totalBytes,
  indexHtmlSha256: crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(webDir, 'index.html')))
    .digest('hex'),
  fileHashes,
};
fs.writeFileSync(path.join(outRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `[export-web] OK: ${manifest.fileCount} files, ${(totalBytes / 1048576).toFixed(1)} MiB, verification passed`
);
