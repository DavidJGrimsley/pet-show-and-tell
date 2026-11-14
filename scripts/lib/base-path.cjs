// Normalizes PET_WEB_BASE_PATH for Expo's experiments.baseUrl.
// Empty string means the site root. A sub-path is "/like/this" with no trailing slash.

function normalizeBasePath(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '/') {
    return '';
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) {
    throw new Error(`Base path must be a path, not a URL: ${raw}`);
  }
  if (/[?#\s\\]/.test(raw)) {
    throw new Error(`Base path must not contain whitespace, backslashes, "?" or "#": ${raw}`);
  }
  const segments = raw.split('/').filter(Boolean);
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error(`Base path must not contain "." or ".." segments: ${raw}`);
  }
  if (segments.length === 0) {
    return '';
  }
  return `/${segments.join('/')}`;
}

function expoBaseUrlFromEnv(env = process.env) {
  return normalizeBasePath(env.PET_WEB_BASE_PATH);
}

module.exports = { expoBaseUrlFromEnv, normalizeBasePath };
