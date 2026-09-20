import * as fs from 'fs';
import * as path from 'path';
import {
  NAR_BABA_CODES,
  cleanNarRaceName,
  parseNarRaceListHtml,
  fetchWithRetry,
} from './lib/nar-syutsuba.js';
import { raceNameMatches, toIsoUtc } from './lib/jra-syutsuba.js';

interface RaceItem {
  id: string;
  name: {
    ja: string;
    en: string;
    fr?: string;
  };
  organization: string;
  grade: string;
  date: string;
  start_time: string;
  is_time_confirmed?: boolean;
  course: {
    ja: string;
    en: string;
    fr?: string;
  };
  [key: string]: any;
}

export interface BackfillOptions {
  racesFilePath?: string;
  beforeDate?: string;
  year?: string;
  delayMs?: number;
  dryRun?: boolean;
  limit?: number;
  baseUrl?: string;
}

export async function runNarBackfill(options: BackfillOptions = {}) {
  const racesPath = options.racesFilePath || path.resolve(process.cwd(), 'public/data/races.json');
  const todayStr = new Date().toISOString().split('T')[0];
  const beforeDate = options.beforeDate || todayStr;
  const targetYear = options.year;
  const delayMs = options.delayMs ?? 400;
  const dryRun = options.dryRun ?? false;
  const baseUrl = options.baseUrl || 'https://www.keiba.go.jp';

  console.log(`[Backfill NAR] Loading races from: ${racesPath}`);
  const racesRaw = fs.readFileSync(racesPath, 'utf8');
  const races: RaceItem[] = JSON.parse(racesRaw);

  // 対象となる過去の未確定NARレースを抽出
  const targets = races.filter((race) => {
    if (race.organization !== 'nar') return false;
    if (race.date > beforeDate) return false;
    if (targetYear && !race.date.startsWith(targetYear)) return false;
    return !race.is_time_confirmed;
  });

  console.log(`[Backfill NAR] Found ${targets.length} unconfirmed past NAR race(s) before ${beforeDate}${targetYear ? ` in year ${targetYear}` : ''}.`);
  if (targets.length === 0) {
    console.log('[Backfill NAR] No races to backfill.');
    return { total: 0, updated: 0, failed: 0 };
  }

  const raceList = options.limit ? targets.slice(0, options.limit) : targets;

  // (date, babaCode) でグループ化
  const groupMap = new Map<string, { date: string; babaCode: string; races: RaceItem[] }>();
  for (const race of raceList) {
    const rawBabaCode = NAR_BABA_CODES[race.course.ja];
    if (rawBabaCode === undefined) {
      console.warn(`[Backfill NAR] Unknown babaCode for course: "${race.course.ja}" (Race: ${race.name.ja}, ID: ${race.id})`);
      continue;
    }
    const babaCode = String(rawBabaCode);
    const key = `${race.date}_${babaCode}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, { date: race.date, babaCode, races: [] });
    }
    groupMap.get(key)!.races.push(race);
  }

  console.log(`[Backfill NAR] Total ${groupMap.size} distinct (date, track) page(s) to fetch with ${delayMs}ms interval.`);

  let updatedCount = 0;
  let failedCount = 0;
  let groupIndex = 0;

  for (const [key, group] of groupMap.entries()) {
    groupIndex++;
    const [datePart, babaCode] = key.split('_');
    const [y, m, d] = datePart.split('-');
    const raceDateParam = `${y}%2F${m}%2F${d}`;
    const url = `${baseUrl}/KeibaWeb/TodayRaceInfo/RaceList?k_raceDate=${raceDateParam}&k_babaCode=${babaCode}`;

    if (groupIndex > 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    console.log(`[Backfill NAR] (${groupIndex}/${groupMap.size}) Fetching ${datePart} [track ${babaCode}] (${group.races.map(r => r.name.ja).join(', ')})...`);

    try {
      const res = await fetchWithRetry(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!res.ok) {
        console.warn(`[Backfill NAR] HTTP ${res.status} for ${url}`);
        failedCount += group.races.length;
        continue;
      }

      const html = await res.text();
      const parsedRaces = parseNarRaceListHtml(html, datePart);
      for (const targetRace of group.races) {
        const cleanTarget = cleanNarRaceName(targetRace.name.ja);
        const match = parsedRaces.find((pr) => {
          const cleanPr = cleanNarRaceName(pr.raceName);
          if (
            raceNameMatches(cleanTarget, cleanPr) ||
            cleanPr.includes(cleanTarget) ||
            cleanTarget.includes(cleanPr)
          ) {
            return true;
          }

          // 文字数制限による末尾カットやカップ省略に対応
          const targetPrefix = cleanTarget.slice(0, Math.min(cleanTarget.length, 6));
          if (targetPrefix.length >= 4 && cleanPr.includes(targetPrefix)) {
            return true;
          }

          const simplifiedTarget = cleanTarget
            .replace(/カップ/g, 'カ')
            .replace(/ナイター賞/g, 'ナイタ');
          if (cleanPr.includes(simplifiedTarget) || simplifiedTarget.includes(cleanPr)) {
            return true;
          }

          return false;
        });

        if (match && match.timeJst) {
          const oldTime = targetRace.start_time;
          const newIsoUtc = toIsoUtc(targetRace.date, match.timeJst);
          targetRace.start_time = newIsoUtc;
          targetRace.is_time_confirmed = true;
          updatedCount++;
          console.log(`  ✓ UPDATED: [${targetRace.date} ${targetRace.course.ja}] ${targetRace.name.ja}`);
          console.log(`    Old: ${oldTime} (confirmed: false) -> New: ${newIsoUtc} (${match.timeJst} JST, confirmed: true)`);
        } else {
          console.warn(`  ✗ NOT FOUND: [${targetRace.date} ${targetRace.course.ja}] ${targetRace.name.ja} in ${parsedRaces.length} race(s) on ${datePart}`);
          failedCount++;
        }
      }
    } catch (err) {
      console.error(`[Backfill NAR] Error fetching ${url}: ${(err as Error).message}`);
      failedCount += group.races.length;
    }
  }

  console.log('\n[Backfill NAR] ==============================');
  console.log(`[Backfill NAR] Total targets: ${raceList.length}`);
  console.log(`[Backfill NAR] Successfully updated: ${updatedCount}`);
  console.log(`[Backfill NAR] Unmatched / Failed: ${failedCount}`);
  console.log('[Backfill NAR] ==============================\n');

  if (updatedCount > 0 && !dryRun) {
    fs.writeFileSync(racesPath, JSON.stringify(races, null, 2) + '\n', 'utf8');
    console.log(`[Backfill NAR] Successfully written ${updatedCount} updated race(s) to ${racesPath}`);
  } else if (dryRun) {
    console.log('[Backfill NAR] Dry-run mode: file write skipped.');
  }

  return { total: raceList.length, updated: updatedCount, failed: failedCount };
}

// CLI direct execution
if (process.argv[1] && process.argv[1].endsWith('backfill-nar-past-times.ts')) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const beforeArg = args.find((a) => a.startsWith('--before='));
  const beforeDate = beforeArg ? beforeArg.split('=')[1] : undefined;
  const yearArg = args.find((a) => a.startsWith('--year='));
  const year = yearArg ? yearArg.split('=')[1] : undefined;
  const delayArg = args.find((a) => a.startsWith('--delay='));
  const delayMs = delayArg ? parseInt(delayArg.split('=')[1], 10) : 400;
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

  runNarBackfill({ dryRun, beforeDate, year, delayMs, limit }).catch((err) => {
    console.error('[Backfill NAR] Fatal error:', err);
    process.exit(1);
  });
}
