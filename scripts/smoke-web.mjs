// Browser check for the static preview. Run after export:web. Not part of npm test.
// Serves dist-web/web under the manifest base path, with no COOP/COEP headers.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const playwrightCore = path.resolve(
  'F:/SoftwareDev/mrdj-dev-suite-i2Workspace/temp/exact-upstream/node_modules/playwright-core'
);
const { chromium } = require(playwrightCore);

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webDir = path.join(appRoot, 'dist-web', 'web');
const manifestPath = path.join(appRoot, 'dist-web', 'manifest.json');
const shotDir = path.join(appRoot, 'tmp', 'web-smoke');
const uploadPath = path.join(appRoot, 'assets', 'images', 'pets', 'Tippy.jpeg');

const PET_NAMES = ['Nora', 'Mia', 'Mrs Frizzle', 'Nala', "Lil' Mama", 'Louie', 'Tippy'];
const CAPTIONS = [
  'A cozy moment with Nora.',
  'A little moment with Mia.',
  'Meet Mrs Frizzle.',
  'Meet Nala.',
  "A moment with Lil' Mama.",
  'Happy wiggles and sunny smiles.',
  'A moment with Louie.',
  'Another moment with Louie.',
  'A moment with Tippy.',
];
const NEW_PET = 'Smoke Biscuit';
const NEW_CAPTION = 'Smoke biscuit chased a sunbeam.';

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function fail(message) {
  const error = new Error(message);
  error.smoke = true;
  throw error;
}

function startServer(basePath) {
  const base = basePath === '/' ? '' : basePath.replace(/\/+$/, '');
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname);
    const inBase = base ? pathname === base || pathname.startsWith(`${base}/`) : true;
    if (!inBase) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('outside the preview base path');
      return;
    }
    const rel = (base ? pathname.slice(base.length) : pathname) || '/';
    const filePath = path.normalize(path.join(webDir, rel === '/' ? 'index.html' : rel));
    if (filePath !== webDir && !filePath.startsWith(webDir + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': type,
      });
      fs.createReadStream(filePath).pipe(response);
      return;
    }
    if (path.extname(rel)) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(`missing ${rel}`);
      return;
    }
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
    });
    fs.createReadStream(path.join(webDir, 'index.html')).pipe(response);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        origin: `http://127.0.0.1:${address.port}`,
        base,
      });
    });
  });
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(shotDir, name) });
}

async function bodyText(page) {
  return page.locator('body').innerText();
}

async function waitForText(page, text) {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    if ((await bodyText(page)).includes(text)) {
      return;
    }
    await page.waitForTimeout(100);
  }
  fail(`Timed out waiting for "${text}" at ${page.url()}`);
}

async function assertTextGone(page, text) {
  if ((await bodyText(page)).includes(text)) {
    fail(`"${text}" is still on screen at ${page.url()}`);
  }
}

async function scrollFeed(page) {
  const seen = new Set();
  for (let step = 0; step < 30; step += 1) {
    for (const line of (await bodyText(page)).split('\n')) {
      const trimmed = line.trim();
      if (trimmed) {
        seen.add(trimmed);
      }
    }
    const moved = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll('div')].filter(
        (el) => el.scrollHeight > el.clientHeight + 40 && el.clientHeight > 180
      );
      candidates.sort((left, right) => right.clientHeight - left.clientHeight);
      const scroller = candidates[0];
      if (!scroller) {
        return false;
      }
      const before = scroller.scrollTop;
      scroller.scrollTop = before + Math.max(240, Math.floor(scroller.clientHeight * 0.75));
      return scroller.scrollTop !== before;
    });
    if (!moved && step > 2) {
      break;
    }
    await page.waitForTimeout(40);
  }
  return seen;
}

async function assertNoHorizontalOverflow(page, label) {
  const box = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (box.scrollWidth > box.clientWidth + 1) {
    fail(`${label}: horizontal overflow ${box.scrollWidth}px > ${box.clientWidth}px`);
  }
}

async function fillField(page, label, value) {
  const field = page.getByLabel(label);
  await field.click();
  await field.fill(value);
  const current = await field.inputValue();
  if (current !== value) {
    fail(`${label} kept "${current}" instead of "${value}"`);
  }
}

