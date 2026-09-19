import fs from 'node:fs';
import path from 'node:path';
import {
  fetchConfirmedRaceTimes,
  raceNameMatches,
  toIsoUtc,
  ConfirmedRaceTime,
} from './lib/jra-syutsuba';

interface RaceOutput {
  id: string;
  organization: string;
  name: {
    ja: string;
    en: string;
  };
  grade: string;
  date: string;
  start_time: string;
  is_time_confirmed: boolean;
  course: {
    ja: string;
    en: string;
  };
  distance: number;
  track_type: 'turf' | 'dirt' | 'obstacle';
  sex_constraint: 'none' | 'filly_and_mare' | 'colt_and_filly';
  age_constraint: '2yo' | '3yo' | '3yo_and_up' | '4yo_and_up';
  handicap: {
    code: 'weight_for_age' | 'special_weight' | 'set_weight' | 'handicap';
    ja: string;
    en: string;
  };
}

export interface UpdateOptions {
  dryRun?: boolean;
  force?: boolean;
  referenceDate?: string; // YYYY-MM-DD (JST)
  filePath?: string;
  confirmedTimes?: ConfirmedRaceTime[]; // テスト等で外部から注入可能
}

/**
 * 基準日 (YYYY-MM-DD) からその週の木曜〜月曜（出馬表発表〜開催終了）の範囲を算出
 */
export function getUpcomingWeekendRange(refDateStr: string): { startDate: string; endDate: string } {
  const [y, m, d] = refDateStr.split('-').map(Number);
  const ref = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = ref.getUTCDay(); // 0: 日, 1: 月, ..., 4: 木, 5: 金, 6: 土

  // 木曜日を基準に当週の開催期間を決定
  // 木(4), 金(5), 土(6), 日(0), 月(1) はその週の開催期間内
  // 火(2), 水(3) は今週末の木曜〜月曜を狙う
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
 * races.json を更新するメイン関数
 */
export async function updateRaceTimes(options: UpdateOptions = {}): Promise<{
  totalRaces: number;
  updatedRaces: Array<{ id: string; name: string; date: string; oldTime: string; newTime: string }>;
  skippedDueToConfirmed: boolean;
}> {
  const filePath = options.filePath || path.resolve(process.cwd(), 'public/data/races.json');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Races data file not found at: ${filePath}`);
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const races: RaceOutput[] = JSON.parse(rawData);

  // 1. 基準日の決定 (JST)
  let refDateStr = options.referenceDate;
  if (!refDateStr) {
    // 現在のJST日付 (UTC + 9h)
    const nowJst = new Date(Date.now() + 9 * 3600 * 1000);
    const yr = nowJst.getUTCFullYear();
    const mo = String(nowJst.getUTCMonth() + 1).padStart(2, '0');
    const da = String(nowJst.getUTCDate()).padStart(2, '0');
    refDateStr = `${yr}-${mo}-${da}`;
  }

  const { startDate, endDate } = getUpcomingWeekendRange(refDateStr);
  console.log(`[Update Race Times] Target date range for this week: ${startDate} to ${endDate} (reference: ${refDateStr})`);

  // 当週範囲のレースを抽出
  const weekendRaces = races.filter((r) => r.date >= startDate && r.date <= endDate);
  console.log(`[Update Race Times] Found ${weekendRaces.length} race(s) in this week's window.`);

  // 2. 早期終了ガード（相手先サーバー負荷軽減）
  if (weekendRaces.length > 0 && !options.force) {
    const allAlreadyConfirmed = weekendRaces.every((r) => r.is_time_confirmed);
    if (allAlreadyConfirmed) {
      console.log(
        `[Update Race Times] All ${weekendRaces.length} race(s) in this week's window are already confirmed.`
      );
      console.log('[Update Race Times] Skipping JRA requests to minimize server load. (Use --force to override)');
      return {
        totalRaces: races.length,
        updatedRaces: [],
        skippedDueToConfirmed: true,
      };
    }
  }

  // 3. JRAから確定時刻を取得（外部注入がある場合はそれを使用）
  const confirmedTimes = options.confirmedTimes ?? (await fetchConfirmedRaceTimes());
  if (confirmedTimes.length === 0) {
    console.log('[Update Race Times] No confirmed race times retrieved from JRA. No changes made.');
    return {
      totalRaces: races.length,
      updatedRaces: [],
      skippedDueToConfirmed: false,
    };
  }

  // 4. races.json の該当レースを更新
  const updatedRaces: Array<{ id: string; name: string; date: string; oldTime: string; newTime: string }> = [];

  for (const race of races) {
    // 日付とレース名で突合
    const match = confirmedTimes.find(
      (c) => c.date === race.date && raceNameMatches(race.name.ja, c.raceName)
    );

    if (match) {
      const newUtcTime = toIsoUtc(race.date, match.timeJst);
      const isTimeChanged = race.start_time !== newUtcTime;
      const wasNotConfirmed = !race.is_time_confirmed;

      if (isTimeChanged || wasNotConfirmed) {
        const oldTime = race.start_time;
        race.start_time = newUtcTime;
        race.is_time_confirmed = true;

        updatedRaces.push({
          id: race.id,
          name: race.name.ja,
          date: race.date,
          oldTime,
          newTime: newUtcTime,
        });

        console.log(
          `[Update Race Times] UPDATED: [${race.date}] ${race.name.ja} (${race.id})` +
            `\n  - Old Time: ${oldTime} (confirmed: ${wasNotConfirmed ? 'false' : 'true'})` +
            `\n  - New Time: ${newUtcTime} (confirmed: true, ${match.timeJst} JST)`
        );
      }
    }
  }

  // 5. 保存
  if (updatedRaces.length > 0) {
    if (options.dryRun) {
      console.log(`[Update Race Times] Dry-run mode: ${updatedRaces.length} race(s) would be updated, but not written to file.`);
    } else {
      fs.writeFileSync(filePath, JSON.stringify(races, null, 2) + '\n', 'utf-8');
      console.log(`[Update Race Times] Successfully written ${updatedRaces.length} updated race(s) to ${filePath}`);
    }
  } else {
    console.log('[Update Race Times] No race updates needed. All matching races already up-to-date.');
  }

  return {
    totalRaces: races.length,
    updatedRaces,
    skippedDueToConfirmed: false,
  };
}

// CLI エントリポイント
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const dateArg = args.find((a) => a.startsWith('--date='));
  const referenceDate = dateArg ? dateArg.split('=')[1] : undefined;

  try {
    const result = await updateRaceTimes({
      dryRun,
      force,
      referenceDate,
    });
    console.log(`[Update Race Times] Done. Updated: ${result.updatedRaces.length}`);
  } catch (err) {
    console.error('[Update Race Times] Error:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('update-race-times.ts')) {
  main();
}
