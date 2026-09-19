/**
 * JRA公式サイトから確定した発走予定時刻を取得・パースするライブラリ
 */

export interface ConfirmedRaceTime {
  raceName: string;
  date: string; // YYYY-MM-DD
  timeJst: string; // HH:mm
  rawTime: string; // 例: 15時45分
  sourceUrl?: string;
}

export interface ThisWeekRaceItem {
  raceName: string;
  date: string; // YYYY-MM-DD
  syutsubaPath?: string;
}

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
      const res = await fetch(url, init);
      if (res.ok) {
        return res;
      }
      // 5xxエラーの場合はリトライ対象
      if (res.status >= 500 && res.status < 600) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      // 4xx等はリトライせずそのまま返す
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[JRA Syutsuba] Fetch error for ${url} (attempt ${attempt}/${maxRetries}): ${(err as Error).message}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Shift-JISバッファを文字列にデコード
 */
export function decodeShiftJis(buf: ArrayBuffer | Buffer): string {
  try {
    return new TextDecoder('shift-jis').decode(buf);
  } catch {
    return Buffer.isBuffer(buf) ? buf.toString('utf-8') : Buffer.from(new Uint8Array(buf)).toString('utf-8');
  }
}

/**
 * 日付文字列（例: "2026年9月19日（土曜）" や "9月19日（土曜）"）から YYYY-MM-DD を生成
 */
