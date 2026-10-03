import { cleanNarRaceName } from './nar-syutsuba';
import type { RaceWinner } from '../update-race-times';

export interface NarParsedResult {
  raceName: string;
  course?: string;
  raceNo?: number;
  winner: {
    horseName: string;
    horseNumber?: number;
    jockey?: string;
    time?: string;
  };
}

/**
 * NAR公式競走成績HTML（RaceMarkTable, 払戻・着順表）から勝ち馬情報をパース
 */
export function parseNarRaceResultHtml(html: string): NarParsedResult[] {
  const results: NarParsedResult[] = [];

  // レース名ブロック
  // パターンA (推奨): <section class="raceTitle"><h3>第７３回 日本テレビ盃...</h3></section>
  let defaultRaceName = '';
  const raceTitleSecMatch = html.match(/<section[^>]*class=["'][^"']*raceTitle[^"']*["'][^>]*>[\s\S]*?<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
  if (raceTitleSecMatch) {
    defaultRaceName = cleanNarRaceName(raceTitleSecMatch[1]);
  }

  if (!defaultRaceName) {
    const raceNameMatch =
      html.match(/<(?:div|h[1-4]|td|span)[^>]*class=["'][^"']*(?:racename|race_name)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|h[1-4]|td|span)>/i) ||
      html.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i);
    if (raceNameMatch) {
      defaultRaceName = cleanNarRaceName(raceNameMatch[1]);
    }
  }

  // 1着行の抽出
  // NARの着順表行: <tr> <td>1</td> <td>5</td> <td>5</td> <td class="horse">グランブリッジ</td> <td class="jockey">川田 将雅</td> ... <td>2:14.2</td> </tr>
  const trMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

  for (const trMatch of trMatches) {
    const row = trMatch[1];

    // 着順が 1 または 01
    const rankMatch =
      row.match(/<td[^>]*class=["'][^"']*(?:rank|order|place)[^"']*["'][^>]*>\s*(?:1|01)\s*<\/td>/i) ||
      row.match(/<td[^>]*>\s*(?:1|01)\s*<\/td>/i);
    if (!rankMatch) continue;

    // 馬番
    let horseNumber: number | undefined;
    const numMatch =
      row.match(/<td[^>]*class=["'][^"']*(?:num|umaban|horse_num)[^"']*["'][^>]*>\s*(\d{1,2})\s*<\/td>/i) ||
      row.match(/<td[^>]*>\s*(\d{1,2})\s*<\/td>/g);
    if (numMatch) {
      if (Array.isArray(numMatch) && numMatch.length >= 3) {
        // 通常 [0]=着順, [1]=枠番, [2]=馬番
        const rawNum = numMatch[2].replace(/<[^>]+>/g, '').trim();
        const parsedNum = parseInt(rawNum, 10);
        if (!isNaN(parsedNum)) horseNumber = parsedNum;
      } else if (typeof numMatch[1] === 'string') {
        horseNumber = parseInt(numMatch[1], 10);
      }
    }

    // 馬名
    let horseName = '';
    const horseMatch =
      row.match(/<td[^>]*class=["'][^"']*(?:horse|bamei|horse_name)[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
      row.match(/<td[^>]*class=["'][^"']*(?:horse|bamei|horse_name)[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
    if (horseMatch) {
      horseName = horseMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // 騎手
    let jockey: string | undefined;
    const jockeyMatch =
      row.match(/<td[^>]*class=["'][^"']*(?:jockey|kishu)[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
    if (jockeyMatch) {
      // <span>（JRA）</span> 等の所属タグや不要タグを除去
      let rawJockey = jockeyMatch[1]
        .replace(/<span[^>]*>[\s\S]*?<\/span>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/[（\(][^）\)]*[）\)]/g, '') // （JRA）や（船橋）等を除去
        .replace(/\s+/g, ' ')
        .trim();
      if (rawJockey) {
        // NAR特有の騎手略記（例: 戸崎圭 -> 戸崎圭太）の正規化
        if (rawJockey === '戸崎圭') rawJockey = '戸崎圭太';
        jockey = rawJockey;
      }
    }

    // タイム
    let time: string | undefined;
    const timeMatch = row.match(/<td[^>]*class=["'][^"']*(?:time|record)[^"']*["'][^>]*>([\s\S]*?)<\/td>/i) ||
      row.match(/<td[^>]*>\s*(\d{1,2}:\d{2}\.\d)\s*<\/td>/i);
    if (timeMatch) {
      const raw = timeMatch[1].replace(/<[^>]+>/g, '').trim();
      if (/^\d{1,2}:\d{2}\.\d$/.test(raw)) {
        time = raw;
      }
    }

    if (horseName) {
      results.push({
        raceName: defaultRaceName,
        winner: {
          horseName,
          horseNumber,
          jockey,
          time,
        },
      });
      break;
    }
  }

  return results;
}

/**
 * NARパース結果から RaceWinner を構築
 * 一次ソース原則および空値原則（Null Value Principle）に基づき、
 * 公式一次ソースに存在しない英語馬名・騎手名は推測生成せず未設定とする。
 */
export function buildNarRaceWinner(parsed: NarParsedResult['winner']): RaceWinner {
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
