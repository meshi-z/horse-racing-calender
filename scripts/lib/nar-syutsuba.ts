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

export interface FetchNarOptions {
  year?: number;
  localFixturePath?: string;
}

/**
 * NARの確定・予定発走時刻を取得
 */
export async function fetchNarConfirmedRaceTimes(
  options: FetchNarOptions = {}
): Promise<ConfirmedRaceTime[]> {
  const year = options.year || new Date().getFullYear();

  // 1. ローカルフィクスチャ指定がある場合は優先（オフライン・テスト対応）
  if (options.localFixturePath && fs.existsSync(options.localFixturePath)) {
    const html = fs.readFileSync(options.localFixturePath, 'utf-8');
    return parseDirtGradeRacelistHtml(html, year);
  }

  // 2. tests/fixtures/nar_racelist_{year}.html があればオフラインキャッシュとしてフォールバック可能
  const fallbackFixture = path.resolve(process.cwd(), `tests/fixtures/nar_racelist_${year}.html`);

  const url = `https://www.keiba.go.jp/dirtgraderace/${year}/racelist/`;
  try {
    const res = await fetchWithRetry(url, undefined, 2, 800);
    if (res.ok) {
      const html = await res.text();
      const results = parseDirtGradeRacelistHtml(html, year);
      if (results.length > 0) {
        return results;
      }
    }
  } catch (err) {
    console.warn(`[NAR Syutsuba] Failed to fetch remote racelist (${url}): ${(err as Error).message}`);
  }

  // リモート失敗時はキャッシュフィクスチャを試行
  if (fs.existsSync(fallbackFixture)) {
    console.log(`[NAR Syutsuba] Using local racelist cache: ${fallbackFixture}`);
    const html = fs.readFileSync(fallbackFixture, 'utf-8');
    return parseDirtGradeRacelistHtml(html, year);
  }

  return [];
}
