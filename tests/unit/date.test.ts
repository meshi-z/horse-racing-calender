import { describe, it, expect } from "vitest";
import {
  formatLocalTime,
  formatLocalDate,
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
    it("YYYY-MM-DD を 'YYYY年M月D日(曜日)' に変換すること", () => {
      // 2026-02-22 は日曜日
      const formatted = formatLocalDate("2026-02-22");
      expect(formatted).toBe("2026年2月22日(日)");
    });

    it("1桁の月日でも正しくフォーマットされること", () => {
      // 2026-01-04 は日曜日
      const formatted = formatLocalDate("2026-01-04");
      expect(formatted).toBe("2026年1月4日(日)");
    });
  });

  describe("formatRaceTimeDisplay", () => {
    const startTime = "2026-02-22T06:40:00.000Z";

    it("発走時刻前の場合、'発走予定' ステータスと isPast: false を返すこと", () => {
      const nowBefore = new Date("2026-02-22T06:30:00.000Z");
      const result = formatRaceTimeDisplay(startTime, nowBefore);
      expect(result.statusLabel).toBe("発走予定");
      expect(result.isPast).toBe(false);
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it("発走時刻を経過した場合、statusLabel: null と isPast: true を返すこと", () => {
      const nowAfter = new Date("2026-02-22T06:45:00.000Z");
      const result = formatRaceTimeDisplay(startTime, nowAfter);
      expect(result.statusLabel).toBeNull();
      expect(result.isPast).toBe(true);
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it("無効な日時の場合は空文字と statusLabel: null を返すこと", () => {
      const result = formatRaceTimeDisplay("invalid-date");
      expect(result.time).toBe("");
      expect(result.statusLabel).toBeNull();
      expect(result.isPast).toBe(false);
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
