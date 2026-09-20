import fs from 'node:fs';
import path from 'node:path';
import { ConfirmedRaceTime, raceNameMatches, toIsoUtc, cleanRaceName } from './jra-syutsuba';

export type { ConfirmedRaceTime };
export { raceNameMatches, toIsoUtc, cleanRaceName };

/**
 * 指数バックオフ付きfetch
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        },
        ...init,
      });
      if (res.ok) {
        return res;
      }
      if (res.status >= 500 && res.status < 600) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(
          `[NAR Syutsuba] Fetch error for ${url} (attempt ${attempt}/${maxRetries}): ${(err as Error).message}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * NAR日付文字列（例: "2月11日(祝水)" や "2026年9月22日(休火)"）から YYYY-MM-DD を生成
 */
export function parseNarDateToYmd(dateText: string, currentYear = new Date().getFullYear()): string | null {
  const fullMatch = dateText.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (fullMatch) {
    const y = fullMatch[1];
    const m = fullMatch[2].padStart(2, '0');
    const d = fullMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const shortMatch = dateText.match(/(\d{1,2})月\s*(\d{1,2})日/);
  if (shortMatch) {
    const m = shortMatch[1].padStart(2, '0');
    const d = shortMatch[2].padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  }

  return null;
}

/**
 * NAR発走時刻文字列（例: "20:05発走", "18:00発走予定", "16:30"）から HH:mm 形式を抽出
 */
export function parseNarTimeToHhMm(timeText: string): string | null {
  const match = timeText.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2];
    return `${h}:${m}`;
  }
  return null;
}

export interface NarRacelistItem {
  raceName: string;
  date: string;
  timeJst?: string;
  rawTime?: string;
  course?: string;
  distance?: number;
  url?: string;
}

/**
 * NAR公式ダートグレード年間一覧（https://www.keiba.go.jp/dirtgraderace/{YYYY}/racelist/）のHTMLをパース
 */
