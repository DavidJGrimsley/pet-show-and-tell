import fs from 'node:fs';
import path from 'node:path';

const TEXT_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.json',
  '.svg',
  '.txt',
  '.webmanifest',
]);
const SOURCE_MAP = /\/\/[#@]\s*sourceMappingURL=/;
const LOCAL_HOST = /(?:https?|wss?):\/\/(?:localhost|127\.0\.0\.1|\[::1\])/i;
const NET_URL = /(?:https?|wss?):\/\/[^\s"'`<>)\\]+/gi;
const ESCAPED_NET_URL = /(?:https?|wss?):\\\/\\\/[^\s"'`)\\]+/gi;
const BUNDLE_MARKERS = ['wa-sqlite', 'ExpoSQLite', 'ExponentFileSystem'];

// Hosts that production dependencies leave in warning text, XML namespace
// identifiers, or unused fallbacks. A URL on one of these hosts is still a
// failure when it sits in a request position. The browser smoke test has to
// show that none of them are requested. Do not add an app-owned host.
export const INERT_HOSTS = [
  'www.w3.org', // SVG and MathML XML namespace identifiers
  'react.dev', // React minified error-decoder text
  'necolas.github.io', // HTML comment from Expo's static renderer
  'docs.expo.dev', // expo-router warning text
  'docs.swmansion.com', // reanimated and worklets warning text
  'github.com', // dependency warning and issue links
  'dev.to', // iOS motion-permission note inside a dependency
  'expo.dev', // expo-asset default server when a local URI is missing
  'classic-assets.eascdn.net', // expo-asset URL used only inside Expo Go
  'hostname', // template base in a URL helper, not a network host
  'e', // dummy base passed to new URL(value, "https://e")
];

const INERT_HOST_SET = new Set(INERT_HOSTS);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Output contains a symlink: ${full}`);
    }
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    } else {
      throw new Error(`Unexpected output entry: ${full}`);
    }
  }
}

function unescapeUrl(value) {
  return value.replace(/\\\//g, '/').replace(/[),.;]+$/g, '');
}

function hostOf(raw) {
  const match = /^(?:https?|wss?):\/\/([^/?#\s:]+)/i.exec(unescapeUrl(raw));
  return match ? match[1].toLowerCase().replace(/\.$/, '') : null;
}

function isRequestPosition(text, index) {
  const before = text.slice(Math.max(0, index - 180), index);
  return /(?:\bfetch|\bimport|new\s+WebSocket|new\s+Worker|new\s+SharedWorker|new\s+EventSource|\bsendBeacon|\.open)\s*\(\s*(?:['"][A-Za-z*]+['"]\s*,\s*)?['"`]?\s*$/i.test(
    before
  );
}

function checkNetworkUrl(rel, text, raw, index, errors) {
  const url = unescapeUrl(raw);
  const host = hostOf(raw);
  if (isRequestPosition(text, index)) {
    errors.push(`${rel}: request to ${url}`);
    return;
  }
  if (!host || !INERT_HOST_SET.has(host)) {
    errors.push(`${rel}: off-origin URL ${url}`);
  }
}

function checkAsset(url, where, base, errors) {
  if (
    !url ||
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('#') ||
    url.startsWith('mailto:') ||
    url.startsWith('javascript:')
  ) {
    return;
  }
  if (url.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(url)) {
    errors.push(`${where}: "${url}" is not a same-origin asset path`);
    return;
  }
  if (!url.startsWith('/')) {
    errors.push(`${where}: "${url}" is relative; expected an absolute path under the base`);
    return;
  }
  if (base && url !== base && !url.startsWith(`${base}/`)) {
    errors.push(`${where}: "${url}" is outside base ${base}/`);
  }
}

function looksLikeAssetPath(url) {
  return (
    url.includes('/_expo/') ||
    url.includes('/assets/') ||
    /\.(?:png|jpe?g|gif|webp|svg|ico|ttf|otf|woff2?|css|js|json)(?:$|\?)/i.test(url)
  );
}

export function verifyWebExport({ dir, basePath }) {
  const errors = [];
  const files = [];
  const indexPath = path.join(dir, 'index.html');
  const base = basePath && basePath !== '/' ? String(basePath).replace(/\/+$/, '') : '';

  if (!fs.existsSync(indexPath)) {
    return { errors: [`index.html not found in ${dir}`], files };
  }

  for (const file of walk(dir)) {
    const rel = path.relative(dir, file).split(path.sep).join('/');
    files.push(rel);
    if (path.basename(file).endsWith('.map')) {
      errors.push(`${rel}: sourcemap must not be shipped`);
    }
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) {
      continue;
    }

    const text = fs.readFileSync(file, 'utf8');
    if (SOURCE_MAP.test(text)) {
      errors.push(`${rel}: contains a sourceMappingURL`);
    }
    if (LOCAL_HOST.test(text)) {
      errors.push(`${rel}: references a localhost URL`);
    }
    for (const marker of BUNDLE_MARKERS) {
      if (text.includes(marker)) {
        errors.push(`${rel}: bundles ${marker}`);
      }
    }

    for (const match of text.matchAll(NET_URL)) {
      checkNetworkUrl(rel, text, match[0], match.index ?? 0, errors);
    }
    for (const match of text.matchAll(ESCAPED_NET_URL)) {
      checkNetworkUrl(rel, text, match[0], match.index ?? 0, errors);
    }
    for (const match of text.matchAll(/(?:^|["'(=\s])(\/\/[a-z0-9.-]+\.[a-z]{2,}[^"'`\s<)]*)/gi)) {
      errors.push(`${rel}: protocol-relative URL ${match[1]}`);
    }

    if (rel.endsWith('.css') || rel.endsWith('.html')) {
      for (const match of text.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
        checkAsset(match[2], rel, base, errors);
      }
    }
    if (rel.endsWith('.html')) {
      for (const match of text.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) {
        checkAsset(match[1], rel, base, errors);
      }
    }
    if (rel.endsWith('.js')) {
      for (const match of text.matchAll(/["'](\/[^"']+)["']/g)) {
        if (looksLikeAssetPath(match[1])) {
          checkAsset(match[1], rel, base, errors);
        }
      }
    }
  }

  return { errors, files };
}
