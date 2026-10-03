import fs from 'node:fs';
import path from 'node:path';
import type { RaceOutput, RaceWinner } from './parse-races';
import { fetchWithRetry, raceNameMatches } from './lib/jra-syutsuba';
import { frenchRaceMatches } from './lib/france-syutsuba';
import { ukRaceMatches } from './lib/uk-syutsuba';
import { parseJraRaceResultHtml, buildJraRaceWinner } from './lib/jra-results';
import { parseNarRaceResultHtml, buildNarRaceWinner } from './lib/nar-results';
import { NAR_BABA_CODES, cleanNarRaceName } from './lib/nar-syutsuba';
import {
  parsePmuResultsJson,
  parseSportingLifeResultsJson,
  parseHkjcResultHtml,
  parseEquibaseResultHtml,
  type PmuProgrammeResultResponse,
  type SportingLifeResultMeetingItem,
} from './lib/foreign-results';

export type { RaceOutput, RaceWinner };

export interface RaceResultRecord {
  winner: RaceWinner;
  resultUrl?: string;
}

/**
 * JRA G1公式レース結果アーカイブ実在URLマッピング (一次ソース検証済み)
 */
export const JRA_G1_RESULT_URLS: Record<string, string> = {
  '2026-jra-g1-01': 'https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html',
  '2026-jra-g1-02': 'https://www.jra.go.jp/datafile/seiseki/g1/takamatsu/result/takamatsu2026.html',
  '2026-jra-g1-03': 'https://www.jra.go.jp/datafile/seiseki/g1/osaka/result/osaka2026.html',
  '2026-jra-g1-04': 'https://www.jra.go.jp/datafile/seiseki/g1/ouka/result/ouka2026.html',
  '2026-jra-jg1-01': 'https://www.jra.go.jp/datafile/seiseki/g1/ngj/result/ngj2026.html',
  '2026-jra-g1-05': 'https://www.jra.go.jp/datafile/seiseki/g1/satsuki/result/satsuki2026.html',
  '2026-jra-g1-06': 'https://www.jra.go.jp/datafile/seiseki/g1/haruten/result/haruten2026.html',
  '2026-jra-g1-07': 'https://www.jra.go.jp/datafile/seiseki/g1/nmc/result/nmc2026.html',
  '2026-jra-g1-08': 'https://www.jra.go.jp/datafile/seiseki/g1/victoria/result/victoria2026.html',
  '2026-jra-g1-09': 'https://www.jra.go.jp/datafile/seiseki/g1/oaks/result/oaks2026.html',
  '2026-jra-g1-10': 'https://www.jra.go.jp/datafile/seiseki/g1/derby/result/derby2026.html',
  '2026-jra-g1-11': 'https://www.jra.go.jp/datafile/seiseki/g1/yasuda/result/yasuda2026.html',
  '2026-jra-g1-12': 'https://www.jra.go.jp/datafile/seiseki/g1/takara/result/takara2026.html',
  '2026-jra-g1-13': 'https://www.jra.go.jp/datafile/seiseki/g1/sprint/result/sprint2026.html',
};

/**
 * 各競馬主催者ごとのレースリザルト（勝ち馬・着順）取得プロバイダー
 */
export interface RaceResultFetcher {
  readonly organization: string;
  /**
   * 基準日をもとに、結果取得対象となる過去レース（発走済み終了レース）を抽出
   */
  getTargetPastRaces(races: RaceOutput[], refDate: string, options?: { refTimeIso?: string; daysAgo?: number; force?: boolean }): RaceOutput[];
  /**
   * 対象レースの着順確定結果（勝ち馬情報）を取得
   */
  fetchResults(targetRaces: RaceOutput[]): Promise<Map<string, RaceWinner>>;
  /**
   * 対象レースの着順確定結果および公式結果URLを取得 (Issue #159)
   */
  fetchResultRecords?(targetRaces: RaceOutput[]): Promise<Map<string, RaceResultRecord>>;
}

/**
 * 基準日および現在時刻から、結果取得対象となるレース（発走から15分以上経過した終了レース）を抽出
 */
