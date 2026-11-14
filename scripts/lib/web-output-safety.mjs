import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const EXPORT_GENERATOR = 'pet-show-and-tell/export-web';

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function entryExists(file) {
  try {
    fs.lstatSync(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export function outputFileHashes(dir) {
  const files = {};
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Output contains a symlink: ${full}`);
      }
      if (entry.isDirectory()) {
        if (fs.readdirSync(full).length === 0) {
          throw new Error(`Output contains an empty directory: ${full}`);
        }
        visit(full);
        continue;
      }
      if (!entry.isFile()) {
        throw new Error(`Unexpected output entry: ${full}`);
      }
      files[path.relative(dir, full).split(path.sep).join('/')] = sha256(full);
    }
  };
  visit(dir);
  return files;
}

/** Replace only a previous export from this script. Leave every other folder alone. */
export function validateWebOutputLocation(appRoot, outRoot) {
  const relative = path.relative(appRoot, outRoot);
  if (
    !relative ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Output must be a subdirectory of ${appRoot}`);
  }

  let current = appRoot;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    if (entryExists(current) && fs.lstatSync(current).isSymbolicLink()) {
      throw new Error(`Output cannot traverse a symlink: ${current}`);
    }
  }
  if (!entryExists(outRoot)) {
    return null;
  }

  const web = path.join(outRoot, 'web');
  const manifestPath = path.join(outRoot, 'manifest.json');
  for (const file of [web, manifestPath, path.join(outRoot, '.export-staging')]) {
    if (entryExists(file) && fs.lstatSync(file).isSymbolicLink()) {
      throw new Error(`Output cannot be a symlink: ${file}`);
    }
  }

  const unexpected = fs
    .readdirSync(outRoot)
    .filter((name) => name !== 'web' && name !== 'manifest.json' && name !== '.export-staging');
  if (unexpected.length > 0) {
    throw new Error(
      `Refusing to overwrite an output folder this exporter did not create. Unexpected entries: ${unexpected.join(', ')}`
    );
  }

  const webExists = fs.existsSync(web);
  const manifestExists = fs.existsSync(manifestPath);
  if (!webExists && !manifestExists) {
    return null;
  }
  if (!webExists || !manifestExists || !fs.statSync(web).isDirectory()) {
    throw new Error('Refusing to overwrite an output folder this exporter did not create.');
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    throw new Error('Refusing to overwrite an invalid export manifest.');
  }
  if (manifest.generator !== EXPORT_GENERATOR) {
    throw new Error('Refusing to overwrite an output folder this exporter did not create.');
  }

  const hashes = outputFileHashes(web);
  if (
    !hashes['index.html'] ||
    hashes['index.html'] !== manifest.indexHtmlSha256 ||
    Object.keys(hashes).length !== manifest.fileCount
  ) {
    throw new Error('Refusing to replace output changed since the previous web export.');
  }
  if (
    !manifest.fileHashes ||
    typeof manifest.fileHashes !== 'object' ||
    Array.isArray(manifest.fileHashes)
  ) {
    throw new Error('The previous web export has no file inventory.');
  }
  const changed = Object.entries(hashes).some(([name, hash]) => manifest.fileHashes[name] !== hash);
  if (Object.keys(manifest.fileHashes).length !== Object.keys(hashes).length || changed) {
    throw new Error('Refusing to replace output changed since the previous web export.');
  }
  return manifest;
}
