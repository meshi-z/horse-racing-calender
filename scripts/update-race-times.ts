import fs from 'node:fs';
import path from 'node:path';
import {
  fetchConfirmedRaceTimes,
  raceNameMatches,
  toIsoUtc,
  ConfirmedRaceTime,
} from './lib/jra-syutsuba';

export interface RaceOutput {
  id: string;
  organization: string;
  country_code?: string;
  name: {
    ja: string;
    en: string;
    fr?: string;
    zh?: string;
  };
  grade: string;
  date: string;
  start_time: string;
  is_time_confirmed: boolean;
  is_rescheduled?: boolean;
  original_date?: string;
  course: {
    ja: string;
    en: string;
  };
  distance: number;
  track_type: 'turf' | 'dirt' | 'obstacle' | 'banei' | 'aw';
  sex_constraint: 'none' | 'filly_and_mare' | 'colt_and_filly';
  age_constraint: '2yo' | '3yo' | '4yo' | '3yo_and_up' | '4yo_and_up';
  handicap: {
    code: 'weight_for_age' | 'special_weight' | 'set_weight' | 'handicap';
    ja: string;
    en: string;
  };
}

/**
 * 各競馬主催者（JRA, NAR, 海外等）ごとの出馬表・確定時刻取得プロバイダー
 */
export interface RaceTimeFetcher {
  readonly organization: string;
  /**
   * 基準日をもとに、この組織の直近開催ウィンドウ（確認対象）となるレース群を抽出
   */
  getTargetWindowRaces(races: RaceOutput[], refDate: string): RaceOutput[];
  /**
   * 確定発走予定時刻を取得
   */
  fetchConfirmedTimes(targetRaces: RaceOutput[]): Promise<ConfirmedRaceTime[]>;
}

/**
 * 基準日 (YYYY-MM-DD) からJRAの当週開催期間（木曜〜翌月曜）の範囲を算出
 */