export function getTargetPastRacesForResults(
  races: RaceOutput[],
  refDate: string,
  options?: {
    refTimeIso?: string;
    daysAgo?: number;
    force?: boolean;
  }
): RaceOutput[] {
  const { refTimeIso, daysAgo = 3, force = false } = options || {};
  const now = refTimeIso ? new Date(refTimeIso) : new Date();

  const [y, m, d] = refDate.split('-').map(Number);
  const refEndOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59));
  const pastLimit = new Date(refEndOfDay.getTime() - daysAgo * 86400000);

  const formatYmd = (dt: Date) => {
    const yr = dt.getUTCFullYear();
    const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const da = String(dt.getUTCDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const pastLimitStr = formatYmd(pastLimit);
  const fifteenMinutesAgoMs = now.getTime() - 15 * 60 * 1000;

  return races.filter((race) => {
    // 既に勝者が登録されていて、強制更新 (--force) でない場合は除外
    if (race.winner && !force) {
      return false;
    }

    // 日付ウィンドウチェック (直近 daysAgo 日前から基準日まで)
    if (race.date > refDate || race.date < pastLimitStr) {
      return false;
    }

    // 発走済みチェック
    if (race.start_time) {
      const startTimeMs = new Date(race.start_time).getTime();
      // start_time が有効な日時の場合、発走から15分以上経過しているか
      if (!isNaN(startTimeMs)) {
        return startTimeMs <= fifteenMinutesAgoMs;
      }
    }

    // 発走時刻が未設定またはNaNの場合:
    // 過去日であれば終了済みとみなす。当日の場合は夕方以降（JST 17:00 / UTC 08:00）であれば対象
    if (race.date < refDate) {
      return true;
    }

    // race.date === refDate の当日レース
    const isLateInDay = now.getUTCHours() >= 8; // JST 17:00以降
    return isLateInDay;
  });
}

/**
 * 過去互換用ヘルパー関数
 */
export function getRecentPastRaces(races: RaceOutput[], refDate: string, daysAgo = 7): RaceOutput[] {
  return getTargetPastRacesForResults(races, refDate, { daysAgo, force: true });
}

// ==========================================
// プロバイダー実装クラス群
// ==========================================

/**
 * JRA用 レース結果取得プロバイダー
 */
export class JraRaceResultFetcher implements RaceResultFetcher {
  readonly organization = 'jra';
  private fixtures?: Record<string, string>;

  constructor(options?: { fixtures?: Record<string, string> }) {
    this.fixtures = options?.fixtures;
  }

  getTargetPastRaces(races: RaceOutput[], refDate: string, options?: { refTimeIso?: string; daysAgo?: number; force?: boolean }): RaceOutput[] {
    const targets = getTargetPastRacesForResults(races, refDate, options);
    return targets.filter((r) => r.organization === this.organization);
  }

  async fetchResultRecords(targetRaces: RaceOutput[]): Promise<Map<string, RaceResultRecord>> {
    const results = new Map<string, RaceResultRecord>();
    if (targetRaces.length === 0) return results;

    for (const target of targetRaces) {
      let html: string | null = null;
      let resultUrl: string | undefined = JRA_G1_RESULT_URLS[target.id];

      if (this.fixtures && this.fixtures[target.id]) {
        html = this.fixtures[target.id];
      } else if (this.fixtures && this.fixtures[target.date]) {
        html = this.fixtures[target.date];
      } else {
        // JRA公式サイトの結果URL等から取得を試行
        try {
          const url = `https://www.jra.go.jp/keiba/thisweek/`;
          const res = await fetchWithRetry(url);
          if (res.ok) {
            html = await res.text();
            if (!resultUrl) {
              resultUrl = url;
            }
          }
        } catch (e) {
          console.warn(`[JRA Results] Failed to fetch live results for ${target.name.ja}: ${(e as Error).message}`);
        }
      }

      if (html) {
        const parsedList = parseJraRaceResultHtml(html);
        for (const item of parsedList) {
          if (raceNameMatches(target.name.ja, item.raceName) || !item.raceName) {
            const winner = buildJraRaceWinner(item.winner);
            results.set(target.id, { winner, resultUrl });
            break;
          }
        }
      }
    }

    return results;
  }

  async fetchResults(targetRaces: RaceOutput[]): Promise<Map<string, RaceWinner>> {
    const records = await this.fetchResultRecords(targetRaces);
    const winners = new Map<string, RaceWinner>();
    for (const [id, rec] of records.entries()) {
      winners.set(id, rec.winner);
    }
    return winners;
  }
}

/**
 * NAR（地方競馬）用 レース結果取得プロバイダー
 */
export class NarRaceResultFetcher implements RaceResultFetcher {
  readonly organization = 'nar';
  private fixtures?: Record<string, string>;

  constructor(options?: { fixtures?: Record<string, string> }) {
    this.fixtures = options?.fixtures;
  }

  getTargetPastRaces(races: RaceOutput[], refDate: string, options?: { refTimeIso?: string; daysAgo?: number; force?: boolean }): RaceOutput[] {
    const targets = getTargetPastRacesForResults(races, refDate, options);
    return targets.filter((r) => r.organization === this.organization);
  }

  async fetchResultRecords(targetRaces: RaceOutput[]): Promise<Map<string, RaceResultRecord>> {
    const results = new Map<string, RaceResultRecord>();
    if (targetRaces.length === 0) return results;

    for (const target of targetRaces) {
      let html: string | null = null;
      let resultUrl: string | undefined;

      if (this.fixtures && this.fixtures[target.id]) {
        html = this.fixtures[target.id];
      } else if (this.fixtures && this.fixtures[target.date]) {
        html = this.fixtures[target.date];
      } else {
        // NAR公式サイト (keiba.go.jp) からライブフェッチ
        try {
          const courseJa = target.course?.ja || '';
          const babaCode = NAR_BABA_CODES[courseJa];
          if (!babaCode) {
            console.warn(`[NAR Results] Unknown baba code for course "${courseJa}" (race: ${target.name.ja})`);
            continue;
          }

          const [y, m, d] = target.date.split('-');
          const formattedDate = `${y}%2f${m}%2f${d}`;
          const raceListUrl = `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?k_raceDate=${formattedDate}&k_babaCode=${babaCode}`;
          const listRes = await fetchWithRetry(raceListUrl);
          if (listRes.ok) {
            const listHtml = await listRes.text();
            // 出馬表から対象レースの k_raceNo を抽出
            const linkMatches = listHtml.matchAll(/(?:DebaTable|RaceMarkTable)\?[^\s"'>]*k_raceNo=(\d+)[^\s"'>]*[>][\s\S]*?<\/a>/gi);
            let matchedRaceNo: string | null = null;

            for (const match of linkMatches) {
              const raceNo = match[1];
              const fullAnchor = match[0];
              const textMatch = fullAnchor.match(/>([^<]+)<\/a>/);
              if (textMatch) {
                const cleanedName = cleanNarRaceName(textMatch[1]);
                if (raceNameMatches(target.name.ja, cleanedName) || cleanedName.includes(target.name.ja) || target.name.ja.includes(cleanedName)) {
                  matchedRaceNo = raceNo;
                  break;
                }
              }
            }

            if (matchedRaceNo) {
              const markUrl = `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceMarkTable?k_raceDate=${formattedDate}&k_raceNo=${matchedRaceNo}&k_babaCode=${babaCode}`;
              const markRes = await fetchWithRetry(markUrl);
              if (markRes.ok) {
                html = await markRes.text();
                resultUrl = markUrl;
              }
            }
          }
        } catch (e) {
          console.warn(`[NAR Results] Failed to live-fetch results for ${target.name.ja} (${target.date}): ${(e as Error).message}`);
        }
      }

      if (html) {
        const parsedList = parseNarRaceResultHtml(html);
        for (const item of parsedList) {
          if (raceNameMatches(target.name.ja, item.raceName) || !item.raceName || item.raceName.includes(target.name.ja) || target.name.ja.includes(item.raceName)) {
            const winner = buildNarRaceWinner(item.winner);
            results.set(target.id, { winner, resultUrl });
            break;
          }
        }
      }
    }

    return results;
  }

  async fetchResults(targetRaces: RaceOutput[]): Promise<Map<string, RaceWinner>> {
    const records = await this.fetchResultRecords(targetRaces);
    const winners = new Map<string, RaceWinner>();
    for (const [id, rec] of records.entries()) {
      winners.set(id, rec.winner);
    }
    return winners;
  }
}

/**
 * フランス競馬（France Galop）用 レース結果取得プロバイダー
 */
export class FranceRaceResultFetcher implements RaceResultFetcher {
  readonly organization = 'france_galop';
  private fixtures?: Record<string, PmuProgrammeResultResponse>;

  constructor(options?: { fixtures?: Record<string, PmuProgrammeResultResponse> }) {
    this.fixtures = options?.fixtures;
  }

  getTargetPastRaces(races: RaceOutput[], refDate: string, options?: { refTimeIso?: string; daysAgo?: number; force?: boolean }): RaceOutput[] {
    const targets = getTargetPastRacesForResults(races, refDate, options);
    return targets.filter((r) => r.organization === this.organization);
  }

  async fetchResultRecords(targetRaces: RaceOutput[]): Promise<Map<string, RaceResultRecord>> {
    const results = new Map<string, RaceResultRecord>();
    if (targetRaces.length === 0) return results;

    // 日付ごとにグループ化
    const dateMap = new Map<string, RaceOutput[]>();
    for (const r of targetRaces) {
      const list = dateMap.get(r.date) || [];
      list.push(r);
      dateMap.set(r.date, list);
    }

    for (const [dateYmd, racesOnDate] of dateMap.entries()) {
      const [y, m, d] = dateYmd.split('-');
      const ddmmyyyy = `${d}${m}${y}`;

      let data: PmuProgrammeResultResponse | null = null;
      if (this.fixtures && this.fixtures[ddmmyyyy]) {
        data = this.fixtures[ddmmyyyy];
      } else {
        const url = `https://online.turfinfo.api.pmu.fr/rest/client/7/programme/${ddmmyyyy}`;
        try {
          const res = await fetchWithRetry(url);
          if (res.ok) {
            data = (await res.json()) as PmuProgrammeResultResponse;
          }
        } catch (e) {
          console.warn(`[France Results] Failed to fetch PMU programme for ${dateYmd}: ${(e as Error).message}`);
        }
      }

      if (data) {
        const reunions = (data as any).programme?.reunions || [];
        for (const race of racesOnDate) {
          const frName = (race.name as { fr?: string }).fr || '';
          const enName = race.name?.en || '';

          for (const reunion of reunions) {
            for (const course of reunion.courses || []) {
              const matchesFr = frName ? frenchRaceMatches(frName, course.libelle) : false;
              const matchesEn = enName ? frenchRaceMatches(enName, course.libelle) : false;

              if ((matchesFr || matchesEn) && (!course.participants || course.participants.length === 0)) {
                if (!this.fixtures && reunion.numOfficiel && course.numOrdre) {
                  const pUrl = `https://online.turfinfo.api.pmu.fr/rest/client/7/programme/${ddmmyyyy}/R${reunion.numOfficiel}/C${course.numOrdre}/participants`;
                  try {
                    const pRes = await fetchWithRetry(pUrl);
                    if (pRes.ok) {
                      const pData = (await pRes.json()) as any;
                      course.participants = pData.participants || pData;
                    }
                  } catch (err) {
                    console.warn(`[France Results] Failed to fetch participants for ${race.id}: ${(err as Error).message}`);
                  }
                }
                break;
              }
            }
          }
        }

        const parsedMap = parsePmuResultsJson(data, racesOnDate);
        for (const [id, winner] of parsedMap.entries()) {
          const race = racesOnDate.find((r) => r.id === id);
          let resultUrl = 'https://www.pmu.fr/turf/';
          if (race) {
            const frName = (race.name as { fr?: string }).fr || '';
            const enName = race.name?.en || '';
            for (const reunion of reunions) {
              for (const course of reunion.courses || []) {
                const matchesFr = frName ? frenchRaceMatches(frName, course.libelle) : false;
                const matchesEn = enName ? frenchRaceMatches(enName, course.libelle) : false;
                if ((matchesFr || matchesEn) && reunion.numOfficiel && course.numOrdre) {
                  resultUrl = `https://www.pmu.fr/turf/${ddmmyyyy}/r${reunion.numOfficiel}/c${course.numOrdre}/`;
                  break;
                }
              }
            }
          }
          results.set(id, { winner, resultUrl });
        }
      }
    }

    return results;
  }

  async fetchResults(targetRaces: RaceOutput[]): Promise<Map<string, RaceWinner>> {
    const records = await this.fetchResultRecords(targetRaces);
    const winners = new Map<string, RaceWinner>();
    for (const [id, rec] of records.entries()) {
      winners.set(id, rec.winner);
    }
    return winners;
  }
}

/**
 * イギリス競馬（BHA）用 レース結果取得プロバイダー
 */
export class UkRaceResultFetcher implements RaceResultFetcher {
  readonly organization = 'bha';
  private fixtures?: Record<string, SportingLifeResultMeetingItem[]>;

  constructor(options?: { fixtures?: Record<string, SportingLifeResultMeetingItem[]> }) {
    this.fixtures = options?.fixtures;
  }

  getTargetPastRaces(races: RaceOutput[], refDate: string, options?: { refTimeIso?: string; daysAgo?: number; force?: boolean }): RaceOutput[] {
    const targets = getTargetPastRacesForResults(races, refDate, options);
    return targets.filter((r) => r.organization === this.organization || r.organization === 'uk');
  }

  async fetchResultRecords(targetRaces: RaceOutput[]): Promise<Map<string, RaceResultRecord>> {
    const results = new Map<string, RaceResultRecord>();
    if (targetRaces.length === 0) return results;

    const dateMap = new Map<string, RaceOutput[]>();
    for (const r of targetRaces) {
      const list = dateMap.get(r.date) || [];
      list.push(r);
      dateMap.set(r.date, list);
    }

    for (const [dateYmd, racesOnDate] of dateMap.entries()) {
      let meetings: SportingLifeResultMeetingItem[] | null = null;
      if (this.fixtures && this.fixtures[dateYmd]) {
        meetings = this.fixtures[dateYmd];
      } else {
        const url = `https://www.sportinglife.com/api/horse-racing/racing/results/${dateYmd}`;
        try {
          const res = await fetchWithRetry(url);
          if (res.ok) {
            meetings = (await res.json()) as SportingLifeResultMeetingItem[];
          } else {
            // HTML フォールバック
            const htmlUrl = `https://www.sportinglife.com/racing/results/${dateYmd}`;
            const htmlRes = await fetchWithRetry(htmlUrl);
            if (htmlRes.ok) {
              const htmlText = await htmlRes.text();
              const nextData = htmlText.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
              if (nextData) {
                const json = JSON.parse(nextData[1]);
                meetings = (json.props?.pageProps?.meetings || []) as SportingLifeResultMeetingItem[];
              }
            }
          }
        } catch (e) {
          console.warn(`[UK Results] Failed to fetch Sporting Life results for ${dateYmd}: ${(e as Error).message}`);
        }
      }

      if (meetings) {
        const parsedMap = parseSportingLifeResultsJson(meetings, racesOnDate);
        const resultUrl = `https://www.sportinglife.com/racing/results/${dateYmd}`;
        for (const [id, winner] of parsedMap.entries()) {
          results.set(id, { winner, resultUrl });
        }
      }
    }

    return results;
  }

  async fetchResults(targetRaces: RaceOutput[]): Promise<Map<string, RaceWinner>> {
    const records = await this.fetchResultRecords(targetRaces);
    const winners = new Map<string, RaceWinner>();
    for (const [id, rec] of records.entries()) {
      winners.set(id, rec.winner);
    }
    return winners;
  }
}

/**
 * アイルランド競馬（HRI）用 レース結果取得プロバイダー
 */
export class IeRaceResultFetcher implements RaceResultFetcher {
  readonly organization = 'hri';
  private fixtures?: Record<string, SportingLifeResultMeetingItem[]>;

  constructor(options?: { fixtures?: Record<string, SportingLifeResultMeetingItem[]> }) {
    this.fixtures = options?.fixtures;
  }

  getTargetPastRaces(races: RaceOutput[], refDate: string, options?: { refTimeIso?: string; daysAgo?: number; force?: boolean }): RaceOutput[] {
    const targets = getTargetPastRacesForResults(races, refDate, options);
    return targets.filter((r) => r.organization === this.organization);
  }

  async fetchResultRecords(targetRaces: RaceOutput[]): Promise<Map<string, RaceResultRecord>> {
    const ukFetcher = new UkRaceResultFetcher({ fixtures: this.fixtures });
    return await ukFetcher.fetchResultRecords(targetRaces);
  }

  async fetchResults(targetRaces: RaceOutput[]): Promise<Map<string, RaceWinner>> {
    const ukFetcher = new UkRaceResultFetcher({ fixtures: this.fixtures });
    return await ukFetcher.fetchResults(targetRaces);
  }
}

/**
 * 香港競馬（HKJC）用 レース結果取得プロバイダー
 */
export class HkjcRaceResultFetcher implements RaceResultFetcher {
  readonly organization = 'hkjc';
  private fixtures?: Record<string, string>;

  constructor(options?: { fixtures?: Record<string, string> }) {
    this.fixtures = options?.fixtures;
  }

  getTargetPastRaces(races: RaceOutput[], refDate: string, options?: { refTimeIso?: string; daysAgo?: number; force?: boolean }): RaceOutput[] {
    const targets = getTargetPastRacesForResults(races, refDate, options);
    return targets.filter((r) => r.organization === this.organization);
  }

  async fetchResultRecords(targetRaces: RaceOutput[]): Promise<Map<string, RaceResultRecord>> {
    const results = new Map<string, RaceResultRecord>();
    if (targetRaces.length === 0) return results;

    for (const target of targetRaces) {
      let htmlEn: string | null = null;
      let htmlZh: string | null = null;
      let matchedRaceNo: string | null = null;

      if (this.fixtures && this.fixtures[target.id]) {
        htmlEn = this.fixtures[target.id];
      } else if (this.fixtures && this.fixtures[target.date]) {
        htmlEn = this.fixtures[target.date];
      } else {
        // HKJC公式サイトからライブフェッチ
        try {
          const urlDate = target.date.replace(/-/g, '/');

          // Sporting Life の当日ミーティング情報から RaceNo を事前推定（超高速ピンポイントフェッチ）
          let guessedRaceNo: string | null = null;
          try {
            const slUrl = `https://www.sportinglife.com/racing/results/${target.date}`;
            const slRes = await fetchWithRetry(slUrl, undefined, 1, 500, 8000);
            if (slRes.ok) {
              const slHtml = await slRes.text();
              const nextData = slHtml.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
              if (nextData) {
                const json = JSON.parse(nextData[1]);
                const hkMeeting = (json.props?.pageProps?.meetings || []).find(
                  (m: any) => m.meeting_summary?.course?.name === 'Sha Tin' || m.meeting_summary?.course?.name === 'Happy Valley'
                );
                if (hkMeeting) {
                  for (let idx = 0; idx < (hkMeeting.races || []).length; idx++) {
                    const rc = hkMeeting.races[idx];
                    const targetEn = (target.name.en || '').toUpperCase();
                    if (targetEn && ukRaceMatches(targetEn, rc.name || '')) {
                      guessedRaceNo = String(idx + 1);
                      break;
                    }
                  }
                }
              }
            }
          } catch {
            // Sporting Life pre-check fails silently
          }

          matchedRaceNo = guessedRaceNo;

          if (matchedRaceNo) {
            // ピンポイントで該当 RaceNo の英語・中文ページのみを取得
            const raceUrl = `https://racing.hkjc.com/racing/information/English/Racing/LocalResults.aspx?RaceDate=${urlDate}&RaceNo=${matchedRaceNo}`;
            const raceRes = await fetchWithRetry(raceUrl, undefined, 2, 500, 10000);
            if (raceRes.ok) {
              htmlEn = await raceRes.text();
            }
          } else {
            // インデックスページを取得
            const indexUrl = `https://racing.hkjc.com/racing/information/English/Racing/LocalResults.aspx?RaceDate=${urlDate}`;
            const res = await fetchWithRetry(indexUrl, undefined, 2, 500, 10000);
            if (res.ok) {
              const indexHtml = await res.text();
              const targetEn = (target.name.en || '').toUpperCase();

              // インデックスページ自体に対象レース情報が含まれているか確認
              if (targetEn && (indexHtml.toUpperCase().includes(targetEn) || raceNameMatches(targetEn, indexHtml.toUpperCase()))) {
                htmlEn = indexHtml;
              } else {
                // 重賞が開催されやすい代表的なレース番号（Race 7, 8, 9, 3, 4）のみに絞り込んで確認
                const priorityRaceNos = ['7', '8', '9', '10', '3', '4', '2', '5', '6', '1', '11'];
                for (const rNo of priorityRaceNos) {
                  const raceUrl = `https://racing.hkjc.com/racing/information/English/Racing/LocalResults.aspx?RaceDate=${urlDate}&RaceNo=${rNo}`;
                  try {
                    const raceRes = await fetchWithRetry(raceUrl, undefined, 1, 300, 5000);
                    if (raceRes.ok) {
                      const raceHtml = await raceRes.text();
                      const upperHtml = raceHtml.toUpperCase();
                      if (targetEn && (upperHtml.includes(targetEn) || raceNameMatches(targetEn, upperHtml))) {
                        matchedRaceNo = rNo;
                        htmlEn = raceHtml;
                        break;
                      }
                    }
                  } catch {
                    // 個別レースタイムアウト時は即次へ
                  }
                }
                if (!htmlEn) {
                  htmlEn = indexHtml;
                }
              }
            }
          }

          // 中文ページの取得（RaceNo指定）
          const zhRaceNoParam = matchedRaceNo ? `&RaceNo=${matchedRaceNo}` : '';
          const zhUrl = `https://racing.hkjc.com/racing/information/Chinese/Racing/LocalResults.aspx?RaceDate=${urlDate}${zhRaceNoParam}`;
          try {
            const zhRes = await fetchWithRetry(zhUrl, undefined, 1, 500, 8000);
            if (zhRes.ok) {
              htmlZh = await zhRes.text();
            }
          } catch {
            // 中文取得失敗時は英語フォールバック
          }
        } catch (e) {
          console.warn(`[HKJC Results] Failed to live-fetch results for ${target.name.en || target.name.ja} (${target.date}): ${(e as Error).message}`);
        }
      }

      if (htmlEn) {
        const parsedList = parseHkjcResultHtml(htmlEn);
        if (parsedList.length > 0) {
          const first = parsedList[0].winner;

          // 中文ページから繁体字馬名・騎手名を取得
          let zhHorseName: string | undefined = (target.name as any).zh;
          let zhJockey: string | undefined;
          if (htmlZh) {
            const parsedZhList = parseHkjcResultHtml(htmlZh);
            if (parsedZhList.length > 0 && parsedZhList[0].winner) {
              zhHorseName = parsedZhList[0].winner.horseNameEn || zhHorseName;
              zhJockey = parsedZhList[0].winner.jockey;
            }
          }

          const winner: RaceWinner = {
            name: {
              ja: target.winner?.name?.ja || first.horseNameEn,
              en: first.horseNameEn,
              zh: zhHorseName,
            },
            jockey: first.jockey
              ? {
                  ja: target.winner?.jockey?.ja || first.jockey,
                  en: first.jockey,
                  zh: zhJockey,
                }
              : undefined,
            horse_number: first.horseNumber,
            time: first.time,
          };

          const urlDate = target.date.replace(/-/g, '/');
          const rNo = matchedRaceNo || (target as any).race_number;
          const resultUrl = rNo
            ? `https://racing.hkjc.com/racing/information/English/Racing/LocalResults.aspx?RaceDate=${urlDate}&RaceNo=${rNo}`
            : `https://racing.hkjc.com/racing/information/English/Racing/LocalResults.aspx?RaceDate=${urlDate}`;

          results.set(target.id, { winner, resultUrl });
        }
      }
    }

    return results;
  }

  async fetchResults(targetRaces: RaceOutput[]): Promise<Map<string, RaceWinner>> {
    const records = await this.fetchResultRecords(targetRaces);
    const winners = new Map<string, RaceWinner>();
    for (const [id, rec] of records.entries()) {
      winners.set(id, rec.winner);
    }
    return winners;
  }
}

/**
 * アメリカ競馬（Equibase / Sporting Life）用 レース結果取得プロバイダー
 */
export class UsRaceResultFetcher implements RaceResultFetcher {
  readonly organization = 'equibase';
  private fixtures?: Record<string, string>;

  constructor(options?: { fixtures?: Record<string, string> }) {
    this.fixtures = options?.fixtures;
  }

  getTargetPastRaces(races: RaceOutput[], refDate: string, options?: { refTimeIso?: string; daysAgo?: number; force?: boolean }): RaceOutput[] {
    const targets = getTargetPastRacesForResults(races, refDate, options);
    return targets.filter((r) => r.organization === this.organization || r.organization === 'us');
  }

  async fetchResultRecords(targetRaces: RaceOutput[]): Promise<Map<string, RaceResultRecord>> {
    const results = new Map<string, RaceResultRecord>();
    if (targetRaces.length === 0) return results;

    // 1. fixtures があれば優先処理
    if (this.fixtures) {
      for (const target of targetRaces) {
        let html: string | null = null;
        if (this.fixtures[target.id]) {
          html = this.fixtures[target.id];
        } else if (this.fixtures[target.date]) {
          html = this.fixtures[target.date];
        }

        if (html) {
          const parsedList = parseEquibaseResultHtml(html);
          if (parsedList.length > 0) {
            const first = parsedList[0].winner;
            results.set(target.id, {
              winner: {
                name: {
                  ja: target.winner?.name?.ja || first.horseName,
                  en: first.horseName,
                },
                jockey: first.jockey
                  ? {
                      ja: target.winner?.jockey?.ja || first.jockey,
                      en: first.jockey,
                    }
                  : undefined,
                horse_number: first.horseNumber,
                time: first.time,
              },
            });
          }
        }
      }
      return results;
    }

    // 2. ライブフェッチ: Sporting Life Results (API & HTML __NEXT_DATA__ フォールバック, 当日および翌日+1日のUTCクロス照合)
    const dates = new Set<string>();
    for (const r of targetRaces) {
      dates.add(r.date);
      const [y, m, d] = r.date.split('-').map(Number);
      const nextDay = new Date(Date.UTC(y, m - 1, d + 1));
      dates.add(nextDay.toISOString().slice(0, 10));
    }

    const allMeetings: SportingLifeResultMeetingItem[] = [];
    for (const d of dates) {
      try {
        const url = `https://www.sportinglife.com/api/horse-racing/racing/results/${d}`;
        const res = await fetchWithRetry(url);
        if (res.ok) {
          const meetings = (await res.json()) as SportingLifeResultMeetingItem[];
          allMeetings.push(...meetings);
        } else {
          // HTML __NEXT_DATA__ フォールバック
          const htmlUrl = `https://www.sportinglife.com/racing/results/${d}`;
          const htmlRes = await fetchWithRetry(htmlUrl);
          if (htmlRes.ok) {
            const htmlText = await htmlRes.text();
            const nextData = htmlText.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
            if (nextData) {
              const json = JSON.parse(nextData[1]);
              const meetings = (json.props?.pageProps?.meetings || []) as SportingLifeResultMeetingItem[];
              allMeetings.push(...meetings);
            }
          }
        }
      } catch (e) {
        console.warn(`[US Results] Failed to live-fetch results for ${d}: ${(e as Error).message}`);
      }
    }

    if (allMeetings.length > 0) {
      const parsedMap = parseSportingLifeResultsJson(allMeetings, targetRaces);
      for (const [id, winner] of parsedMap.entries()) {
        const target = targetRaces.find((r) => r.id === id);
        const resultUrl = target ? `https://www.sportinglife.com/racing/results/${target.date}` : undefined;
        results.set(id, { winner, resultUrl });
      }
    }

    return results;
  }

  async fetchResults(targetRaces: RaceOutput[]): Promise<Map<string, RaceWinner>> {
    const records = await this.fetchResultRecords(targetRaces);
    const winners = new Map<string, RaceWinner>();
    for (const [id, rec] of records.entries()) {
      winners.set(id, rec.winner);
    }
    return winners;
  }
}

/**
 * 登録済みプロバイダーマップ
 */
export const DEFAULT_RESULT_FETCHERS: Record<string, RaceResultFetcher> = {
  jra: new JraRaceResultFetcher(),
  nar: new NarRaceResultFetcher(),
  france_galop: new FranceRaceResultFetcher(),
  bha: new UkRaceResultFetcher(),
  uk: new UkRaceResultFetcher(),
  hri: new IeRaceResultFetcher(),
  hkjc: new HkjcRaceResultFetcher(),
  equibase: new UsRaceResultFetcher(),
  us: new UsRaceResultFetcher(),
};

/**
 * コマンドライン引数をパース
 */
export function parseArgs(argv: string[] = process.argv.slice(2)): {
  refDate: string;
  refTimeIso?: string;
  daysAgo?: number;
  orgFilter?: string;
  dryRun: boolean;
  force: boolean;
} {
  let refDate = new Date().toISOString().slice(0, 10);
  let refTimeIso: string | undefined;
  let daysAgo: number | undefined;
  let orgFilter: string | undefined;
  let dryRun = false;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--date' && argv[i + 1]) {
      refDate = argv[++i];
    } else if (arg === '--time' && argv[i + 1]) {
      refTimeIso = argv[++i];
    } else if (arg === '--days' && argv[i + 1]) {
      daysAgo = parseInt(argv[++i], 10);
    } else if (arg === '--org' && argv[i + 1]) {
      orgFilter = argv[++i].toLowerCase();
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--force') {
      force = true;
    }
  }

  return { refDate, refTimeIso, daysAgo, orgFilter, dryRun, force };
}

/**
 * レースリザルト（勝ち馬）の更新メイン処理
 */
export async function updateRaceResults(options: {
  racesPath: string;
  winnersMasterPath: string;
  officialResultsMasterPath?: string;
  refDate: string;
  refTimeIso?: string;
  daysAgo?: number;
  orgFilter?: string;
  dryRun?: boolean;
  force?: boolean;
  providers?: RaceResultFetcher[];
}): Promise<{
  totalTargets: number;
  updatedCount: number;
  updatedRaces: Array<{ id: string; name: string; winner: RaceWinner }>;
}> {
  const {
    racesPath,
    winnersMasterPath,
    officialResultsMasterPath,
    refDate,
    refTimeIso,
    daysAgo,
    orgFilter,
    dryRun = false,
    force = false,
    providers = Object.values(DEFAULT_RESULT_FETCHERS).filter(
      (v, idx, arr) => arr.findIndex((t) => t.organization === v.organization) === idx
    ),
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

  // 既存の official_results_urls マスタを読み込み (Issue #159)
  let officialResultsMaster: Record<string, string> = {};
  if (officialResultsMasterPath && fs.existsSync(officialResultsMasterPath)) {
    try {
      officialResultsMaster = JSON.parse(fs.readFileSync(officialResultsMasterPath, 'utf8'));
    } catch (e) {
      console.warn(`[Warning] Could not parse official results master: ${(e as Error).message}`);
    }
  }

  let totalTargets = 0;
  let updatedCount = 0;
  const updatedRaces: Array<{ id: string; name: string; winner: RaceWinner }> = [];

  for (const provider of providers) {
    if (orgFilter && provider.organization !== orgFilter) {
      continue;
    }

    const targets = provider.getTargetPastRaces(races, refDate, { refTimeIso, daysAgo, force });
    totalTargets += targets.length;

    if (targets.length === 0) {
      continue;
    }

    console.log(`\n--- Checking results for organization: [${provider.organization.toUpperCase()}] ---`);
    console.log(`[Update Race Results][${provider.organization}] Found ${targets.length} target race(s) in active post-race window.`);

    const fetchedRecords = provider.fetchResultRecords
      ? await provider.fetchResultRecords(targets)
      : null;
    const fetchedResults = fetchedRecords
      ? new Map([...fetchedRecords.entries()].map(([k, v]) => [k, v.winner]))
      : await provider.fetchResults(targets);

    for (const target of targets) {
      // 1. 公式フェッチャーから取得した結果
      // 2. 静的マスタ (race_winners.json) に登録済みの結果
      const record = fetchedRecords?.get(target.id);
      const winner = record?.winner || fetchedResults.get(target.id) || winnersMaster[target.id];

      if (winner && (!target.winner || force)) {
        target.winner = winner;
        winnersMaster[target.id] = winner;

        // 公式リザルトURLの反映 (Issue #159, #176)
        // デッドリンク・誤リンク防止のため、実在検証済み公式マスタにのみ限定
        const officialUrl = officialResultsMaster[target.id] || JRA_G1_RESULT_URLS[target.id];
        if (officialUrl) {
          target.official_url = officialUrl;
          if (officialResultsMasterPath) {
            officialResultsMaster[target.id] = officialUrl;
          }
        }

        updatedCount++;
        updatedRaces.push({ id: target.id, name: target.name.ja, winner });
        console.log(`[Update Race Results][${target.organization}] UPDATED: [${target.date}] ${target.name.ja} (${target.id}) -> Winner: ${winner.name.ja} (${winner.name.en})`);
      }
    }
  }

  if (totalTargets === 0) {
    console.log(`\n[Update Race Results] Early Exit: No finished/unconfirmed races found for refDate: ${refDate}.`);
  }

  if (updatedCount > 0 && !dryRun) {
    fs.writeFileSync(racesPath, JSON.stringify(races, null, 2), 'utf8');
    fs.writeFileSync(winnersMasterPath, JSON.stringify(winnersMaster, null, 2), 'utf8');
    if (officialResultsMasterPath && Object.keys(officialResultsMaster).length > 0) {
      fs.writeFileSync(officialResultsMasterPath, JSON.stringify(officialResultsMaster, null, 2), 'utf8');
    }
    console.log(`\n[Update Race Results] Successfully saved ${updatedCount} updated winner(s) to ${racesPath} and ${winnersMasterPath}`);
  } else if (dryRun) {
    console.log(`\n[Update Race Results] Dry-run mode: No files were modified.`);
  }

  return { totalTargets, updatedCount, updatedRaces };
}

async function main() {
  const { refDate, refTimeIso, daysAgo, orgFilter, dryRun, force } = parseArgs();
  console.log(`Starting race results update for refDate: ${refDate} (org: ${orgFilter || 'all'}, daysAgo: ${daysAgo ?? 3}, force: ${force}, dryRun: ${dryRun})`);

  const rootDir = process.cwd();
  const racesPath = path.join(rootDir, 'public', 'data', 'races.json');
  const winnersMasterPath = path.join(rootDir, 'src', 'data', 'race_winners.json');
  const officialResultsMasterPath = path.join(rootDir, 'src', 'data', 'official_results_urls.json');

  const result = await updateRaceResults({
    racesPath,
    winnersMasterPath,
    officialResultsMasterPath,
    refDate,
    refTimeIso,
    daysAgo,
    orgFilter,
    dryRun,
    force,
  });

  console.log(`Finished: ${result.updatedCount}/${result.totalTargets} races updated.`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('update-race-results.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
