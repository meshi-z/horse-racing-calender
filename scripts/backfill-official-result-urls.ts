import fs from 'node:fs';
import path from 'node:path';
import type { RaceOutput } from './parse-races';

export interface BackfillOptions {
  racesPath?: string;
  officialResultsPath?: string;
  dryRun?: boolean;
}

export interface BackfillResult {
  totalRaces: number;
  backfilledCount: number;
  updatedRaces: Array<{ id: string; name: string; officialUrl: string }>;
}

/**
 * 確定済み過去レースに対する公式リザルトURLのバックフィル処理 (Issue #159)
 * 
 * 一次ソースで実在が確認された公式結果URL（src/data/official_results_urls.json）をもとに、
 * public/data/races.json の対象レースの official_url を設定・更新する。
 * 未検証のレースについては一次ソース原則および空値原則に従い、架空URLの補完を行わず undefined を保持する。
 */
export function backfillOfficialResultUrls(options: BackfillOptions = {}): BackfillResult {
  const rootDir = process.cwd();
  const racesPath = options.racesPath || path.join(rootDir, 'public', 'data', 'races.json');
  const officialResultsPath = options.officialResultsPath || path.join(rootDir, 'src', 'data', 'official_results_urls.json');
  const dryRun = options.dryRun ?? false;

  if (!fs.existsSync(racesPath)) {
    throw new Error(`Races file not found: ${racesPath}`);
  }
  if (!fs.existsSync(officialResultsPath)) {
    throw new Error(`Official results file not found: ${officialResultsPath}`);
  }

  const races: RaceOutput[] = JSON.parse(fs.readFileSync(racesPath, 'utf8'));
  const officialResultsUrls: Record<string, string> = JSON.parse(fs.readFileSync(officialResultsPath, 'utf8'));

  const updatedRaces: Array<{ id: string; name: string; officialUrl: string }> = [];

  for (const race of races) {
    const verifiedUrl = officialResultsUrls[race.id];
    if (verifiedUrl) {
      if (race.official_url !== verifiedUrl) {
        race.official_url = verifiedUrl;
        updatedRaces.push({
          id: race.id,
          name: race.name.ja,
          officialUrl: verifiedUrl,
        });
      }
    } else if (race.official_url) {
      // 未検証・不確実なURLをクリーンアップして空値（undefined）に戻す (Issue #176)
      delete race.official_url;
      updatedRaces.push({
        id: race.id,
        name: race.name.ja,
        officialUrl: '(removed)',
      });
    }
  }

  if (updatedRaces.length > 0 && !dryRun) {
    fs.writeFileSync(racesPath, JSON.stringify(races, null, 2), 'utf8');
    console.log(`[Backfill] Successfully updated ${updatedRaces.length} races in ${racesPath}`);
  } else if (dryRun) {
    console.log(`[Backfill] Dry-run: ${updatedRaces.length} races would be updated.`);
  } else {
    console.log(`[Backfill] No races needed backfill (already up-to-date).`);
  }

  return {
    totalRaces: races.length,
    backfilledCount: updatedRaces.length,
    updatedRaces,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const result = backfillOfficialResultUrls({ dryRun });
  console.log(`Backfill finished: ${result.backfilledCount} / ${result.totalRaces} races updated.`);
  for (const item of result.updatedRaces) {
    console.log(` - [${item.id}] ${item.name} -> ${item.officialUrl}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('backfill-official-result-urls.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
