import crypto from 'node:crypto';
import type { CountryCode, Grade, Organization, Race } from '../../src/types/race.js';

export type SocialAudience = 'ja' | 'eu' | 'us' | 'au' | 'hk';
export type SocialMode =
  | 'monday-preview'
  | 'friday-preview'
  | 'saturday-preview'
  | 'sunday-results';

export interface AudienceConfig {
  audience: SocialAudience;
  lang: 'ja' | 'en' | 'zh';
  timeZone: string;
  sitePath: string;
  label: string;
}

export const AUDIENCE_CONFIGS: Record<SocialAudience, AudienceConfig> = {
  ja: {
    audience: 'ja',
    lang: 'ja',
    timeZone: 'Asia/Tokyo',
    sitePath: '/ja/',
    label: 'Japan (JRA G1 / NAR Jpn1 / Overseas G1)',
  },
  eu: {
    audience: 'eu',
    lang: 'en',
    timeZone: 'Europe/London',
    sitePath: '/en/',
    label: 'Europe (UK / Ireland / France G1)',
  },
  us: {
    audience: 'us',
    lang: 'en',
    timeZone: 'America/New_York',
    sitePath: '/en/',
    label: 'United States (Equibase G1)',
  },
  au: {
    audience: 'au',
    lang: 'en',
    timeZone: 'Australia/Sydney',
    sitePath: '/en/',
    label: 'Australia (Racing Australia G1)',
  },
  hk: {
    audience: 'hk',
    lang: 'zh',
    timeZone: 'Asia/Hong_Kong',
    sitePath: '/zh/',
    label: 'Hong Kong (HKJC G1)',
  },
};

export const DEFAULT_SITE_URL = 'https://meshi-z.github.io/horse-racing-calender';

const EU_ORGS: ReadonlySet<Organization> = new Set(['france_galop', 'bha', 'hri']);
const EU_COUNTRIES: ReadonlySet<CountryCode> = new Set(['FR', 'GB', 'IE']);

/**
 * Format a Date into YYYY-MM-DD in the specified IANA timezone.
 */
export function formatDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Get the day of week (0=Sun..6=Sat) for a YYYY-MM-DD calendar date.
 */
