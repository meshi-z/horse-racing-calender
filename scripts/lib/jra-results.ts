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
