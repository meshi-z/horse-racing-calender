/**
 * カレンダー計算およびグリッド生成ユーティリティ（月曜始まり対応）
 */

export interface CalendarDay {
  date: string; // 'YYYY-MM-DD'
  year: number;
  month: number; // 1-12
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  isSaturday: boolean;
}

export const CALENDAR_WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'] as const;

/**
 * 年・月・日から 'YYYY-MM-DD' 文字列を生成するヘルパー
 */
export function formatYearMonthDay(year: number, month: number, day: number): string {
  const y = year.toString().padStart(4, '0');
  const m = month.toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 指定された年月のカレンダーグリッド用日付配列（月曜始まり）を生成する。
 * 競馬の土日開催が連続して視認できるよう、月曜日〜日曜日の7列グリッドとする。
 *
 * @param year 年 (例: 2026)
 * @param month 月 (1〜12)
 * @param todayDate 比較用の本日日付文字列（テスト容易化のため任意指定可能、デフォルトは現在日時）
 */
export function getCalendarDays(
  year: number,
  month: number,
  todayDate?: string
): CalendarDay[] {
  const todayStr =
    todayDate ??
    (() => {
      const now = new Date();
      return formatYearMonthDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
    })();

  // 当月の初日と末日
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // 月曜始まりのインデックス (0 = 月, 1 = 火, ..., 5 = 土, 6 = 日)
  // JSの getDay() は 0 = 日, 1 = 月, ..., 6 = 土
  const firstDayWeekdayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  // 前月の末日
  const prevMonthLastDay = new Date(year, month - 1, 0);
  const totalDaysInPrevMonth = prevMonthLastDay.getDate();
  const prevMonthYear = prevMonthLastDay.getFullYear();
  const prevMonth = prevMonthLastDay.getMonth() + 1;

  // 次月の年月
  const nextMonthFirstDay = new Date(year, month, 1);
  const nextMonthYear = nextMonthFirstDay.getFullYear();
  const nextMonth = nextMonthFirstDay.getMonth() + 1;

  const days: CalendarDay[] = [];

  // 1. 前月の埋め合わせ
  for (let i = firstDayWeekdayIndex - 1; i >= 0; i--) {
    const day = totalDaysInPrevMonth - i;
    const date = formatYearMonthDay(prevMonthYear, prevMonth, day);
    const dayOfWeek = new Date(prevMonthYear, prevMonth - 1, day).getDay();
    days.push({
      date,
      year: prevMonthYear,
      month: prevMonth,
      day,
      isCurrentMonth: false,
      isToday: date === todayStr,
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
    });
  }

  // 2. 当月の日付
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const date = formatYearMonthDay(year, month, day);
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    days.push({
      date,
      year,
      month,
      day,
      isCurrentMonth: true,
      isToday: date === todayStr,
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
    });
  }

  // 3. 次月の埋め合わせ（7の倍数になるまで、最低5行(35マス)）
  const remainingDays = (7 - (days.length % 7)) % 7;
  const totalTargetDays = days.length + remainingDays < 35 ? 35 : days.length + remainingDays;
  const fillNextMonthCount = totalTargetDays - days.length;

  for (let day = 1; day <= fillNextMonthCount; day++) {
    const date = formatYearMonthDay(nextMonthYear, nextMonth, day);
    const dayOfWeek = new Date(nextMonthYear, nextMonth - 1, day).getDay();
    days.push({
      date,
      year: nextMonthYear,
      month: nextMonth,
      day,
      isCurrentMonth: false,
      isToday: date === todayStr,
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
    });
  }

  return days;
}
