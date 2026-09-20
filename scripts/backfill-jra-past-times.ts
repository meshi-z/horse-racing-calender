import * as fs from 'fs';
import * as path from 'path';
import { toIsoUtc } from './lib/jra-syutsuba.js';

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

interface JraMasterEntry {
  id: string;
  date: string;
  name: string;
  course: string;
  grade: string;
  timeJst: string;
}

export interface BackfillJraOptions {
  racesFilePath?: string;
  masterFilePath?: string;
  beforeDate?: string;
  dryRun?: boolean;
}

export async function runJraBackfill(options: BackfillJraOptions = {}) {
  const racesPath = options.racesFilePath || path.resolve(process.cwd(), 'public/data/races.json');
  const masterPath = options.masterFilePath || path.resolve(process.cwd(), 'src/data/jra_past_times_2026.json');
  const todayStr = new Date().toISOString().split('T')[0];
  const beforeDate = options.beforeDate || todayStr;
  const dryRun = options.dryRun ?? false;

  console.log(`[Backfill JRA] Loading races from: ${racesPath}`);
  const racesRaw = fs.readFileSync(racesPath, 'utf8');
  const races: RaceItem[] = JSON.parse(racesRaw);

  console.log(`[Backfill JRA] Loading master from: ${masterPath}`);
  const masterRaw = fs.readFileSync(masterPath, 'utf8');
  const master: Record<string, JraMasterEntry> = JSON.parse(masterRaw);

  const targets = races.filter((race) => {
    if (race.organization !== 'jra') return false;
    if (race.date > beforeDate) return false;
    return !race.is_time_confirmed;
  });

  console.log(`[Backfill JRA] Found ${targets.length} unconfirmed past JRA race(s) before ${beforeDate}.`);
  if (targets.length === 0) {
    console.log('[Backfill JRA] No races to backfill.');
    return { total: 0, updated: 0, failed: 0 };
  }

  let updatedCount = 0;
  let failedCount = 0;

  for (const race of targets) {
    const key = `${race.date}_${race.name.ja}`;
    const entry = master[key] || Object.values(master).find(m => m.id === race.id || (m.date === race.date && m.name === race.name.ja));

    if (entry && entry.timeJst) {
      const oldTime = race.start_time;
      const newIsoUtc = toIsoUtc(race.date, entry.timeJst);
      race.start_time = newIsoUtc;
      race.is_time_confirmed = true;
      updatedCount++;
      console.log(`  ✓ UPDATED: [${race.date} ${race.course.ja}] ${race.name.ja}`);
      console.log(`    Old: ${oldTime} (confirmed: false) -> New: ${newIsoUtc} (${entry.timeJst} JST, confirmed: true)`);
    } else {
      console.warn(`  ✗ NOT FOUND IN MASTER: [${race.date} ${race.course.ja}] ${race.name.ja} (ID: ${race.id})`);
      failedCount++;
    }
  }

  console.log('\n[Backfill JRA] ==============================');
  console.log(`[Backfill JRA] Total targets: ${targets.length}`);
  console.log(`[Backfill JRA] Successfully updated: ${updatedCount}`);
  console.log(`[Backfill JRA] Missing in master: ${failedCount}`);
  console.log('[Backfill JRA] ==============================\n');

  if (updatedCount > 0 && !dryRun) {
    fs.writeFileSync(racesPath, JSON.stringify(races, null, 2) + '\n', 'utf8');
    console.log(`[Backfill JRA] Successfully written ${updatedCount} updated race(s) to ${racesPath}`);
  } else if (dryRun) {
    console.log('[Backfill JRA] Dry-run mode: file write skipped.');
  }

  return { total: targets.length, updated: updatedCount, failed: failedCount };
}

// CLI direct execution
if (process.argv[1] && process.argv[1].endsWith('backfill-jra-past-times.ts')) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const beforeArg = args.find((a) => a.startsWith('--before='));
  const beforeDate = beforeArg ? beforeArg.split('=')[1] : undefined;

  runJraBackfill({ dryRun, beforeDate }).catch((err) => {
    console.error('[Backfill JRA] Fatal error:', err);
    process.exit(1);
  });
}
