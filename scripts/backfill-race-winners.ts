import fs from 'node:fs';
import path from 'node:path';
import type { RaceOutput, RaceWinner } from './parse-races';
import {
  DEFAULT_RESULT_FETCHERS,
  type RaceResultFetcher,
} from './update-race-results';

export interface BackfillWinnersOptions {
  racesPath?: string;
  winnersMasterPath?: string;
  beforeDate?: string;
  fromDate?: string;
  orgFilter?: string;
  gradeFilter?: string;
  dryRun?: boolean;
  force?: boolean;
  delayMs?: number;
  limit?: number;
  providers?: RaceResultFetcher[];
}

export interface BackfillWinnersResult {
  totalTargetRaces: number;
  updatedCount: number;
  alreadyHadWinnerCount: number;
  skippedFutureCount: number;
  updatedRaces: Array<{ id: string; name: string; org: string; date: string; winner: RaceWinner }>;
  statsByOrg: Record<string, { total: number; updated: number; skipped: number }>;
}

/**
 * バックフィル対象となる過去レースを抽出
 * - beforeDate以前（デフォルト: 2026-09-27）
 * - fromDate以降（デフォルト: 2026-01-01）
 * - 未来日付のレースは除外
 * - 既に勝者が設定されているレースは force でない限り除外
 */
export function getPastRacesForBackfill(
  races: RaceOutput[],
  options: {
    beforeDate?: string;
    fromDate?: string;
    orgFilter?: string;
    gradeFilter?: string;
    force?: boolean;
  } = {}
): {
  targets: RaceOutput[];
  alreadyHadWinnerCount: number;
  skippedFutureCount: number;
} {
  const todayYmd = new Date().toISOString().slice(0, 10);
  const beforeDate = options.beforeDate || (todayYmd < '2026-09-27' ? todayYmd : '2026-09-27');
  const fromDate = options.fromDate || '2026-01-01';
  const orgFilter = options.orgFilter?.toLowerCase();
  const gradeFilter = options.gradeFilter?.toUpperCase();
  const force = options.force ?? false;

  let alreadyHadWinnerCount = 0;
  let skippedFutureCount = 0;
  const targets: RaceOutput[] = [];

  for (const race of races) {
    // 未来レースは絶対にスキップ（安全ガード）
    if (race.date > beforeDate) {
      skippedFutureCount++;
      continue;
    }

    if (race.date < fromDate) {
      continue;
    }

    if (orgFilter && race.organization.toLowerCase() !== orgFilter) {
      continue;
    }

    if (gradeFilter && race.grade.toUpperCase() !== gradeFilter) {
      continue;
    }

    if (race.winner && !force) {
      alreadyHadWinnerCount++;
      continue;
    }

    targets.push(race);
  }

  return { targets, alreadyHadWinnerCount, skippedFutureCount };
}

/**
 * 過去全重賞レース結果（勝ち馬）の包括的バックフィル処理
 */
