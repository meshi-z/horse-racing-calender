import { cleanRaceName } from './jra-syutsuba';
import type { RaceWinner } from '../update-race-times';

export interface ParsedRaceResult {
  raceName: string;
  date?: string;
  course?: string;
  winner: {
    horseName: string;
    horseNumber?: number;
    jockey?: string;
    time?: string;
  };
}

/**
 * JRA公式レース結果HTML（特別レース成績表、着順テーブル）から勝ち馬情報をパース
 */
export function parseJraRaceResultHtml(html: string): ParsedRaceResult[] {
  const results: ParsedRaceResult[] = [];

  // パターン1: JRA標準特別レース・全レース結果テーブル (<table class="race_table" ...> または <table class="result_table" ...>)
  // 1着行: <tr> ... <td>1</td> ... <td class="num">16</td> ... <td class="horse">ピューロマジック</td> ...
  // 各レースブロックまたはテーブル単位で走査
  const tableMatches = html.matchAll(/(?:<div[^>]*class=["'][^"']*(?:race_unit|result_block)[^"']*["'][^>]*>|<table[^>]*class=["'][^"']*(?:race_table|result_table|nk_tb_common|table_type01)[^"']*["'][^>]*>)([\s\S]*?)(?:<\/div><!-- \/\[\.(?:race_unit|result_block)\] -->|<\/table>)/gi);

  for (const tableMatch of tableMatches) {
    const blockHtml = tableMatch[1];

    // レース名
    let raceName = '';
    const raceNameMatch =
      blockHtml.match(/<(?:h[1-4]|span|div)[^>]*class=["'][^"']*(?:race_name|stakes|title)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h[1-4]|span|div)>/i) ||
      blockHtml.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i) ||
      blockHtml.match(/<h3>([\s\S]*?)<\/h3>/i);

    if (raceNameMatch) {
      raceName = cleanRaceName(raceNameMatch[1]);
    }

    // 1着行の抽出 (着順が 1 の行)
    const rowMatches = blockHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    for (const rowMatch of rowMatches) {
      const row = rowMatch[1];

      // 着順判定: 最初のセルまたは class="place" / class="order" が 1
      const orderMatch =
        row.match(/<td[^>]*class=["'][^"']*(?:place|order|rank)[^"']*["'][^>]*>\s*1\s*<\/td>/i) ||
        row.match(/<td[^>]*>\s*1\s*<\/td>/i);

      if (!orderMatch) continue;

      // 馬番
      let horseNumber: number | undefined;
      const numMatch = row.match(/<td[^>]*class=["'][^"']*(?:num|umaban|horse_num)[^"']*["'][^>]*>\s*(\d{1,2})\s*<\/td>/i);
      if (numMatch) {
        horseNumber = parseInt(numMatch[1], 10);
      }

      // 馬名
      let horseName = '';
      const horseMatch =
        row.match(/<td[^>]*class=["'][^"']*(?:horse|bamei|horse_name)[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
        row.match(/<td[^>]*class=["'][^"']*(?:horse|bamei|horse_name)[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
      if (horseMatch) {
        horseName = horseMatch[1].replace(/<[^>]+>/g, '').trim();
      }

      // 騎手名
      let jockey: string | undefined;
      const jockeyMatch =
        row.match(/<td[^>]*class=["'][^"']*(?:jockey|kishu)[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
        row.match(/<td[^>]*class=["'][^"']*(?:jockey|kishu)[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
      if (jockeyMatch) {
        jockey = jockeyMatch[1].replace(/<[^>]+>/g, '').trim();
      }

      // タイム
      let time: string | undefined;
      const timeMatch = row.match(/<td[^>]*class=["'][^"']*(?:time|record)[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
      if (timeMatch) {
        const rawTime = timeMatch[1].replace(/<[^>]+>/g, '').trim();
        if (/^\d{1,2}:\d{2}\.\d$/.test(rawTime) || /^\d{1,2}\.\d$/.test(rawTime)) {
          time = rawTime;
        }
      }

      if (horseName) {
        results.push({
          raceName,
          winner: {
            horseName,
            horseNumber,
            jockey,
            time,
          },
        });
        break; // 1着が見つかればこのテーブルは終了
      }
    }
  }

  // パターン2: 単一レース結果ページ形式（h1にレース名、テーブル先頭行に着順）
  if (results.length === 0) {
    const singleRaceNameMatch =
      html.match(/<h1[^>]*class=["'][^"']*(?:race_name|title)[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
      html.match(/<div class="txt">\s*<h2>([\s\S]*?)<\/h2>/i);

    const singleRaceName = singleRaceNameMatch ? cleanRaceName(singleRaceNameMatch[1]) : '';

    const firstPlaceRowMatch = html.match(/<tr[^>]*>[\s\S]*?<td[^>]*>(?:1|01)<\/td>([\s\S]*?)<\/tr>/i);
    if (firstPlaceRowMatch) {
      const row = firstPlaceRowMatch[0];

      // 馬番
      const numMatch = row.match(/<td[^>]*class=["'][^"']*(?:num|umaban)[^"']*["'][^>]*>\s*(\d{1,2})\s*<\/td>/i) ||
        row.match(/<td[^>]*>\s*(\d{1,2})\s*<\/td>/);
      const horseNumber = numMatch ? parseInt(numMatch[1], 10) : undefined;

      // 馬名
      let horseName = '';
      const horseMatch = row.match(/<td[^>]*class=["'][^"']*(?:horse|horse_name|bamei)[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
      if (horseMatch) {
        horseName = horseMatch[1].replace(/<[^>]+>/g, '').trim();
      }

      // 騎手
      let jockey: string | undefined;
      const jockeyMatch = row.match(/<td[^>]*class=["'][^"']*(?:jockey|kishu)[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
      if (jockeyMatch) {
        jockey = jockeyMatch[1].replace(/<[^>]+>/g, '').trim();
      }

      // タイム
      let time: string | undefined;
      const timeMatch = row.match(/<td[^>]*class=["'][^"']*(?:time|record)[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
      if (timeMatch) {
        const rawTime = timeMatch[1].replace(/<[^>]+>/g, '').trim();
        if (/^\d{1,2}:\d{2}\.\d$/.test(rawTime)) {
          time = rawTime;
        }
      }

      if (horseName) {
        results.push({
          raceName: singleRaceName,
          winner: {
            horseName,
            horseNumber,
            jockey,
            time,
          },
        });
      }
    }
  }

  return results;
}

/**
 * パースされた勝者情報から多言語対応の RaceWinner オブジェクトを構築
 * 一次ソース原則および空値原則（Null Value Principle）に基づき、
 * 公式一次ソースに存在しない英語馬名・騎手名は推測生成せず未設定とする。
 */
export function buildJraRaceWinner(parsed: ParsedRaceResult['winner']): RaceWinner {
  const jaName = parsed.horseName;

  let jockeyObj: RaceWinner['jockey'];
  if (parsed.jockey) {
    jockeyObj = {
      ja: parsed.jockey.replace(/\s+/g, ' ').trim(),
    };
  }

  return {
    name: {
      ja: jaName,
    },
    jockey: jockeyObj,
    horse_number: parsed.horseNumber,
    time: parsed.time,
  };
}

export interface JraMeetingInfo {
  date: string; // YYYYMMDD または YYYY-MM-DD
  courseCode?: string;
  courseJa: string;
  cname: string;
}

/**
 * JRA公式データベース accessS.html (pw01sli00/AF) から直近の開催日・開催場一覧を抽出
 */
export function parseAccessSTopHtml(html: string): JraMeetingInfo[] {
  const meetings: JraMeetingInfo[] = [];
  const seenCnames = new Set<string>();
  const regex = /doAction\(\s*['"]\/JRADB\/accessS\.html['"]\s*,\s*['"](pw01srl[a-zA-Z0-9\/]+)['"]\s*\)[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const cname = match[1];
    if (seenCnames.has(cname)) continue;
    seenCnames.add(cname);

    const linkText = match[2].replace(/<[^>]+>/g, '').trim();
    let date = '';
    let courseCode = '';

    const cnameMatch = cname.match(/pw01srl\d{2}(\d{2})\d+(\d{8})\//);
    if (cnameMatch) {
      courseCode = cnameMatch[1];
      date = cnameMatch[2]; // YYYYMMDD
    }

    let courseJa = '';
    const courseKeywords = ['東京', '中山', '京都', '阪神', '新潟', '福島', '中京', '小倉', '札幌', '函館'];
    for (const kw of courseKeywords) {
      if (linkText.includes(kw)) {
        courseJa = kw;
        break;
      }
    }

    meetings.push({
      date,
      courseCode,
      courseJa: courseJa || linkText,
      cname,
    });
  }

  return meetings;
}

export interface JraMeetingRaceLink {
  raceNumber?: number;
  raceName: string;
  detailCname: string;
}

/**
 * 開催場別全レース一覧HTMLから各レースの成績詳細CNAMEを抽出
 */
export function parseMeetingRacesHtml(html: string): JraMeetingRaceLink[] {
  const races: JraMeetingRaceLink[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1];
    const cnameMatch = row.match(/CNAME=([^"'&>\s]+)/i) || row.match(/cname=([^"'&>\s]+)/i);
    const stakesMatch =
      row.match(/<div class=["']stakes["'][^>]*>([\s\S]*?)<\/div>/i) ||
      row.match(/<td class=["']race_name["'][^>]*>([\s\S]*?)<\/td>/i);
    const numMatch = row.match(/alt=["'](\d+)レース["']/i);

    if (cnameMatch && stakesMatch) {
      const cleanedTag = stakesMatch[1]
        .replace(/<span[^>]*class=["'][^"']*grade[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
      const raceName = cleanRaceName(cleanedTag);
      const raceNumber = numMatch ? parseInt(numMatch[1], 10) : undefined;
      races.push({
        raceNumber,
        raceName,
        detailCname: cnameMatch[1],
      });
    }
  }

  return races;
}