export function parseDateToYmd(dateText: string, currentYear = new Date().getFullYear()): string | null {
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
 * 日本語時刻文字列（例: "15時45分", "11:20", "15:45"）から HH:mm 形式に変換
 */
export function parseTimeToHhMm(timeText: string): string | null {
  const jpMatch = timeText.match(/(\d{1,2})時\s*(\d{1,2})分/);
  if (jpMatch) {
    const h = jpMatch[1].padStart(2, '0');
    const m = jpMatch[2].padStart(2, '0');
    return `${h}:${m}`;
  }

  const colonMatch = timeText.match(/(\d{1,2}):(\d{2})/);
  if (colonMatch) {
    const h = colonMatch[1].padStart(2, '0');
    const m = colonMatch[2];
    return `${h}:${m}`;
  }

  return null;
}

/**
 * レース名から余計なグレード表記やHTMLタグ、装飾を取り除き正規化
 */
export function cleanRaceName(name: string): string {
  return name
    .replace(/<[^>]+>/g, '')
    .replace(/&#8544;|&RomanI;/gi, 'Ⅰ')
    .replace(/&#8545;|&RomanII;/gi, 'Ⅱ')
    .replace(/&#8546;|&RomanIII;/gi, 'Ⅲ')
    .replace(/&[a-z0-9#]+;/gi, '')
    .replace(/（[JG・\d\sⅢⅡⅠ]+）/gi, '')
    .replace(/\([JG・\d\sIII,II,IⅢⅡⅠ]+\)/gi, '')
    .replace(/\[指定\]|\[特指\]|（国際）|（特指）/g, '')
    .replace(/第\d+回/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * レース名マッチング（略称対応）
 */
export function raceNameMatches(targetName: string, scrapedName: string): boolean {
  const cTarget = cleanRaceName(targetName);
  const cScraped = cleanRaceName(scrapedName);
  if (cTarget === cScraped) return true;

  const simplify = (s: string) =>
    s
      .replace(/ステークス/g, 'S')
      .replace(/カップ/g, 'C')
      .replace(/トロフィー/g, 'T')
      .replace(/オータムハンデキャップ/g, 'オータムH')
      .replace(/オータムH/g, 'オータムH')
      .replace(/[\s\(\)（）・]/g, '');

  const sTarget = simplify(cTarget);
  const sScraped = simplify(cScraped);

  return sTarget === sScraped || sTarget.includes(sScraped) || sScraped.includes(sTarget);
}

/**
 * JST日付とHH:mmからUTC ISO 8601形式の文字列を生成
 */
export function toIsoUtc(dateStr: string, timeJst: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeJst.split(':').map(Number);
  const jstDate = new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0));
  return jstDate.toISOString();
}

/**
 * 「今週の注目レース」ページ (https://www.jra.go.jp/keiba/thisweek/) のHTMLをパース
 */
export function parseThisWeekHtml(
  html: string,
  currentYear = new Date().getFullYear()
): ThisWeekRaceItem[] {
  const races: ThisWeekRaceItem[] = [];

  // 各レースブロック (class="race_unit ...") を抽出
  const unitMatches = html.matchAll(/<div class="race_unit[^"]*"[\s\S]*?<\/div><!-- \/\[\.race_unit\] -->/gi);

  for (const match of unitMatches) {
    const block = match[0];

    // 日付 (例: <dt>9月19日（土曜）</dt>)
    const dateMatch = block.match(/<dt>([^<]+)<\/dt>/);
    const dateStr = dateMatch ? parseDateToYmd(dateMatch[1], currentYear) : null;
    if (!dateStr) continue;

    // レース名 (例: <h3>阪神ジャンプステークス（J・GⅢ）</h3>)
    const titleMatch = block.match(/<h3>([\s\S]*?)<\/h3>/);
    if (!titleMatch) continue;
    const raceName = cleanRaceName(titleMatch[1]);
    if (!raceName) continue;

    // 出馬表リンク (例: <a href="/JRADB/accessD.html?CNAME=pw01dde..." ...><div class="inner"><img src="img/icon_syutsuba_h.png" alt="出馬表"/>)
    let syutsubaPath: string | undefined;
    const syutsubaLinkMatch = block.match(/<a[^>]*href=["']([^"']*accessD\.html\?CNAME=pw01dde[^"']*)["'][^>]*>[\s\S]*?alt="出馬表"/i);
    if (syutsubaLinkMatch) {
      syutsubaPath = syutsubaLinkMatch[1];
    }

    races.push({
      raceName,
      date: dateStr,
      syutsubaPath,
    });
  }

  return races;
}

/**
 * 出馬表詳細ページ（https://www.jra.go.jp/JRADB/accessD.html?CNAME=pw01dde...）のHTMLをパース
 */
export function parseSyutsubaDetailHtml(
  html: string,
  fallbackDate?: string,
  currentYear = new Date().getFullYear()
): { raceName?: string; date?: string; timeJst?: string; rawTime?: string } | null {
  // 発走時刻 (例: 発走時刻：<strong>15時45分</strong> または <strong>11時20分</strong>)
  const timeMatch = html.match(/発走時刻：<strong>([^<]+)<\/strong>/);
  if (!timeMatch) {
    return null;
  }
  const rawTime = timeMatch[1].trim();
  const timeJst = parseTimeToHhMm(rawTime);
  if (!timeJst) {
    return null;
  }

  // 開催日 (例: <div class="cell date">2026年9月19日（土曜） 4回中山5日</div>)
  const dateMatch = html.match(/<div class="cell date">([^<]+)<\/div>/);
  const date = (dateMatch ? parseDateToYmd(dateMatch[1], currentYear) : null) || fallbackDate;

  // レース名 (例: <span class="race_name">阪神ジャンプステークス<span ...></span></span>)
  let raceName: string | undefined;
  const raceNameBlockMatch = html.match(/<span class="race_name">([\s\S]*?)<\/span>\s*<\/span>\s*<\/h2>/i);
  if (raceNameBlockMatch) {
    raceName = cleanRaceName(raceNameBlockMatch[1]);
  } else {
    // 汎用h2ブロック
    const h2Match = html.match(/<div class="txt">\s*<h2>([\s\S]*?)<\/h2>/i);
    if (h2Match) {
      raceName = cleanRaceName(h2Match[1]);
    }
  }

  return {
    raceName,
    date,
    timeJst,
    rawTime,
  };
}

/**
 * 出馬表トップ（POST pw01dli00/F3）から各競馬場のレース選択画面リンク（pw01drl...）をパース
 */
export function parseSyutsubaTopCnames(html: string): string[] {
  const cnames: string[] = [];
  const matches = html.matchAll(/doAction\(['"][^'"]*accessD\.html['"],\s*['"](pw01drl[^'"]+)['"]\)/gi);
  for (const m of matches) {
    if (!cnames.includes(m[1])) {
      cnames.push(m[1]);
    }
  }
  return cnames;
}

/**
 * 各競馬場のレース一覧テーブル（POST pw01drl...）のHTMLから全レースの発走時刻をパース
 */
export function parseSyutsubaListTableHtml(
  html: string,
  fallbackDate?: string,
  currentYear = new Date().getFullYear()
): ConfirmedRaceTime[] {
  const results: ConfirmedRaceTime[] = [];

  // キャプションから開催日を取得 (例: <h2>2026年9月19日（土曜） 4回中山5日</h2>)
  const captionMatch = html.match(/<div class="main">\s*<h2>([^<]+)<\/h2>/i);
  const date = (captionMatch ? parseDateToYmd(captionMatch[1], currentYear) : null) || fallbackDate;
  if (!date) return results;

  // tbodyの行を走査
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return results;

  const rowMatches = tbodyMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi);
  for (const rowMatch of rowMatches) {
    const row = rowMatch[1];

    // 発走時刻
    const timeMatch = row.match(/<td class="time">([^<]+)<\/td>/i);
    if (!timeMatch) continue;
    const rawTime = timeMatch[1].trim();
    const timeJst = parseTimeToHhMm(rawTime);
    if (!timeJst) continue;

    // レース名
    let raceName = '';
    const stakesMatch = row.match(/<div class="stakes">([\s\S]*?)<\/div>/i);
    if (stakesMatch) {
      raceName = cleanRaceName(stakesMatch[1]);
    } else {
      const raceNameCellMatch = row.match(/<td class="race_name">([\s\S]*?)<\/td>/i);
      if (raceNameCellMatch) {
        raceName = cleanRaceName(raceNameCellMatch[1]);
      }
    }

    if (raceName) {
      results.push({
        raceName,
        date,
        timeJst,
        rawTime,
      });
    }
  }

  return results;
}

/**
 * JRA公式サイトから今週の重賞競走の確定発走予定時刻を取得する
 */
export async function fetchConfirmedRaceTimes(options?: {
  baseUrl?: string;
  currentYear?: number;
}): Promise<ConfirmedRaceTime[]> {
  const baseUrl = options?.baseUrl || 'https://www.jra.go.jp';
  const currentYear = options?.currentYear || new Date().getFullYear();
  const confirmedTimes: ConfirmedRaceTime[] = [];
  const seenKeys = new Set<string>();

  console.log('[JRA Syutsuba] Step 1: Checking "This Week" page for graded races...');
  const thisWeekUrl = `${baseUrl}/keiba/thisweek/`;

  try {
    const res = await fetchWithRetry(thisWeekUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (res.ok) {
      const buf = await res.arrayBuffer();
      const html = decodeShiftJis(buf);
      const weekRaces = parseThisWeekHtml(html, currentYear);
      console.log(`[JRA Syutsuba] Found ${weekRaces.length} graded race(s) in "This Week" page.`);

      for (const race of weekRaces) {
        if (!race.syutsubaPath) {
          console.log(`[JRA Syutsuba] Race "${race.raceName}" (${race.date}) does not have an active syutsuba card link yet.`);
          continue;
        }

        const detailUrl = new URL(race.syutsubaPath, baseUrl).toString();
        try {
          console.log(`[JRA Syutsuba] Fetching racecard detail for "${race.raceName}" from ${detailUrl}...`);
          const detailRes = await fetchWithRetry(detailUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });

          if (detailRes.ok) {
            const detailBuf = await detailRes.arrayBuffer();
            const detailHtml = decodeShiftJis(detailBuf);
            const parsed = parseSyutsubaDetailHtml(detailHtml, race.date, currentYear);

            if (parsed && parsed.timeJst) {
              const matchedName = parsed.raceName || race.raceName;
              const date = parsed.date || race.date;
              const key = `${date}_${matchedName}`;

              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                confirmedTimes.push({
                  raceName: matchedName,
                  date,
                  timeJst: parsed.timeJst,
                  rawTime: parsed.rawTime || `${parsed.timeJst} JST`,
                  sourceUrl: detailUrl,
                });
                console.log(`[JRA Syutsuba] Confirmed time for "${matchedName}" on ${date}: ${parsed.timeJst} JST`);
              }
            }
          }
        } catch (err) {
          console.warn(`[JRA Syutsuba] Failed to fetch racecard detail for ${detailUrl}: ${(err as Error).message}`);
        }
      }
    }
  } catch (err) {
    console.warn(`[JRA Syutsuba] Failed to fetch "This Week" page: ${(err as Error).message}`);
  }

  // フォールバック: 出馬表トップ (pw01dli00/F3) からも取得を試みる
  console.log('[JRA Syutsuba] Step 2: Checking syutsuba portal via POST for any additional confirmed races...');
  try {
    const postUrl = `${baseUrl}/JRADB/accessD.html`;
    const topRes = await fetchWithRetry(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: 'cname=pw01dli00/F3',
    });

    if (topRes.ok) {
      const topBuf = await topRes.arrayBuffer();
      const topHtml = decodeShiftJis(topBuf);
      const cnames = parseSyutsubaTopCnames(topHtml);
      console.log(`[JRA Syutsuba] Found ${cnames.length} race meeting(s) to inspect.`);

      for (const cname of cnames) {
        try {
          const meetingRes = await fetchWithRetry(postUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            body: `cname=${encodeURIComponent(cname)}`,
          });

          if (meetingRes.ok) {
            const meetingBuf = await meetingRes.arrayBuffer();
            const meetingHtml = decodeShiftJis(meetingBuf);
            const tableRaces = parseSyutsubaListTableHtml(meetingHtml, undefined, currentYear);

            for (const tr of tableRaces) {
              const key = `${tr.date}_${tr.raceName}`;
              if (!seenKeys.has(key)) {
                // 既存のリストにレース名エイリアス一致があるかチェック
                const alreadyExists = confirmedTimes.some(
                  (c) => c.date === tr.date && raceNameMatches(c.raceName, tr.raceName)
                );
                if (!alreadyExists) {
                  seenKeys.add(key);
                  confirmedTimes.push({
                    ...tr,
                    sourceUrl: postUrl,
                  });
                  console.log(`[JRA Syutsuba] Found race time from table: "${tr.raceName}" on ${tr.date}: ${tr.timeJst} JST`);
                }
              }
            }
          }
        } catch (err) {
          console.warn(`[JRA Syutsuba] Failed to fetch race meeting cname=${cname}: ${(err as Error).message}`);
        }
      }
    }
  } catch (err) {
    console.warn(`[JRA Syutsuba] Fallback syutsuba check encountered error: ${(err as Error).message}`);
  }

  console.log(`[JRA Syutsuba] Completed scraping. Total confirmed race time records: ${confirmedTimes.length}`);
  return confirmedTimes;
}