export function getDayOfWeek(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Add days to a YYYY-MM-DD string.
 */
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/**
 * Infer SocialMode from the local day of week in the audience's timezone.
 */
export function inferSocialMode(now: Date, timeZone: string): SocialMode {
  const today = formatDateInTimeZone(now, timeZone);
  const dow = getDayOfWeek(today);
  switch (dow) {
    case 1:
      return 'monday-preview';
    case 5:
      return 'friday-preview';
    case 6:
      return 'saturday-preview';
    case 0:
      return 'sunday-results';
    default:
      return 'friday-preview';
  }
}

/**
 * Check whether a race matches the target audience's grade & region criteria.
 */
export function matchesAudience(race: Race, audience: SocialAudience): boolean {
  const grade: Grade = race.grade;
  switch (audience) {
    case 'ja':
      if (race.organization === 'jra') {
        return grade === 'G1' || grade === 'J.G1';
      }
      if (race.organization === 'nar') {
        return grade === 'Jpn1';
      }
      return grade === 'G1';
    case 'eu':
      return (
        grade === 'G1' &&
        (EU_ORGS.has(race.organization) ||
          (race.country_code !== undefined && EU_COUNTRIES.has(race.country_code)))
      );
    case 'us':
      return (
        grade === 'G1' &&
        (race.organization === 'equibase' || race.country_code === 'US')
      );
    case 'au':
      return (
        grade === 'G1' &&
        (race.organization === 'racing_australia' || race.country_code === 'AU')
      );
    case 'hk':
      return (
        grade === 'G1' &&
        (race.organization === 'hkjc' || race.country_code === 'HK')
      );
  }
}

/**
 * Compute [startYmd, endYmd] inclusive date range for the given mode.
 */
export function getDateWindowForMode(
  todayYmd: string,
  mode: SocialMode
): { start: string; end: string } {
  const dow = getDayOfWeek(todayYmd);
  switch (mode) {
    case 'monday-preview': {
      // Monday..Sunday of the week containing todayYmd
      const diffToMonday = dow === 0 ? -6 : 1 - dow;
      const monday = addDays(todayYmd, diffToMonday);
      return { start: monday, end: addDays(monday, 6) };
    }
    case 'friday-preview':
      // Friday..Sunday (3 days from today)
      return { start: todayYmd, end: addDays(todayYmd, 2) };
    case 'saturday-preview':
      // Sunday main races (tomorrow)
      return { start: addDays(todayYmd, 1), end: addDays(todayYmd, 1) };
    case 'sunday-results':
      // Weekend races (Saturday..Sunday) that have confirmed winners
      return { start: addDays(todayYmd, -1), end: todayYmd };
  }
}

/**
 * Select target races for the given audience, mode, and reference date.
 */
export function selectTargetRaces(
  races: readonly Race[],
  audience: SocialAudience,
  mode: SocialMode,
  now: Date = new Date(),
  overrideTodayYmd?: string
): Race[] {
  const { timeZone } = AUDIENCE_CONFIGS[audience];
  const todayYmd = overrideTodayYmd ?? formatDateInTimeZone(now, timeZone);
  const { start, end } = getDateWindowForMode(todayYmd, mode);

  return races
    .filter((race) => {
      if (!matchesAudience(race, audience)) return false;
      if (race.date < start || race.date > end) return false;
      if (mode === 'sunday-results' && !race.winner?.name?.ja) return false;
      return true;
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/**
 * Convert a race or horse name into a valid X hashtag (without spaces/punctuation).
 */
export function formatHashtag(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/['’`・･.\-‐‑–—/\\()[\]{}:;!?,"“”@#$%^&*+=~|<>]/g, '')
    .replace(/\s+/g, '');
  return cleaned ? `#${cleaned}` : '';
}

/**
 * Get localized race name for the target language with safe fallback.
 */
export function getLocalizedRaceName(race: Race, lang: 'ja' | 'en' | 'zh'): string {
  if (lang === 'zh') return race.name.zh || race.name.en || race.name.ja;
  if (lang === 'en') return race.name.en || race.name.ja;
  return race.name.ja || race.name.en;
}

/**
 * Get localized course name for the target language with safe fallback.
 */
export function getLocalizedCourseName(race: Race, lang: 'ja' | 'en' | 'zh'): string {
  if (lang === 'zh') return race.course.zh || race.course.en || race.course.ja;
  if (lang === 'en') return race.course.en || race.course.ja;
  return race.course.ja || race.course.en;
}

/**
 * Get localized winner name if available.
 */
export function getLocalizedWinnerName(race: Race, lang: 'ja' | 'en' | 'zh'): string | undefined {
  const w = race.winner?.name;
  if (!w) return undefined;
  if (lang === 'zh') return w.zh || w.en || w.ja;
  if (lang === 'en') return w.en || w.ja;
  return w.ja || w.en;
}

/**
 * Approximate X weighted character length:
 * - URLs count as 23 characters
 * - ASCII characters (<= U+00FF) count as 1
 * - CJK / wide / emoji characters count as 2
 */
export function calculateWeightedTweetLength(text: string): number {
  const urlRegex = /https?:\/\/\S+/g;
  const urls = text.match(urlRegex) ?? [];
  const withoutUrls = text.replace(urlRegex, '');

  let weight = urls.length * 23;
  for (const ch of withoutUrls) {
    const code = ch.codePointAt(0) ?? 0;
    weight += code <= 0x00ff ? 1 : 2;
  }
  return weight;
}

/**
 * Format race start time in the audience's local timezone (HH:mm).
 */
export function formatLocalTime(isoUtc: string, timeZone: string): string {
  const dt = new Date(isoUtc);
  if (Number.isNaN(dt.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(dt);
}

/**
 * Build structured race summary lines for AI prompting (strictly grounded in races.json).
 */
export function buildRaceSummaryLines(
  races: readonly Race[],
  audience: SocialAudience
): string {
  const { lang, timeZone } = AUDIENCE_CONFIGS[audience];
  return races
    .slice(0, 6)
    .map((r) => {
      const name = getLocalizedRaceName(r, lang);
      const course = getLocalizedCourseName(r, lang);
      const time = formatLocalTime(r.start_time, timeZone);
      const winner = getLocalizedWinnerName(r, lang);
      const winnerPart = winner ? ` | Winner: ${winner}` : '';
      return `- ${r.date} ${time} (${timeZone}) | ${r.grade} | ${name} | ${course} ${r.distance}m${winnerPart}`;
    })
    .join('\n');
}

/**
 * Build Gemini prompt for generating a grounded, hashtag-formatted X post.
 * Mirrors the style of @meshi__z: engaging hook -> calendar value prop -> "URL in reply" CTA.
 */
export function buildGeminiPrompt(
  races: readonly Race[],
  audience: SocialAudience,
  mode: SocialMode
): string {
  const { lang } = AUDIENCE_CONFIGS[audience];
  const raceLines = buildRaceSummaryLines(races, audience);

  const langInstruction =
    lang === 'ja'
      ? 'Write in natural, engaging Japanese for horse racing fans in Japan.'
      : lang === 'zh'
        ? 'Write in natural Traditional Chinese (Hong Kong style) for Hong Kong horse racing fans.'
        : 'Write in natural, engaging English for international horse racing fans.';

  const modeContext: Record<SocialMode, string> = {
    'monday-preview': "Previewing this week's big races (Monday evening post).",
    'friday-preview': 'Weekend race preview after declarations/runners are out (Friday evening post).',
    'saturday-preview': "Tomorrow's Sunday feature race preview (Saturday evening post).",
    'sunday-results': 'Celebrating the confirmed G1/Jpn1 race winners (Sunday evening post).',
  };

  const styleExamples =
    lang === 'ja'
      ? [
          'Style reference examples (follow this tone, pacing, emoji usage, and structure):',
          'Example 1: "今週は女王決定戦 #エリザベス女王杯 ！激戦必至の注目G1です👑 ここから年末まで続くG1連戦、発走日程がひと目でわかるWeb #競馬 カレンダーはこちら👇URLはリプ欄へ"',
          'Example 2: "米国の熱戦 #ブリーダーズカップ の次は、日本のダートの祭典 #JBC が金沢で開幕！🏇 発走時刻や今後の重賞日程がひと目でわかるWeb #競馬 カレンダーはこちら👇URLはリプ欄へ"',
        ].join('\n')
      : lang === 'zh'
        ? 'Style reference: Highlight the excitement of the feature race(s) with 1-2 emojis (e.g. 🏇, 🏆, 🔥), mention that local post times & global G1 schedules can be checked at a glance on the Web #賽馬 calendar, and end with "連結在回覆欄 👇".'
        : 'Style reference: Highlight the excitement of the feature race(s) with 1-2 fitting emojis (e.g. 🏇, 🏆, 🔥), mention that local post times & global G1 schedules can be checked at a glance on our Web #HorseRacing calendar, and end with "Link in reply 👇".';

  const ctaInstruction =
    lang === 'ja'
      ? 'End with a call-to-action directing users to the reply for the link (e.g. "発走時刻や今後の重賞日程がひと目でわかるWeb #競馬 カレンダーはこちら👇URLはリプ欄へ").'
      : lang === 'zh'
        ? 'Include the #賽馬 hashtag and end with "連結在回覆欄 👇".'
        : 'Include the #HorseRacing hashtag and end with "Link in reply 👇".';

  return [
    'You are writing a promotional X (Twitter) main post for the Horse Racing Calendar web app.',
    langInstruction,
    `Context: ${modeContext[mode]}`,
    '',
    styleExamples,
    '',
    'Verified race data (DO NOT invent any horse names, jockeys, odds, venues, or results not listed below):',
    raceLines,
    '',
    'Strict requirements:',
    '1. Convert race names (and winning horse names if Winner is listed) into #Hashtags (no spaces inside a hashtag).',
    '2. DO NOT include any URL (http:// or https://) in the main post body; the URL will be posted automatically as a reply.',
    `3. ${ctaInstruction}`,
    '4. Keep the total X weighted length <= 260 characters (remember: CJK characters count as 2, ASCII as 1).',
    '5. Output ONLY the final tweet text with no quotes, markdown fences, or explanations.',
  ].join('\n');
}

/**
 * Deterministic template fallback when GEMINI_API_KEY is unavailable or fails.
 */
export function buildFallbackTweet(
  races: readonly Race[],
  audience: SocialAudience,
  mode: SocialMode
): string {
  const { lang } = AUDIENCE_CONFIGS[audience];

  const headerMap: Record<'ja' | 'en' | 'zh', Record<SocialMode, string>> = {
    ja: {
      'monday-preview': '今週の注目G1・Jpn1スケジュール🐎',
      'friday-preview': '週末の注目G1・Jpn1チェック🔥',
      'saturday-preview': '明日の注目G1レース👑',
      'sunday-results': '今週のG1・Jpn1結果速報🏆',
    },
    en: {
      'monday-preview': "This week's G1 racing schedule 🐎",
      'friday-preview': 'Weekend G1 races to watch 🔥',
      'saturday-preview': "Tomorrow's G1 feature races 👑",
      'sunday-results': 'Weekend G1 race winners 🏆',
    },
    zh: {
      'monday-preview': '本週一級賽賽程一覽 🐎',
      'friday-preview': '週末焦點一級賽預告 🔥',
      'saturday-preview': '明日焦點一級賽 👑',
      'sunday-results': '本週一級賽賽果 🏆',
    },
  };

  const footerMap: Record<'ja' | 'en' | 'zh', string> = {
    ja: '発走時刻がひと目でわかるWeb #競馬 カレンダーはこちら👇URLはリプ欄へ',
    en: 'Check local post times on our Web #HorseRacing calendar 👇 Link in reply',
    zh: '一覽各地開跑時間的網頁版 #賽馬 行事曆 👇 連結在回覆欄',
  };

  const lines: string[] = [headerMap[lang][mode]];
  const footer = footerMap[lang];

  for (const race of races.slice(0, 3)) {
    const raceTag = formatHashtag(getLocalizedRaceName(race, lang));
    const winnerName = getLocalizedWinnerName(race, lang);
    const winnerTag =
      mode === 'sunday-results' && winnerName ? ` 🏆 ${formatHashtag(winnerName)}` : '';
    const candidate = `${race.date.slice(5)} ${raceTag}${winnerTag}`;
    const nextText = [...lines, candidate, '', footer].join('\n');
    if (calculateWeightedTweetLength(nextText) <= 275) {
      lines.push(candidate);
    }
  }

  lines.push('', footer);
  return lines.join('\n');
}

/**
 * Generate tweet text using Gemini API when available, falling back to template.
 */
export async function generateTweetText(
  races: readonly Race[],
  audience: SocialAudience,
  mode: SocialMode,
  geminiApiKey?: string
): Promise<{ text: string; usedAi: boolean }> {
  if (!geminiApiKey) {
    return { text: buildFallbackTweet(races, audience, mode), usedAi: false };
  }

  const prompt = buildGeminiPrompt(races, audience, mode);
  const endpoint =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 350 },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    if (!raw || /https?:\/\//i.test(raw) || calculateWeightedTweetLength(raw) > 280) {
      return { text: buildFallbackTweet(races, audience, mode), usedAi: false };
    }
    return { text: raw, usedAi: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[social] Gemini generation failed (${msg}); using template fallback.`);
    return { text: buildFallbackTweet(races, audience, mode), usedAi: false };
  }
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

export interface XOAuthCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

/**
 * Build an OAuth 1.0a Authorization header (HMAC-SHA1).
 */
export function buildOAuth1Header(
  method: string,
  url: string,
  creds: XOAuthCredentials,
  timestamp?: string,
  nonce?: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: nonce ?? crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp ?? Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.accessToken,
    oauth_version: '1.0',
  };

  const paramString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join('&');

  const signingKey = `${percentEncode(creds.apiSecret)}&${percentEncode(creds.accessSecret)}`;
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');

  const headerParams: Record<string, string> = {
    ...oauthParams,
    oauth_signature: signature,
  };

  return (
    'OAuth ' +
    Object.keys(headerParams)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(headerParams[k])}"`)
      .join(', ')
  );
}

/**
 * Upload an image buffer to X, post the main tweet, and reply with the site URL.
 */
export async function postTweetWithMedia(
  text: string,
  replyUrl: string,
  imageBuffer: Buffer | null,
  creds: XOAuthCredentials
): Promise<{ tweetId: string; replyTweetId: string }> {
  let mediaId: string | undefined;

  if (imageBuffer) {
    const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
    const form = new FormData();
    form.append(
      'media',
      new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' }),
      'screenshot.png'
    );

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: buildOAuth1Header('POST', uploadUrl, creds),
      },
      body: form,
    });

    if (!uploadRes.ok) {
      throw new Error(`X media upload failed with HTTP ${uploadRes.status}`);
    }

    const uploadJson = (await uploadRes.json()) as { media_id_string?: string };
    mediaId = uploadJson.media_id_string;
  }

  const tweetUrl = 'https://api.x.com/2/tweets';
  const payload: { text: string; media?: { media_ids: string[] } } = { text };
  if (mediaId) {
    payload.media = { media_ids: [mediaId] };
  }

  const tweetRes = await fetch(tweetUrl, {
    method: 'POST',
    headers: {
      Authorization: buildOAuth1Header('POST', tweetUrl, creds),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!tweetRes.ok) {
    throw new Error(`X post tweet failed with HTTP ${tweetRes.status}`);
  }

  const tweetJson = (await tweetRes.json()) as { data?: { id?: string } };
  const tweetId = tweetJson.data?.id;
  if (!tweetId) {
    throw new Error('X post tweet response missing data.id');
  }

  const replyRes = await fetch(tweetUrl, {
    method: 'POST',
    headers: {
      Authorization: buildOAuth1Header('POST', tweetUrl, creds),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: replyUrl,
      reply: { in_reply_to_tweet_id: tweetId },
    }),
  });

  if (!replyRes.ok) {
    throw new Error(`X reply tweet failed with HTTP ${replyRes.status}`);
  }

  const replyJson = (await replyRes.json()) as { data?: { id?: string } };
  if (!replyJson.data?.id) {
    throw new Error('X reply tweet response missing data.id');
  }

  return { tweetId, replyTweetId: replyJson.data.id };
}
