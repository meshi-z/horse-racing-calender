import { describe, it, expect } from "vitest";
import {
  formatLocalTime,
  formatLocalDate,
  formatRaceTimeDisplay,
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
    it("確定フラグが true の場合、'発走確定' ステータスを返すこと", () => {
      const result = formatRaceTimeDisplay("2026-02-22T06:40:00.000Z", true);
      expect(result.statusLabel).toBe("発走確定");
      expect(result.isConfirmed).toBe(true);
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it("確定フラグが false の場合、'発走予定' ステータスを返すこと", () => {
      const result = formatRaceTimeDisplay("2026-02-22T06:40:00.000Z", false);
      expect(result.statusLabel).toBe("発走予定");
      expect(result.isConfirmed).toBe(false);
    });
  });
});