export async function backfillRaceWinners(
  options: BackfillWinnersOptions = {}
): Promise<BackfillWinnersResult> {
  const rootDir = process.cwd();
  const racesPath = options.racesPath || path.join(rootDir, 'public', 'data', 'races.json');
  const winnersMasterPath = options.winnersMasterPath || path.join(rootDir, 'src', 'data', 'race_winners.json');
  const dryRun = options.dryRun ?? false;
  const force = options.force ?? false;
  const limit = options.limit;

  if (!fs.existsSync(racesPath)) {
    throw new Error(`Races file not found: ${racesPath}`);
  }

  const races: RaceOutput[] = JSON.parse(fs.readFileSync(racesPath, 'utf8'));

  // 永続マスタを読み込み
  let winnersMaster: Record<string, RaceWinner> = {};
  if (fs.existsSync(winnersMasterPath)) {
    try {
      winnersMaster = JSON.parse(fs.readFileSync(winnersMasterPath, 'utf8'));
    } catch (e) {
      console.warn(`[Backfill Winners] Warning: Could not parse winners master: ${(e as Error).message}`);
    }
  }

  const { targets: allTargets, alreadyHadWinnerCount, skippedFutureCount } = getPastRacesForBackfill(
    races,
    {
      beforeDate: options.beforeDate,
      fromDate: options.fromDate,
      orgFilter: options.orgFilter,
      gradeFilter: options.gradeFilter,
      force,
    }
  );

  const targets = limit ? allTargets.slice(0, limit) : allTargets;

  console.log(`[Backfill Winners] Found ${allTargets.length} target race(s) to backfill (already resolved: ${alreadyHadWinnerCount}, future skipped: ${skippedFutureCount}).`);
  if (limit && limit < allTargets.length) {
    console.log(`[Backfill Winners] Limit applied: processing first ${limit} race(s).`);
  }

  const statsByOrg: Record<string, { total: number; updated: number; skipped: number }> = {};
  for (const t of targets) {
    if (!statsByOrg[t.organization]) {
      statsByOrg[t.organization] = { total: 0, updated: 0, skipped: 0 };
    }
    statsByOrg[t.organization].total++;
  }

  let updatedCount = 0;
  const updatedRaces: Array<{ id: string; name: string; org: string; date: string; winner: RaceWinner }> = [];

  // 各プロバイダーからフェッチを試行（ライブまたはフィクスチャ）
  const providers = options.providers || Object.values(DEFAULT_RESULT_FETCHERS).filter(
    (v, idx, arr) => arr.findIndex((t) => t.organization === v.organization) === idx
  );

  // プロバイダーごとにターゲットをグループ化
  for (const provider of providers) {
    const orgTargets = targets.filter(
      (r) => r.organization === provider.organization || (provider.organization === 'bha' && r.organization === 'uk') || (provider.organization === 'equibase' && r.organization === 'us')
    );
    if (orgTargets.length === 0) continue;

    console.log(`\n[Backfill Winners] Resolving results for [${provider.organization.toUpperCase()}]: ${orgTargets.length} race(s)...`);

    let liveResults = new Map<string, RaceWinner>();
    try {
      // プロバイダーがフェッチに対応している場合（タイムアウトやエラー時はフォールバック）
      liveResults = await provider.fetchResults(orgTargets);
    } catch (e) {
      console.warn(`[Backfill Winners][${provider.organization}] Live fetch failed or skipped, falling back to master: ${(e as Error).message}`);
    }

    for (const target of orgTargets) {
      const liveWinner = liveResults.get(target.id);
      const masterWinner = winnersMaster[target.id];
      const resolvedWinner = liveWinner || masterWinner;

      if (resolvedWinner) {
        target.winner = resolvedWinner;
        winnersMaster[target.id] = resolvedWinner;
        updatedCount++;
        statsByOrg[target.organization].updated++;
        updatedRaces.push({
          id: target.id,
          name: target.name.ja || target.name.en,
          org: target.organization,
          date: target.date,
          winner: resolvedWinner,
        });
      } else {
        statsByOrg[target.organization].skipped++;
      }
    }
  }

  // プロバイダーでカバーされなかったターゲット（または追加の主催者）もマスターから解決
  for (const target of targets) {
    if (target.winner && !force) continue;
    if (updatedRaces.some((u) => u.id === target.id)) continue;

    const masterWinner = winnersMaster[target.id];
    if (masterWinner) {
      target.winner = masterWinner;
      updatedCount++;
      if (!statsByOrg[target.organization]) {
        statsByOrg[target.organization] = { total: 0, updated: 0, skipped: 0 };
      }
      statsByOrg[target.organization].updated++;
      updatedRaces.push({
        id: target.id,
        name: target.name.ja || target.name.en,
        org: target.organization,
        date: target.date,
        winner: masterWinner,
      });
    } else {
      if (statsByOrg[target.organization]) {
        statsByOrg[target.organization].skipped++;
      }
    }
  }

  console.log('\n[Backfill Winners] ==============================');
  console.log(`[Backfill Winners] Total targets processed: ${targets.length}`);
  console.log(`[Backfill Winners] Successfully updated: ${updatedCount}`);
  console.log(`[Backfill Winners] Already had winner: ${alreadyHadWinnerCount}`);
  console.log(`[Backfill Winners] Future races preserved: ${skippedFutureCount}`);
  console.log('[Backfill Winners] Breakdown by organization:');
  for (const [org, stat] of Object.entries(statsByOrg)) {
    console.log(`  - ${org.toUpperCase()}: ${stat.updated}/${stat.total} updated (skipped/unresolved: ${stat.skipped})`);
  }
  console.log('[Backfill Winners] ==============================\n');

  if (updatedCount > 0 && !dryRun) {
    fs.writeFileSync(racesPath, JSON.stringify(races, null, 2) + '\n', 'utf8');
    fs.writeFileSync(winnersMasterPath, JSON.stringify(winnersMaster, null, 2) + '\n', 'utf8');
    console.log(`[Backfill Winners] Dual persistence successful: updated ${racesPath} and ${winnersMasterPath}`);
  } else if (dryRun) {
    console.log('[Backfill Winners] Dry-run mode: file write skipped.');
  }

  return {
    totalTargetRaces: targets.length,
    updatedCount,
    alreadyHadWinnerCount,
    skippedFutureCount,
    updatedRaces,
    statsByOrg,
  };
}

/**
 * コマンドライン引数をパース
 */
export function parseArgs(argv: string[] = process.argv.slice(2)): BackfillWinnersOptions {
  const options: BackfillWinnersOptions = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--date' && argv[i + 1]) {
      options.beforeDate = argv[++i];
    } else if (arg === '--from' && argv[i + 1]) {
      options.fromDate = argv[++i];
    } else if (arg === '--org' && argv[i + 1]) {
      options.orgFilter = argv[++i];
    } else if (arg === '--grade' && argv[i + 1]) {
      options.gradeFilter = argv[++i];
    } else if (arg === '--limit' && argv[i + 1]) {
      options.limit = parseInt(argv[++i], 10);
    } else if (arg === '--delay' && argv[i + 1]) {
      options.delayMs = parseInt(argv[++i], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  console.log('[Backfill Winners] Starting past race winners backfill pipeline...');
  await backfillRaceWinners(options);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('backfill-race-winners.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