export function parseDirtGradeRacelistHtml(
  html: string,
  year = new Date().getFullYear()
): ConfirmedRaceTime[] {
  const confirmedList: ConfirmedRaceTime[] = [];

  // 各月ブロックまたは各アイテム (<li class="js-item" ...> ... </li>) を抽出
  const itemMatches = html.matchAll(/<li[^>]*class=["'][^"']*js-item[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi);

  for (const match of itemMatches) {
    const itemHtml = match[1];

    // 日付 (例: <p>2月11日(祝水)</p>)
    const dateMatch = itemHtml.match(/<p[^>]*>(\s*\d{1,2}月\d{1,2}日[^\<]*)<\/p>/);
    if (!dateMatch) continue;
    const dateStr = parseNarDateToYmd(dateMatch[1], year);
    if (!dateStr) continue;

    // レース名 (例: <h4 class="jpn3">クイーン賞</h4>)
    const nameMatch = itemHtml.match(/<h4[^>]*>([\s\S]*?)<\/h4>/);
    if (!nameMatch) continue;
    const raceName = cleanRaceName(nameMatch[1]);
    if (!raceName) continue;

    // コース・距離・発走時刻 (例: <p>船橋 左1800m 20:05発走</p> または <p>大井 右2000m 20:05発走予定</p>)
    const pMatches = itemHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    let timeJst: string | undefined;
    let rawTime: string | undefined;

    for (const p of pMatches) {
      const pText = p[1].trim();
      const extracted = parseNarTimeToHhMm(pText);
      if (extracted) {
        timeJst = extracted;
        rawTime = pText;
        break;
      }
    }

    // リンクURL (例: href="/dirtgraderace/2026/0211_queensho/racecard.html")
    const linkMatch = itemHtml.match(/href=["']([^"']+)["']/);
    const sourceUrl = linkMatch ? linkMatch[1] : undefined;

    if (timeJst) {
      confirmedList.push({
        raceName,
        date: dateStr,
        timeJst,
        rawTime: rawTime || `${timeJst}発走`,
        sourceUrl: sourceUrl
          ? sourceUrl.startsWith('http')
            ? sourceUrl
            : `https://www.keiba.go.jp${sourceUrl}`
          : undefined,
      });
    }
  }

  return confirmedList;
}

export const NAR_BABA_CODES: Record<string, number> = {
  帯広: 3,
  帯広ば: 3,
  門別: 36,
  盛岡: 10,
  水沢: 11,
  浦和: 18,
  船橋: 19,
  大井: 20,
  川崎: 21,
  金沢: 22,
  笠松: 23,
  名古屋: 24,
  園田: 27,
  姫路: 28,
  高知: 31,
  佐賀: 32,
};

/**
 * NAR出馬表等のレース名から格付け表記や不要タグを除去
 */
export function cleanNarRaceName(name: string): string {
  let cleaned = name
    .replace(/<[^>]+>/g, '')
    .replace(/&#8544;|&RomanI;/gi, 'Ⅰ')
    .replace(/&#8545;|&RomanII;/gi, 'Ⅱ')
    .replace(/&#8546;|&RomanIII;/gi, 'Ⅲ')
    .replace(/&[a-z0-9#]+;/gi, '')
    // 全角・半角括弧内のJpn/G/S/BG/J.G等の格付け表記を除去
    .replace(/[\(（]\s*(?:Jpn|J・G|G|S|BG)?[ⅠⅡⅢ123IV,\s\d・]+[\)）]/gi, '')
    .replace(/[\(（]\s*(?:Jpn|J・G|G|S|BG)[ⅠⅡⅢ123IV\d]*\s*[\)）]/gi, '')
    .replace(/\[指定\]|\[特指\]|（国際）|（特指）/g, '')
    .replace(/第\d+回/g, '')
    .replace(/\s+/g, '')
    .trim();

  // 末尾や途中のJpn/G/S/BG等の格付け表記を除去
  cleaned = cleaned.replace(/(?:Jpn|G|S|BG)[ⅠⅡⅢ123I|V]+$/i, '');
  cleaned = cleaned.replace(/(?:Jpn|G|S|BG)[ⅠⅡⅢ123I|V]+/gi, '');
  // 残った空括弧を除去
  cleaned = cleaned.replace(/[\(（]\s*[\)）]/g, '');

  return cleanRaceName(cleaned);
}

/**
 * NAR公式各競馬場「当日メニュー/出馬表一覧」HTML（RaceList）をパース
 */
export function parseNarRaceListHtml(
  html: string,
  targetDateStr: string
): ConfirmedRaceTime[] {
  const confirmedList: ConfirmedRaceTime[] = [];

  // 各レース行 (<tr class="data"> ... </tr>) を抽出
  const trMatches = html.matchAll(/<tr[^>]*class=["'][^"']*data[^"']*["'][^>]*>([\s\S]*?)<\/tr>/gi);

  for (const match of trMatches) {
    const trHtml = match[1];

    // 発走時刻 (例: <td>\n 18:00 \n</td>)
    const timeMatch = trHtml.match(/<td[^>]*>\s*(\d{1,2}:\d{2})\s*<\/td>/i);
    if (!timeMatch) continue;
    const timeJst = timeMatch[1].padStart(5, '0');

    // レース名・出馬表リンク (例: <a href=...DebaTable?...>白山大賞典JpnIII</a>)
    const raceLinkMatch = trHtml.match(
      /<a[^>]*href=["']?([^"'>]*DebaTable[^"'>]*)["']?[^>]*>([\s\S]*?)<\/a>/i
    );
    if (!raceLinkMatch) continue;

    const sourceUrlPath = raceLinkMatch[1].trim();
    const rawRaceName = raceLinkMatch[2].trim();
    const cleanedName = cleanNarRaceName(rawRaceName);
    if (!cleanedName) continue;

    const sourceUrl = sourceUrlPath.startsWith('http')
      ? sourceUrlPath
      : sourceUrlPath.startsWith('/')
      ? `https://www.keiba.go.jp${sourceUrlPath}`
      : `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/${sourceUrlPath}`;

    confirmedList.push({
      raceName: cleanedName,
      date: targetDateStr,
      timeJst,
      rawTime: `${timeJst}発走`,
      sourceUrl,
    });
  }

  return confirmedList;
}

export interface NarTargetRaceInput {
  date: string;
  course: {
    ja: string;
    en?: string;
  };
  name: {
    ja: string;
    en?: string;
  };
}

export interface FetchNarOptions {
  year?: number;
  localFixturePath?: string;
  raceListFixtures?: Record<string, string>; // `${date}_${babaCode}` -> fixturePath
  targetRaces?: NarTargetRaceInput[];
}

/**
 * 特定の競馬場・開催日の出馬表（RaceList）から確定時刻を取得
 */
export async function fetchNarRaceListTimes(options: {
  date: string; // YYYY-MM-DD
  babaCode: number;
  localFixturePath?: string;
}): Promise<ConfirmedRaceTime[]> {
  const { date, babaCode, localFixturePath } = options;

  // ローカルフィクスチャが指定されている場合はそれを優先
  if (localFixturePath && fs.existsSync(localFixturePath)) {
    const html = fs.readFileSync(localFixturePath, 'utf-8');
    return parseNarRaceListHtml(html, date);
  }

  // YYYY-MM-DD -> YYYY/MM/DD
  const kRaceDate = date.replace(/-/g, '/');
  const encodedDate = encodeURIComponent(kRaceDate);
  const url = `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?k_raceDate=${encodedDate}&k_babaCode=${babaCode}`;

  try {
    const res = await fetchWithRetry(url, undefined, 2, 800);
    if (res.ok) {
      const html = await res.text();
      return parseNarRaceListHtml(html, date);
    }
  } catch (err) {
    console.warn(`[NAR Syutsuba] Failed to fetch RaceList (${url}): ${(err as Error).message}`);
  }

  return [];
}

/**
 * NARの確定・予定発走時刻を取得（ダートグレード年間一覧 + 直近出馬表の統合）
 */
export async function fetchNarConfirmedRaceTimes(
  options: FetchNarOptions = {}
): Promise<ConfirmedRaceTime[]> {
  const year = options.year || new Date().getFullYear();
  const confirmedList: ConfirmedRaceTime[] = [];

  // 1. ダートグレード競走年間一覧の取得
  let dirtGradeTimes: ConfirmedRaceTime[] = [];
  if (options.localFixturePath && fs.existsSync(options.localFixturePath)) {
    const html = fs.readFileSync(options.localFixturePath, 'utf-8');
    dirtGradeTimes = parseDirtGradeRacelistHtml(html, year);
  } else {
    const fallbackFixture = path.resolve(process.cwd(), `tests/fixtures/nar_racelist_${year}.html`);
    const url = `https://www.keiba.go.jp/dirtgraderace/${year}/racelist/`;
    try {
      const res = await fetchWithRetry(url, undefined, 2, 800);
      if (res.ok) {
        const html = await res.text();
        dirtGradeTimes = parseDirtGradeRacelistHtml(html, year);
      }
    } catch (err) {
      console.warn(`[NAR Syutsuba] Failed to fetch remote racelist (${url}): ${(err as Error).message}`);
    }

    if (dirtGradeTimes.length === 0 && fs.existsSync(fallbackFixture)) {
      console.log(`[NAR Syutsuba] Using local racelist cache: ${fallbackFixture}`);
      const html = fs.readFileSync(fallbackFixture, 'utf-8');
      dirtGradeTimes = parseDirtGradeRacelistHtml(html, year);
    }
  }

  confirmedList.push(...dirtGradeTimes);

  // 2. targetRaces が渡されている場合、対象競馬場の当日メニュー出馬表（RaceList）を取得
  if (options.targetRaces && options.targetRaces.length > 0) {
    // 日付と競馬場コードの組み合わせをユニーク化
    const targetBatches = new Map<string, { date: string; babaCode: number }>();

    for (const race of options.targetRaces) {
      const courseName = race.course.ja.replace(/競馬場$/, '').trim();
      const babaCode = NAR_BABA_CODES[courseName] || NAR_BABA_CODES[race.course.ja];
      if (babaCode) {
        const key = `${race.date}_${babaCode}`;
        if (!targetBatches.has(key)) {
          targetBatches.set(key, { date: race.date, babaCode });
        }
      }
    }

    for (const [key, batch] of targetBatches.entries()) {
      const fixtureForBatch = options.raceListFixtures?.[key];
      try {
        const raceListTimes = await fetchNarRaceListTimes({
          date: batch.date,
          babaCode: batch.babaCode,
          localFixturePath: fixtureForBatch,
        });

        for (const item of raceListTimes) {
          // 既存の同日・同名レースがあれば出馬表の確定時刻で上書き、なければ追加
          const existingIdx = confirmedList.findIndex(
            (c) => c.date === item.date && raceNameMatches(c.raceName, item.raceName)
          );
          if (existingIdx >= 0) {
            confirmedList[existingIdx] = item;
          } else {
            confirmedList.push(item);
          }
        }
      } catch (err) {
        console.warn(
          `[NAR Syutsuba] Error fetching RaceList for ${batch.date} (babaCode=${batch.babaCode}): ${(err as Error).message}`
        );
      }
    }
  }

  return confirmedList;
}
