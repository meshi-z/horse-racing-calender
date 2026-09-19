/**
 * 日時フォーマットおよびローカル時刻変換ユーティリティ
 */

const DAY_OF_WEEK_JA = ['日', '月', '火', '水', '木', '金', '土'] as const;

/**
 * UTC ISO 8601 文字列（例: "2026-02-22T06:40:00.000Z"）を
 * クライアントのローカル時刻（HH:mm）に変換する
 */
export function formatLocalTime(utcIsoString: string): string {
  try {
    const date = new Date(utcIsoString);
    if (isNaN(date.getTime())) {
      return '';
    }
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '';
  }
}

/**
 * 日付文字列（YYYY-MM-DD）を「YYYY年M月D日(曜日)」形式に変換する
 */
export function formatLocalDate(dateString: string): string {
  try {
    const [yearStr, monthStr, dayStr] = dateString.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    const dayOfWeek = DAY_OF_WEEK_JA[date.getDay()];
    return `${year}年${month}月${day}日(${dayOfWeek})`;
  } catch {
    return dateString;
  }
}

export interface RaceTimeInfo {
  time: string;
  statusLabel: string | null;
  isPast: boolean;
}

/**
 * レースの発走時刻とステータスを整形して返す
 * 発走時刻前の場合は「発走予定」、発走時刻を経過した場合は statusLabel を null とする
 */
export function formatRaceTimeDisplay(
  startTime: string,
  now: Date = new Date()
): RaceTimeInfo {
  const time = formatLocalTime(startTime);
  const startDate = new Date(startTime);
  if (isNaN(startDate.getTime())) {
    return {
      time: '',
      statusLabel: null,
      isPast: false,
    };
  }

  const isPast = now.getTime() >= startDate.getTime();

  return {
    time,
    statusLabel: isPast ? null : '発走予定',
    isPast,
  };
}

/**
 * クライアントのローカル時刻基準で今日の日付を YYYY-MM-DD 形式で取得する
 */
export function getTodayLocalDateString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 昇順ソートされた日付文字列配列から、今日以降の直近レース日付（または最新の過去日）を特定する
 * 1. dates が空の場合は null を返す
 * 2. 今日以降（date >= today）で最初に見つかる日付を返す
 * 3. 全て過去日の場合は最後の開催日（最新の過去レース）を返す
 */
export function findUpcomingOrLatestDate(
  dates: string[],
  today: string = getTodayLocalDateString()
): string | null {
  if (dates.length === 0) {
    return null;
  }

  const upcomingDate = dates.find((d) => d >= today);
  if (upcomingDate) {
    return upcomingDate;
  }

  // 今日以降のレースが存在しない場合は最新の過去日（末尾）
  return dates[dates.length - 1];
}
