import fs from 'node:fs';
import path from 'node:path';
import type { RaceOutput } from '../parse-races';

export interface RacesIndex {
  years: number[];
  defaultYear: number;
  totalRaces: number;
  generatedAt: string;
  yearCounts: Record<number, number>;
}

/**
 * レースデータを年度（YYYY）ごとにグルーピングし、
 * 年度別JSON（races-YYYY.json）、インデックス（index.json）、および結合版（races.json）を同期書き出しする
 */
export function syncShardedRaceFiles(
  races: RaceOutput[],
  dataDir: string
): { index: RacesIndex; shards: Record<number, RaceOutput[]> } {
  fs.mkdirSync(dataDir, { recursive: true });

  // 1. 年度ごとにレースをグルーピング
  const shards: Record<number, RaceOutput[]> = {};
  const yearCounts: Record<number, number> = {};

  for (const race of races) {
    const yearStr = race.date.slice(0, 4);
    const year = parseInt(yearStr, 10);
    const validYear = isNaN(year) ? 2026 : year;

    if (!shards[validYear]) {
      shards[validYear] = [];
    }
    shards[validYear].push(race);
  }

  // ソート
  const years = Object.keys(shards)
    .map(Number)
    .sort((a, b) => a - b);

  for (const y of years) {
    shards[y].sort((a, b) => {
      return (
        a.date.localeCompare(b.date) ||
        (a.start_time || '').localeCompare(b.start_time || '') ||
        (a.organization || '').localeCompare(b.organization || '') ||
        a.id.localeCompare(b.id)
      );
    });
    yearCounts[y] = shards[y].length;
  }

  // 2. 年度別ファイル (races-YYYY.json) の出力
  for (const y of years) {
    const shardPath = path.join(dataDir, `races-${y}.json`);
    fs.writeFileSync(shardPath, JSON.stringify(shards[y], null, 2) + '\n', 'utf-8');
  }

  // 3. インデックスファイル (index.json) の出力
  const defaultYear = years.includes(2026) ? 2026 : years[0] || 2026;
  const index: RacesIndex = {
    years,
    defaultYear,
    totalRaces: races.length,
    generatedAt: new Date().toISOString(),
    yearCounts,
  };
  const indexPath = path.join(dataDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf-8');

  // 4. 完全な後方互換性のため、結合版 (races.json) も常に出力・同期
  const combinedPath = path.join(dataDir, 'races.json');
  // 結合版も同様にソート
  const sortedRaces = [...races].sort((a, b) => {
    return (
      a.date.localeCompare(b.date) ||
      (a.start_time || '').localeCompare(b.start_time || '') ||
      (a.organization || '').localeCompare(b.organization || '') ||
      a.id.localeCompare(b.id)
    );
  });
  fs.writeFileSync(combinedPath, JSON.stringify(sortedRaces, null, 2) + '\n', 'utf-8');

  console.log(`[Sharding] Successfully synced sharded race files for years: [${years.join(', ')}] in ${dataDir}`);
  return { index, shards };
}