async function chooseUpload(page, buttonName) {
  const chooserPromise = page.waitForEvent('filechooser', { timeout: 8000 });
  await page.getByRole('button', { name: buttonName }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(uploadPath);
}

async function addPetAndPost(page) {
  await waitForText(page, 'Who are we meeting?');
  await shot(page, '390-pet-setup.png');
  await chooseUpload(page, 'Add a profile picture');
  await waitForText(page, 'Choose a different picture');
  await fillField(page, 'Pet name', NEW_PET);
  await fillField(page, 'Pet species', 'Dog');
  await fillField(page, 'Pet personality', 'Chases sunbeams.');
  await page.getByRole('button', { name: 'Save pet profile' }).click();
  await waitForText(page, 'Your photo story starts here');
  await shot(page, '390-new-pet.png');
  await page.getByRole('button', { name: 'Share a photo' }).click();
  await waitForText(page, 'A MOMENT WITH SMOKE BISCUIT');
  await chooseUpload(page, 'Choose a photo');
  await waitForText(page, 'Choose another photo');
  await fillField(page, 'Post caption', NEW_CAPTION);
  await page.getByRole('button', { name: 'Add to the feed' }).click();
  await waitForText(page, NEW_CAPTION);
}

async function restoreFromSettings(page) {
  await page.getByRole('button', { name: 'Settings' }).click();
  await waitForText(page, 'Restore sample pets');
  await shot(page, '390-settings.png');
  await page.getByRole('button', { name: 'Restore sample pets' }).click();
  await waitForText(page, 'Meet the pets');
  await assertTextGone(page, NEW_PET);
  await assertTextGone(page, NEW_CAPTION);
  await waitForText(page, 'Nora');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!fs.existsSync(path.join(webDir, 'index.html'))) {
  fail('dist-web/web/index.html is missing. Run npm run export:web first.');
}
if (!fs.existsSync(CHROME)) {
  fail(`Chrome was not found at ${CHROME}`);
}
if (!fs.existsSync(uploadPath)) {
  fail(`Upload image is missing: ${uploadPath}`);
}

fs.mkdirSync(shotDir, { recursive: true });
const hosted = await startServer(manifest.basePath || '/');
const consoleErrors = [];
const pageErrors = [];
const offOrigin = [];
let browser;

try {
  browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-sync',
      '--no-first-run',
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('localStorage is unavailable', 'SecurityError');
      },
    });
    const originalDispatch = EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent = function dispatchForFileInput(event) {
      if (
        this instanceof HTMLInputElement &&
        this.type === 'file' &&
        event &&
        event.type === 'click' &&
        !this.dataset.pstClicking
      ) {
        this.dataset.pstClicking = '1';
        try {
          HTMLElement.prototype.click.call(this);
        } finally {
          delete this.dataset.pstClicking;
        }
        return true;
      }
      return originalDispatch.call(this, event);
    };
  });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('request', (request) => {
    const url = request.url();
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('about:')) {
      return;
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      offOrigin.push(url);
      return;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return;
    }
    if (parsed.origin !== hosted.origin) {
      offOrigin.push(url);
    }
  });

  const open = (route) =>
    page.goto(`${hosted.origin}${hosted.base}${route}`, { waitUntil: 'load' });

  await open('/');
  await waitForText(page, 'Meet the pets');
  await shot(page, '390-feed.png');
  const seen = await scrollFeed(page);
  for (const name of PET_NAMES) {
    if (!seen.has(name)) {
      fail(`Seeded pet "${name}" was not visible`);
    }
  }
  for (const caption of CAPTIONS) {
    if (!seen.has(caption)) {
      fail(`Seeded caption "${caption}" was not visible`);
    }
  }
  await assertNoHorizontalOverflow(page, '390 feed');
  await shot(page, '390-feed-scrolled.png');

  await open('/onboarding');
  await waitForText(page, 'Get started');
  await shot(page, '390-onboarding.png');
  await page.getByText('Get started', { exact: true }).click();
  await waitForText(page, 'Continue');
  await page.getByText('Continue', { exact: true }).click();
  await addPetAndPost(page);
  await assertNoHorizontalOverflow(page, '390 feed after post');
  await shot(page, '390-posted.png');
  await restoreFromSettings(page);
  await shot(page, '390-after-settings-reset.png');

  await open('/pet-setup');
  await addPetAndPost(page);
  await open('/?reset=1');
  await waitForText(page, 'Meet the pets');
  await waitForText(page, 'Nora');
  await assertTextGone(page, NEW_PET);
  await assertTextGone(page, NEW_CAPTION);
  await assertNoHorizontalOverflow(page, '390 feed after url reset');
  await shot(page, '390-after-url-reset.png');

  for (const [width, height] of [
    [360, 800],
    [412, 915],
  ]) {
    await page.setViewportSize({ width, height });
    await open('/');
    await waitForText(page, 'Meet the pets');
    await assertNoHorizontalOverflow(page, `${width} feed`);
    await shot(page, `${width}-feed.png`);
  }

  if (consoleErrors.length > 0) {
    fail(`Console errors:\n${consoleErrors.join('\n')}`);
  }
  if (pageErrors.length > 0) {
    fail(`Page errors:\n${pageErrors.join('\n')}`);
  }
  if (offOrigin.length > 0) {
    fail(`Off-origin requests:\n${[...new Set(offOrigin)].join('\n')}`);
  }
  console.log(`[web-smoke] OK ${hosted.origin}${hosted.base}/ screenshots in tmp/web-smoke`);
} catch (error) {
  if (browser) {
    const pages = browser.contexts().flatMap((context) => context.pages());
    if (pages[0]) {
      await pages[0].screenshot({ path: path.join(shotDir, 'failure.png') }).catch(() => undefined);
    }
  }
  if (consoleErrors.length > 0) {
    console.error('[web-smoke] console errors:');
    for (const line of consoleErrors) {
      console.error(`  ${line}`);
    }
  }
  if (offOrigin.length > 0) {
    console.error('[web-smoke] off-origin requests:');
    for (const line of [...new Set(offOrigin)]) {
      console.error(`  ${line}`);
    }
  }
  throw error;
} finally {
  await browser?.close();
  await new Promise((resolve) => hosted.server.close(resolve));
}
