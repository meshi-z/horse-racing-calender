import { describe, it, expect } from "vitest";
import {
  formatLocalTime,
  formatLocalDate,
  formatYearMonth,
  formatRaceTimeDisplay,
  getTodayLocalDateString,
  findUpcomingOrLatestDate,
} from "../../src/libs/date";

describe("src/libs/date.ts", () => {
  describe("formatLocalTime", () => {
    it("UTC ISO 文字列をクライアントのローカル時刻 (HH:mm) に変換すること", () => {
      // 06:40 UTC -> 15:40 JST (UTC+9)
      const formatted = formatLocalTime("2026-02-22T06:40:00.000Z");
      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
    });

    it("無効な日時の場合は空文字を返すこと", () => {
      expect(formatLocalTime("invalid-date")).toBe("");
    });
  });

  describe("formatLocalDate", () => {
    it("YYYY-MM-DD を 'YYYY年M月D日(曜日)' に変換すること (ja)", () => {
      // 2026-02-22 は日曜日
      const formatted = formatLocalDate("2026-02-22", "ja");
      expect(formatted).toBe("2026年2月22日(日)");
    });

    it("1桁の月日でも正しくフォーマットされること (ja)", () => {
      // 2026-01-04 は日曜日
      const formatted = formatLocalDate("2026-01-04", "ja");
      expect(formatted).toBe("2026年1月4日(日)");
    });

    it("英語モード時に 'ddd, MMM D, YYYY' 形式に変換されること (en)", () => {
      // 2026-10-04 は日曜日
      const formatted = formatLocalDate("2026-10-04", "en");
      expect(formatted).toBe("Sun, Oct 4, 2026");

      const febFormatted = formatLocalDate("2026-02-22", "en");
      expect(febFormatted).toBe("Sun, Feb 22, 2026");
    });

    it("繁体字中国語モード時に 'YYYY年M月D日(曜日)' 形式に変換されること (zh)", () => {
      // 2026-02-22 は日曜日
      const formatted = formatLocalDate("2026-02-22", "zh");
      expect(formatted).toBe("2026年2月22日(日)");

      // 2026-02-23 は月曜日
      const monFormatted = formatLocalDate("2026-02-23", "zh");
      expect(monFormatted).toBe("2026年2月23日(一)");
    });
  });

  describe("formatYearMonth", () => {
    it("日本語モードで 'YYYY年M月' を返すこと", () => {
      expect(formatYearMonth(2026, 4, "ja")).toBe("2026年4月");
      expect(formatYearMonth(2026, 12, "ja")).toBe("2026年12月");
    });

    it("英語モードで 'MMMM YYYY' を返すこと", () => {
      expect(formatYearMonth(2026, 4, "en")).toBe("April 2026");
      expect(formatYearMonth(2026, 1, "en")).toBe("January 2026");
      expect(formatYearMonth(2026, 12, "en")).toBe("December 2026");
    });

    it("繁体字中国語モードで 'YYYY年M月' を返すこと", () => {
      expect(formatYearMonth(2026, 4, "zh")).toBe("2026年4月");
      expect(formatYearMonth(2026, 12, "zh")).toBe("2026年12月");
    });
  });

  describe("formatRaceTimeDisplay", () => {
    const startTime = "2026-02-22T06:40:00.000Z";

    it("発走時刻前の場合、'発走予定' ステータスと isPast: false, isConfirmed: true を返すこと (ja)", () => {
      const nowBefore = new Date("2026-02-22T06:30:00.000Z");
      const result = formatRaceTimeDisplay(startTime, nowBefore, "ja");
      expect(result.statusLabel).toBe("発走予定");
      expect(result.isPast).toBe(false);
      expect(result.isConfirmed).toBe(true);
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it("英語モード時に 'Scheduled' ステータスを返すこと (en)", () => {
      const nowBefore = new Date("2026-02-22T06:30:00.000Z");
      const result = formatRaceTimeDisplay(startTime, nowBefore, "en");
      expect(result.statusLabel).toBe("Scheduled");
      expect(result.isPast).toBe(false);
      expect(result.isConfirmed).toBe(true);
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it("繁体字中国語モード時に '預計開跑' ステータスを返すこと (zh)", () => {
      const nowBefore = new Date("2026-02-22T06:30:00.000Z");
      const result = formatRaceTimeDisplay(startTime, nowBefore, "zh");
      expect(result.statusLabel).toBe("預計開跑");
      expect(result.isPast).toBe(false);
      expect(result.isConfirmed).toBe(true);
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it("発走時刻を経過した場合、statusLabel: null と isPast: true を返すこと", () => {
      const nowAfter = new Date("2026-02-22T06:45:00.000Z");
      const result = formatRaceTimeDisplay(startTime, nowAfter);
      expect(result.statusLabel).toBeNull();
      expect(result.isPast).toBe(true);
      expect(result.isConfirmed).toBe(true);
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it("発走時刻が未確定（isTimeConfirmed: false）の場合、time: '', statusLabel: null, isConfirmed: false を返すこと (Issue #56)", () => {
      const result = formatRaceTimeDisplay(startTime, false);
      expect(result.time).toBe("");
      expect(result.statusLabel).toBeNull();
      expect(result.isPast).toBe(false);
      expect(result.isConfirmed).toBe(false);
    });

    it("発走時刻が確定済み（isTimeConfirmed: true）の場合、時刻とステータスを正しく返すこと", () => {
      const nowBefore = new Date("2026-02-22T06:30:00.000Z");
      const result = formatRaceTimeDisplay(startTime, true, nowBefore, "ja");
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);
      expect(result.statusLabel).toBe("発走予定");
      expect(result.isPast).toBe(false);
      expect(result.isConfirmed).toBe(true);
    });

    it("無効な日時の場合は空文字と statusLabel: null を返すこと", () => {
      const result = formatRaceTimeDisplay("invalid-date");
      expect(result.time).toBe("");
      expect(result.statusLabel).toBeNull();
      expect(result.isPast).toBe(false);
      expect(result.isConfirmed).toBe(true);
    });
  });

  describe("getTodayLocalDateString", () => {
    it("与えられた日時のローカル日付を YYYY-MM-DD 形式で返すこと", () => {
      const customDate = new Date(2026, 8, 19); // 2026-09-19 (0-indexed month: 8)
      expect(getTodayLocalDateString(customDate)).toBe("2026-09-19");
    });

    it("月や日が1桁の場合にゼロ埋めされること", () => {
      const customDate = new Date(2026, 0, 5); // 2026-01-05
      expect(getTodayLocalDateString(customDate)).toBe("2026-01-05");
    });
  });

  describe("findUpcomingOrLatestDate", () => {
    const dates = ["2026-01-04", "2026-02-22", "2026-09-19", "2026-10-04", "2026-12-27"];

    it("配列が空の場合は null を返すこと", () => {
      expect(findUpcomingOrLatestDate([])).toBeNull();
    });

    it("今日当日にレースがある場合、今日の日付を返すこと", () => {
      expect(findUpcomingOrLatestDate(dates, "2026-09-19")).toBe("2026-09-19");
    });

    it("今日当日にレースがなく未来のレースがある場合、直近の次のレース日付を返すこと", () => {
      // 9月20日の場合、次のレースは 10月4日
      expect(findUpcomingOrLatestDate(dates, "2026-09-20")).toBe("2026-10-04");
    });

    it("すべての日付が過去の場合、最新の過去レース日付（末尾）を返すこと", () => {
      // 2027年の場合、すべて過去なので 2026-12-27
      expect(findUpcomingOrLatestDate(dates, "2027-01-01")).toBe("2026-12-27");
    });

    it("すべての日付が未来の場合、先頭のレース日付を返すこと", () => {
      // 2025年の場合、2026-01-04
      expect(findUpcomingOrLatestDate(dates, "2025-12-01")).toBe("2026-01-04");
    });
  });
});