export function getJraUpcomingWeekendRange(refDateStr: string): { startDate: string; endDate: string } {
  const [y, m, d] = refDateStr.split('-').map(Number);
  const ref = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = ref.getUTCDay(); // 0: 日, 1: 月, ..., 4: 木, 5: 金, 6: 土

  let daysToThursday = 0;
  if (dayOfWeek === 0) daysToThursday = -3; // 日曜 -> 直前の木曜
  else if (dayOfWeek === 1) daysToThursday = -4; // 月曜 -> 直前の木曜
  else if (dayOfWeek === 2) daysToThursday = 2; // 火曜 -> 次の木曜
  else if (dayOfWeek === 3) daysToThursday = 1; // 水曜 -> 次の木曜
  else if (dayOfWeek === 4) daysToThursday = 0; // 木曜
  else if (dayOfWeek === 5) daysToThursday = -1; // 金曜 -> 木曜
  else if (dayOfWeek === 6) daysToThursday = -2; // 土曜 -> 木曜

  const thursday = new Date(ref.getTime() + daysToThursday * 86400000);
  const nextMonday = new Date(thursday.getTime() + 4 * 86400000);

  const formatYmd = (dt: Date) => {
    const yr = dt.getUTCFullYear();
    const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const da = String(dt.getUTCDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  return {
    startDate: formatYmd(thursday),
    endDate: formatYmd(nextMonday),
  };
}

/**
 * 基準日 (YYYY-MM-DD) からNARの当週開催期間（基準日〜7日間）の範囲を算出
 */
export function getNarUpcomingWindowRange(refDateStr: string, windowDays = 7): { startDate: string; endDate: string } {
  const [y, m, d] = refDateStr.split('-').map(Number);
  const ref = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(ref.getTime() + (windowDays - 1) * 86400000);

  const formatYmd = (dt: Date) => {
    const yr = dt.getUTCFullYear();
    const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const da = String(dt.getUTCDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  return {
    startDate: formatYmd(ref),
    endDate: formatYmd(end),
  };
}

/**
 * JRA（中央競馬）向けプロバイダー実装
 */
export class JraRaceTimeFetcher implements RaceTimeFetcher {
  readonly organization = 'jra';

  getTargetWindowRaces(races: RaceOutput[], refDate: string): RaceOutput[] {
    const { startDate, endDate } = getJraUpcomingWeekendRange(refDate);
    return races.filter(
      (r) =>
        r.organization === this.organization &&
        ((r.date >= startDate && r.date <= endDate) ||
          (r.original_date && r.original_date >= startDate && r.original_date <= endDate))
    );
  }

  async fetchConfirmedTimes(_targetRaces: RaceOutput[]): Promise<ConfirmedRaceTime[]> {
    return await fetchConfirmedRaceTimes();
  }
}

/**
 * NAR（地方競馬）向けプロバイダー実装
 */
export class NarRaceTimeFetcher implements RaceTimeFetcher {
  readonly organization = 'nar';
  private localFixturePath?: string;
  private raceListFixtures?: Record<string, string>;

  constructor(options?: { localFixturePath?: string; raceListFixtures?: Record<string, string> }) {
    this.localFixturePath = options?.localFixturePath;
    this.raceListFixtures = options?.raceListFixtures;
  }

  getTargetWindowRaces(races: RaceOutput[], refDate: string): RaceOutput[] {
    const { startDate, endDate } = getNarUpcomingWindowRange(refDate);
    return races.filter(
      (r) =>
        r.organization === this.organization &&
        ((r.date >= startDate && r.date <= endDate) ||
          (r.original_date && r.original_date >= startDate && r.original_date <= endDate))
    );
  }

  async fetchConfirmedTimes(targetRaces: RaceOutput[]): Promise<ConfirmedRaceTime[]> {
    const year = targetRaces.length > 0 ? Number(targetRaces[0].date.slice(0, 4)) : new Date().getFullYear();
    const { fetchNarConfirmedRaceTimes } = await import('./lib/nar-syutsuba');
    return await fetchNarConfirmedRaceTimes({
      year,
      localFixturePath: this.localFixturePath,
      raceListFixtures: this.raceListFixtures,
      targetRaces,
    });
  }
}

/**
 * 基準日 (YYYY-MM-DD) からフランス競馬の確認対象期間（基準日〜7日間）の範囲を算出
 */
export function getFranceUpcomingWindowRange(refDateStr: string, windowDays = 7): { startDate: string; endDate: string } {
  const [y, m, d] = refDateStr.split('-').map(Number);
  const ref = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(ref.getTime() + (windowDays - 1) * 86400000);

  const formatYmd = (dt: Date) => {
    const yr = dt.getUTCFullYear();
    const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const da = String(dt.getUTCDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  return {
    startDate: formatYmd(ref),
    endDate: formatYmd(end),
  };
}

/**
 * フランス競馬（France Galop）向けプロバイダー実装
 */
export class FranceRaceTimeFetcher implements RaceTimeFetcher {
  readonly organization = 'france_galop';
  private fixtures?: Record<string, import('./lib/france-syutsuba').PmuProgrammeResponse>;

  constructor(options?: { fixtures?: Record<string, import('./lib/france-syutsuba').PmuProgrammeResponse> }) {
    this.fixtures = options?.fixtures;
  }

  getTargetWindowRaces(races: RaceOutput[], refDate: string): RaceOutput[] {
    const { startDate, endDate } = getFranceUpcomingWindowRange(refDate);
    return races.filter(
      (r) =>
        r.organization === this.organization &&
        ((r.date >= startDate && r.date <= endDate) ||
          (r.original_date && r.original_date >= startDate && r.original_date <= endDate))
    );
  }

  async fetchConfirmedTimes(targetRaces: RaceOutput[]): Promise<ConfirmedRaceTime[]> {
    const { fetchFranceConfirmedRaceTimes } = await import('./lib/france-syutsuba');
    return await fetchFranceConfirmedRaceTimes({
      targetRaces,
      fixtures: this.fixtures,
    });
  }
}

/**
 * 基準日 (YYYY-MM-DD) からイギリスの当週開催期間（基準日〜7日間）の範囲を算出
 */
export function getUkUpcomingWindowRange(refDateStr: string, windowDays = 7): { startDate: string; endDate: string } {
  const [y, m, d] = refDateStr.split('-').map(Number);
  const ref = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(ref.getTime() + (windowDays - 1) * 86400000);

  const formatYmd = (dt: Date) => {
    const yr = dt.getUTCFullYear();
    const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const da = String(dt.getUTCDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  return {
    startDate: formatYmd(ref),
    endDate: formatYmd(end),
  };
}

/**
 * イギリス競馬（BHA）向けプロバイダー実装
 */
export class UkRaceTimeFetcher implements RaceTimeFetcher {
  readonly organization = 'bha';
  private fixtures?: Record<string, import('./lib/uk-syutsuba').SportingLifeMeetingItem[]>;

  constructor(options?: { fixtures?: Record<string, import('./lib/uk-syutsuba').SportingLifeMeetingItem[]> }) {
    this.fixtures = options?.fixtures;
  }

  getTargetWindowRaces(races: RaceOutput[], refDate: string): RaceOutput[] {
    const { startDate, endDate } = getUkUpcomingWindowRange(refDate);
    return races.filter(
      (r) =>
        r.organization === this.organization &&
        ((r.date >= startDate && r.date <= endDate) ||
          (r.original_date && r.original_date >= startDate && r.original_date <= endDate))
    );
  }

  async fetchConfirmedTimes(targetRaces: RaceOutput[]): Promise<ConfirmedRaceTime[]> {
    const { fetchUkConfirmedRaceTimes } = await import('./lib/uk-syutsuba');
    return await fetchUkConfirmedRaceTimes({
      targetRaces,
      fixtures: this.fixtures,
    });
  }
}

/**
 * 基準日 (YYYY-MM-DD) からアメリカの当週開催期間（基準日〜7日間）の範囲を算出
 */
export function getUsUpcomingWindowRange(refDateStr: string, windowDays = 7): { startDate: string; endDate: string } {
  const [y, m, d] = refDateStr.split('-').map(Number);
  const ref = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(ref.getTime() + (windowDays - 1) * 86400000);

  const formatYmd = (dt: Date) => {
    const yr = dt.getUTCFullYear();
    const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const da = String(dt.getUTCDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  return {
    startDate: formatYmd(ref),
    endDate: formatYmd(end),
  };
}

/**
 * アメリカ競馬（Equibase）向けプロバイダー実装
 */
export class UsRaceTimeFetcher implements RaceTimeFetcher {
  readonly organization = 'equibase';
  private fixtures?: Record<string, import('./lib/us-syutsuba').EquibaseRaceItem[]>;

  constructor(options?: { fixtures?: Record<string, import('./lib/us-syutsuba').EquibaseRaceItem[]> }) {
    this.fixtures = options?.fixtures;
  }

  getTargetWindowRaces(races: RaceOutput[], refDate: string): RaceOutput[] {
    const { startDate, endDate } = getUsUpcomingWindowRange(refDate);
    return races.filter(
      (r) =>
        r.organization === this.organization &&
        ((r.date >= startDate && r.date <= endDate) ||
          (r.original_date && r.original_date >= startDate && r.original_date <= endDate))
    );
  }

  async fetchConfirmedTimes(targetRaces: RaceOutput[]): Promise<ConfirmedRaceTime[]> {
    const { fetchUsConfirmedRaceTimes } = await import('./lib/us-syutsuba');
    return await fetchUsConfirmedRaceTimes({
      targetRaces,
      fixtures: this.fixtures,
    });
  }
}

/**
 * 基準日 (YYYY-MM-DD) から香港の当週開催期間（基準日〜7日間）の範囲を算出
 */
export function getHkUpcomingWindowRange(refDateStr: string, windowDays = 7): { startDate: string; endDate: string } {
  const [y, m, d] = refDateStr.split('-').map(Number);
  const ref = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(ref.getTime() + (windowDays - 1) * 86400000);

  const formatYmd = (dt: Date) => {
    const yr = dt.getUTCFullYear();
    const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const da = String(dt.getUTCDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  return {
    startDate: formatYmd(ref),
    endDate: formatYmd(end),
  };
}

/**
 * 香港競馬（HKJC）向けプロバイダー実装
 */
export class HkRaceTimeFetcher implements RaceTimeFetcher {
  readonly organization = 'hkjc';
  private fixtures?: Record<string, import('./lib/hk-syutsuba').HkjcRaceItem[] | string>;

  constructor(options?: { fixtures?: Record<string, import('./lib/hk-syutsuba').HkjcRaceItem[] | string> }) {
    this.fixtures = options?.fixtures;
  }

  getTargetWindowRaces(races: RaceOutput[], refDate: string): RaceOutput[] {
    const { startDate, endDate } = getHkUpcomingWindowRange(refDate);
    return races.filter(
      (r) =>
        r.organization === this.organization &&
        ((r.date >= startDate && r.date <= endDate) ||
          (r.original_date && r.original_date >= startDate && r.original_date <= endDate))
    );
  }

  async fetchConfirmedTimes(targetRaces: RaceOutput[]): Promise<ConfirmedRaceTime[]> {
    const { fetchHkConfirmedRaceTimes } = await import('./lib/hk-syutsuba');
    return await fetchHkConfirmedRaceTimes({
      targetRaces,
      fixtures: this.fixtures,
    });
  }
}

/**
 * 登録済みフェッチャープロバイダーのマップ（JRA, NAR, France, UK, US, HK対応）
 */
export const DEFAULT_FETCHERS: Record<string, RaceTimeFetcher> = {
  jra: new JraRaceTimeFetcher(),
  nar: new NarRaceTimeFetcher(),
  france_galop: new FranceRaceTimeFetcher(),
  bha: new UkRaceTimeFetcher(),
  uk: new UkRaceTimeFetcher(),
  equibase: new UsRaceTimeFetcher(),
  us: new UsRaceTimeFetcher(),
  hkjc: new HkRaceTimeFetcher(),
  hk: new HkRaceTimeFetcher(),
};

export interface UpdateOptions {
  dryRun?: boolean;
  force?: boolean;
  organization?: string; // 特定の組織のみ実行する場合（例: 'jra'）
  referenceDate?: string; // YYYY-MM-DD (JST)
  filePath?: string;
  fetchers?: Record<string, RaceTimeFetcher>; // テスト等で注入可能
  confirmedTimes?: ConfirmedRaceTime[]; // テスト用直接注入（全Fetcher共通フォールバック）
}

export interface UpdatedRaceItem {
  id: string;
  name: string;
  date: string;
  oldTime: string;
  newTime: string;
  isRescheduled?: boolean;
  originalDate?: string;
}

export interface UpdateResult {
  totalRaces: number;
  updatedRaces: UpdatedRaceItem[];
  orgResults: Record<string, { targetCount: number; skippedDueToConfirmed: boolean; updatedCount: number }>;
}

/**
 * races.json を更新するメイン関数
 */
export async function updateRaceTimes(options: UpdateOptions = {}): Promise<UpdateResult> {
  const filePath = options.filePath || path.resolve(process.cwd(), 'public/data/races.json');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Races data file not found at: ${filePath}`);
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const races: RaceOutput[] = JSON.parse(rawData);

  // 1. 基準日の決定 (JST)
  let refDateStr = options.referenceDate;
  if (!refDateStr) {
    const nowJst = new Date(Date.now() + 9 * 3600 * 1000);
    const yr = nowJst.getUTCFullYear();
    const mo = String(nowJst.getUTCMonth() + 1).padStart(2, '0');
    const da = String(nowJst.getUTCDate()).padStart(2, '0');
    refDateStr = `${yr}-${mo}-${da}`;
  }

  const fetchersMap = options.fetchers || DEFAULT_FETCHERS;
  const targetOrgs = options.organization
    ? [options.organization.toLowerCase()]
    : Object.keys(fetchersMap);

  const updatedRaces: UpdatedRaceItem[] = [];
  const orgResults: UpdateResult['orgResults'] = {};

  // 2. 組織ごとにプロバイダーを実行
  for (const org of targetOrgs) {
    const fetcher = fetchersMap[org];
    if (!fetcher) {
      console.warn(`[Update Race Times] No fetcher provider registered for organization: "${org}". Skipping.`);
      continue;
    }

    console.log(`\n--- Processing organization: [${org.toUpperCase()}] ---`);
    const targetWindowRaces = fetcher.getTargetWindowRaces(races, refDateStr);
    console.log(`[Update Race Times][${org}] Found ${targetWindowRaces.length} race(s) in active window.`);

    // 早期終了ガード（相手先サーバー負荷軽減）
    if (targetWindowRaces.length > 0 && !options.force) {
      const allAlreadyConfirmed = targetWindowRaces.every((r) => r.is_time_confirmed);
      if (allAlreadyConfirmed) {
        console.log(
          `[Update Race Times][${org}] All ${targetWindowRaces.length} race(s) in window are already confirmed.`
        );
        console.log(`[Update Race Times][${org}] Skipping remote requests to minimize server load. (Use --force to override)`);
        orgResults[org] = {
          targetCount: targetWindowRaces.length,
          skippedDueToConfirmed: true,
          updatedCount: 0,
        };
        continue;
      }
    }

    // 確定時刻の取得
    let confirmedTimes: ConfirmedRaceTime[];
    if (options.confirmedTimes) {
      confirmedTimes = options.confirmedTimes;
    } else {
      confirmedTimes = await fetcher.fetchConfirmedTimes(targetWindowRaces);
    }

    if (confirmedTimes.length === 0) {
      console.log(`[Update Race Times][${org}] No confirmed race times retrieved.`);
      orgResults[org] = {
        targetCount: targetWindowRaces.length,
        skippedDueToConfirmed: false,
        updatedCount: 0,
      };
      continue;
    }

    let orgUpdatedCount = 0;

    // 該当組織のレースに対して更新適用
    for (const race of races) {
      if (race.organization !== org) continue;

      // 1. 同日での一致を優先検索（raceIdの一致またはレース名一致）
      let match = confirmedTimes.find((c) => {
        if (c.raceId && c.raceId === race.id) return true;
        return c.date === race.date && raceNameMatches(race.name.ja, c.raceName);
      });

      // 2. 同日で見つからない場合、代替開催（同名レースで近傍日程）の候補を検索
      let isRescheduled = false;
      if (!match) {
        const candidate = confirmedTimes.find((c) => {
          const isNameOrIdMatch = (c.raceId && c.raceId === race.id) || raceNameMatches(race.name.ja, c.raceName);
          if (!isNameOrIdMatch) return false;
          // 日付の差分をチェック (7日以内)
          const raceTime = new Date(race.date).getTime();
          const scrapedTime = new Date(c.date).getTime();
          const diffDays = Math.abs((scrapedTime - raceTime) / 86400000);
          return diffDays <= 7;
        });

        if (candidate) {
          match = candidate;
          isRescheduled = true;
        }
      }

      if (match) {
        const isDateChanged = race.date !== match.date;
        const targetDate = match.date;
        const newUtcTime = match.utcIso || toIsoUtc(targetDate, match.timeJst);
        const isTimeChanged = race.start_time !== newUtcTime;
        const wasNotConfirmed = !race.is_time_confirmed;

        if (isTimeChanged || wasNotConfirmed || isDateChanged) {
          const oldTime = race.start_time;
          const oldDate = race.date;

          if (isDateChanged) {
            race.original_date = race.original_date || oldDate;
            race.date = targetDate;
            race.is_rescheduled = true;
          }

          race.start_time = newUtcTime;
          race.is_time_confirmed = true;

          updatedRaces.push({
            id: race.id,
            name: race.name.ja,
            date: race.date,
            oldTime,
            newTime: newUtcTime,
            isRescheduled: isDateChanged || isRescheduled,
            originalDate: race.original_date,
          });
          orgUpdatedCount++;

          console.log(
            `[Update Race Times][${org}] UPDATED: [${race.date}] ${race.name.ja} (${race.id})` +
              (isDateChanged ? `\n  - Rescheduled from: ${race.original_date} -> ${race.date}` : '') +
              `\n  - Old Time: ${oldTime} (confirmed: ${wasNotConfirmed ? 'false' : 'true'})` +
              `\n  - New Time: ${newUtcTime} (confirmed: true, ${match.timeJst} JST)`
          );
        }
      }
    }

    orgResults[org] = {
      targetCount: targetWindowRaces.length,
      skippedDueToConfirmed: false,
      updatedCount: orgUpdatedCount,
    };
  }

  // 3. 保存
  if (updatedRaces.length > 0) {
    if (options.dryRun) {
      console.log(`\n[Update Race Times] Dry-run mode: ${updatedRaces.length} race(s) would be updated, but not written to file.`);
    } else {
      fs.writeFileSync(filePath, JSON.stringify(races, null, 2) + '\n', 'utf-8');
      console.log(`\n[Update Race Times] Successfully written ${updatedRaces.length} updated race(s) to ${filePath}`);
    }
  } else {
    console.log('\n[Update Race Times] No race updates needed. All matching races already up-to-date.');
  }

  return {
    totalRaces: races.length,
    updatedRaces,
    orgResults,
  };
}

// CLI エントリポイント
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const orgArg = args.find((a) => a.startsWith('--org='));
  const orgIdx = args.indexOf('--org');
  const organization = orgArg ? orgArg.split('=')[1] : (orgIdx !== -1 && args[orgIdx + 1] ? args[orgIdx + 1] : undefined);
  const dateArg = args.find((a) => a.startsWith('--date='));
  const dateIdx = args.indexOf('--date');
  const referenceDate = dateArg ? dateArg.split('=')[1] : (dateIdx !== -1 && args[dateIdx + 1] ? args[dateIdx + 1] : undefined);

  try {
    const result = await updateRaceTimes({
      dryRun,
      force,
      organization,
      referenceDate,
    });
    console.log(`[Update Race Times] Done. Total updated races: ${result.updatedRaces.length}`);
  } catch (err) {
    console.error('[Update Race Times] Error:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('update-race-times.ts')) {
  main();
}
