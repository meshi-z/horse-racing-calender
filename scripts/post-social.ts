import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import type { Race } from '../src/types/race.js';
import {
  AUDIENCE_CONFIGS,
  DEFAULT_SITE_URL,
  calculateWeightedTweetLength,
  generateTweetText,
  inferSocialMode,
  postTweetWithMedia,
  selectTargetRaces,
  type SocialAudience,
  type SocialMode,
  type XOAuthCredentials,
} from './lib/social-promo.js';

const VALID_AUDIENCES = new Set<SocialAudience>(['ja', 'eu', 'us', 'au', 'hk']);
const VALID_MODES = new Set<SocialMode>([
  'monday-preview',
  'friday-preview',
  'saturday-preview',
  'sunday-results',
]);

function findChromeExecutable(): string | null {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const candidates =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        ]
      : process.platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
          ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function captureScreenshot(targetUrl: string, outputPath: string): boolean {
  const chromePath = findChromeExecutable();
  if (!chromePath) {
    console.warn('[social] Chrome/Edge executable not found; skipping screenshot.');
    return false;
  }

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1280,900',
    '--hide-scrollbars',
    '--virtual-time-budget=6000',
    `--screenshot=${outputPath}`,
    targetUrl,
  ];

  try {
    execFileSync(chromePath, args, { stdio: 'pipe', timeout: 45_000 });
    return fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[social] Screenshot capture failed (${msg}); continuing without image.`);
    return false;
  }
}

function readXCredentials(): XOAuthCredentials | null {
  const apiKey = process.env.X_API_KEY?.trim();
  const apiSecret = process.env.X_API_SECRET?.trim();
  const accessToken = process.env.X_ACCESS_TOKEN?.trim();
  const accessSecret = process.env.X_ACCESS_SECRET?.trim();

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return null;
  }
  return { apiKey, apiSecret, accessToken, accessSecret };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      audience: { type: 'string', default: 'ja' },
      mode: { type: 'string', default: 'auto' },
      date: { type: 'string' },
      url: { type: 'string', default: DEFAULT_SITE_URL },
      'out-dir': { type: 'string', default: 'dist-social' },
      'dry-run': { type: 'boolean', default: false },
      'skip-screenshot': { type: 'boolean', default: false },
    },
  });

  const audience = values.audience as SocialAudience;
  if (!VALID_AUDIENCES.has(audience)) {
    throw new Error(`Invalid --audience: ${values.audience}. Expected one of: ja, eu, us, au, hk`);
  }

  const config = AUDIENCE_CONFIGS[audience];
  const now = new Date();
  const mode: SocialMode =
    values.mode === 'auto'
      ? inferSocialMode(now, config.timeZone)
      : (values.mode as SocialMode);

  if (!VALID_MODES.has(mode)) {
    throw new Error(`Invalid --mode: ${values.mode}`);
  }

  const racesPath = path.resolve(process.cwd(), 'public/data/races.json');
  const races = JSON.parse(fs.readFileSync(racesPath, 'utf-8')) as Race[];
  const targetRaces = selectTargetRaces(races, audience, mode, now, values.date);

  console.log(
    `[social] Audience=${audience} (${config.timeZone}), Mode=${mode}, MatchedRaces=${targetRaces.length}`
  );

  if (targetRaces.length === 0) {
    console.log('[social] No target races found for this window. Skipping post.');
    return;
  }

  const baseUrl = (values.url || DEFAULT_SITE_URL).replace(/\/+$/, '');
  const siteUrl = `${baseUrl}${config.sitePath}`;

  const { text, usedAi } = await generateTweetText(
    targetRaces,
    audience,
    mode,
    siteUrl,
    process.env.GEMINI_API_KEY?.trim()
  );

  const outDir = path.resolve(process.cwd(), values['out-dir']);
  fs.mkdirSync(outDir, { recursive: true });

  const tweetPath = path.join(outDir, 'tweet.txt');
  const screenshotPath = path.join(outDir, 'screenshot.png');
  const metaPath = path.join(outDir, 'meta.json');

  fs.writeFileSync(tweetPath, text, 'utf-8');

  let hasScreenshot = false;
  if (!values['skip-screenshot']) {
    hasScreenshot = captureScreenshot(siteUrl, screenshotPath);
  }

  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        audience,
        mode,
        siteUrl,
        usedAi,
        weightedLength: calculateWeightedTweetLength(text),
        hasScreenshot,
        raceIds: targetRaces.map((r) => r.id),
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log('--- Generated Tweet ---');
  console.log(text);
  console.log('-----------------------');
  console.log(
    `[social] Weighted length: ${calculateWeightedTweetLength(text)}/280, AI=${usedAi}, Screenshot=${hasScreenshot}`
  );

  const creds = readXCredentials();
  if (values['dry-run']) {
    console.log('[social] --dry-run enabled; skipping X post.');
    return;
  }

  if (!creds) {
    console.warn(
      '[social] X API credentials (X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET) are not configured. Skipping post.'
    );
    return;
  }

  const imageBuffer = hasScreenshot ? fs.readFileSync(screenshotPath) : null;
  const { tweetId } = await postTweetWithMedia(text, imageBuffer, creds);
  console.log(`[social] Posted successfully! Tweet ID: ${tweetId}`);
}

main().catch((err) => {
  console.error('[social] Fatal error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
