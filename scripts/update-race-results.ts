import fs from 'node:fs';
import path from 'node:path';
import type { RaceOutput, RaceWinner } from './parse-races';

/**
 * 各競馬主催者ごとのレースリザルト（勝ち馬・着順）取得プロバイダー
 */
export interface RaceResultFetcher {
  readonly organization: string;
  /**
   * 基準日をもとに、結果取得対象となる過去レース（直近終了レース）を抽出
   */
  getTargetPastRaces(races: RaceOutput[], refDate: string): RaceOutput[];
  /**
   * 対象レースの着順確定結果（勝ち馬情報）を取得
   */
  fetchResults(targetRaces: RaceOutput[]): Promise<Map<string, RaceWinner>>;
}

/**
 * 基準日 (YYYY-MM-DD) から直近過去ウィンドウ（直近7日間）の終了レースを抽出
 */
export function getRecentPastRaces(races: RaceOutput[], refDate: string, daysAgo = 7): RaceOutput[] {
  const [y, m, d] = refDate.split('-').map(Number);
  const ref = new Date(Date.UTC(y, m - 1, d, 23, 59, 59));
  const pastLimit = new Date(ref.getTime() - daysAgo * 86400000);

  const formatYmd = (dt: Date) => {
    const yr = dt.getUTCFullYear();
    const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const da = String(dt.getUTCDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const startDateStr = formatYmd(pastLimit);

  return races.filter((race) => {
    return race.date <= refDate && race.date >= startDateStr;
  });
}

/**
 * JRA用 レース結果取得プロバイダー（基本実装）
 */
export class JraRaceResultFetcher implements RaceResultFetcher {
  readonly organization = 'jra';

  getTargetPastRaces(races: RaceOutput[], refDate: string): RaceOutput[] {
    const pastWindowRaces = getRecentPastRaces(races, refDate, 7);
    return pastWindowRaces.filter((r) => r.organization === 'jra' && !r.winner);
  }

  async fetchResults(_targetRaces: RaceOutput[]): Promise<Map<string, RaceWinner>> {
    const results = new Map<string, RaceWinner>();
    // 将来のJRA公式/出馬表結果スクレイピングやAPI連携に対応
    // 現在は登録済みマスタ等からの解決またはスタブ
    return results;
  }
}

/**
 * コマンドライン引数をパース
 */
export function parseArgs(argv: string[] = process.argv.slice(2)): {
  refDate: string;
  orgFilter?: string;
  dryRun: boolean;
  force: boolean;
} {
  let refDate = new Date().toISOString().slice(0, 10);
  let orgFilter: string | undefined;
  let dryRun = false;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--date' && argv[i + 1]) {
      refDate = argv[++i];
    } else if (arg === '--org' && argv[i + 1]) {
      orgFilter = argv[++i].toLowerCase();
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--force') {
      force = true;
    }
  }

  return { refDate, orgFilter, dryRun, force };
}

/**
 * レースリザルト（勝ち馬）の更新メイン処理
 */
export async function updateRaceResults(options: {
  racesPath: string;
  winnersMasterPath: string;
  refDate: string;
  orgFilter?: string;
  dryRun?: boolean;
  providers?: RaceResultFetcher[];
}): Promise<{ totalTargets: number; updatedCount: number; updatedRaces: Array<{ id: string; name: string; winner: RaceWinner }> }> {
  const {
    racesPath,
    winnersMasterPath,
    refDate,
    orgFilter,
    dryRun = false,
    providers = [new JraRaceResultFetcher()],
  } = options;

  if (!fs.existsSync(racesPath)) {
    throw new Error(`Races file not found: ${racesPath}`);
  }

  const races: RaceOutput[] = JSON.parse(fs.readFileSync(racesPath, 'utf8'));

  // 既存の winners マスタを読み込み
  let winnersMaster: Record<string, RaceWinner> = {};
  if (fs.existsSync(winnersMasterPath)) {
    try {
      winnersMaster = JSON.parse(fs.readFileSync(winnersMasterPath, 'utf8'));
    } catch (e) {
      console.warn(`[Warning] Could not parse winners master: ${(e as Error).message}`);
    }
  }

  let totalTargets = 0;
  let updatedCount = 0;
  const updatedRaces: Array<{ id: string; name: string; winner: RaceWinner }> = [];

  for (const provider of providers) {
    if (orgFilter && provider.organization !== orgFilter) {
      continue;
    }

    console.log(`\n--- Checking results for organization: [${provider.organization.toUpperCase()}] ---`);
    const targets = provider.getTargetPastRaces(races, refDate);
    totalTargets += targets.length;
    console.log(`[Update Race Results][${provider.organization}] Found ${targets.length} target race(s) in past window.`);

    if (targets.length === 0) continue;

    const fetchedResults = await provider.fetchResults(targets);

    for (const target of targets) {
      const winner = fetchedResults.get(target.id) || winnersMaster[target.id];
      if (winner && !target.winner) {
        target.winner = winner;
        winnersMaster[target.id] = winner;
        updatedCount++;
        updatedRaces.push({ id: target.id, name: target.name.ja, winner });
        console.log(`[Update Race Results][${target.organization}] UPDATED: [${target.date}] ${target.name.ja} (${target.id}) -> Winner: ${winner.name.ja}`);
      }
    }
  }

  if (updatedCount > 0 && !dryRun) {
    fs.writeFileSync(racesPath, JSON.stringify(races, null, 2), 'utf8');
    fs.writeFileSync(winnersMasterPath, JSON.stringify(winnersMaster, null, 2), 'utf8');
    console.log(`\n[Update Race Results] Successfully saved ${updatedCount} updated winner(s) to ${racesPath} and ${winnersMasterPath}`);
  } else if (dryRun) {
    console.log(`\n[Update Race Results] Dry-run mode: No files were modified.`);
  }

  return { totalTargets, updatedCount, updatedRaces };
}

async function main() {
  const { refDate, orgFilter, dryRun } = parseArgs();
  console.log(`Starting race results update for refDate: ${refDate} (org: ${orgFilter || 'all'}, dryRun: ${dryRun})`);

  const rootDir = process.cwd();
  const racesPath = path.join(rootDir, 'public', 'data', 'races.json');
  const winnersMasterPath = path.join(rootDir, 'src', 'data', 'race_winners.json');

  const result = await updateRaceResults({
    racesPath,
    winnersMasterPath,
    refDate,
    orgFilter,
    dryRun,
  });

  console.log(`Finished: ${result.updatedCount}/${result.totalTargets} races updated.`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('update-race-results.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
