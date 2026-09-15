import { describe, it, expect } from "vitest";
import { getCalendarDays, formatYearMonthDay, CALENDAR_WEEKDAYS } from "../../src/libs/calendar";

describe("calendar utility", () => {
  it("formatYearMonthDay が正しくゼロ埋めフォーマットすること", () => {
    expect(formatYearMonthDay(2026, 2, 9)).toBe("2026-02-09");
    expect(formatYearMonthDay(2026, 12, 25)).toBe("2026-12-25");
  });

  it("CALENDAR_WEEKDAYS が月曜日始まりの7曜日であること", () => {
    expect(CALENDAR_WEEKDAYS).toEqual(["月", "火", "水", "木", "金", "土", "日"]);
  });

  it("2026年2月（初日が日曜日）のカレンダーで、初日(2/1)が7列目（日曜日）に配置されること", () => {
    // 2026年2月1日は日曜日。月曜始まりなので、1週目の月〜土（1/26〜1/31）が前月埋め合わせとなり、2/1はインデックス6。
    const days = getCalendarDays(2026, 2, "2026-02-22");

    // 全体グリッド数が7の倍数であること
    expect(days.length % 7).toBe(0);
    expect(days.length).toBeGreaterThanOrEqual(35);

    // インデックス 0〜5 は前月（2026年1月26日〜1月31日）
    expect(days[0].date).toBe("2026-01-26");
    expect(days[0].isCurrentMonth).toBe(false);
    expect(days[5].date).toBe("2026-01-31");
    expect(days[5].isCurrentMonth).toBe(false);
    expect(days[5].isSaturday).toBe(true);

    // インデックス 6 が 2026年2月1日（日曜日、当月）
    expect(days[6].date).toBe("2026-02-01");
    expect(days[6].isCurrentMonth).toBe(true);
    expect(days[6].isSunday).toBe(true);

    // 2026年2月22日（日曜日）が isToday === true であること
    const feb22 = days.find((d) => d.date === "2026-02-22");
    expect(feb22).toBeDefined();
    expect(feb22?.isToday).toBe(true);
    expect(feb22?.isSunday).toBe(true);
    expect(feb22?.isCurrentMonth).toBe(true);

    // 2026年2月28日（土曜日）が当月末日
    const feb28 = days.find((d) => d.date === "2026-02-28");
    expect(feb28).toBeDefined();
    expect(feb28?.isSaturday).toBe(true);
    expect(feb28?.isCurrentMonth).toBe(true);
  });

  it("2026年5月（初日が金曜日）のカレンダーで、月〜木（4日間）が前月埋め合わせとなること", () => {
    // 2026年5月1日は金曜日。月曜始まりでは 月(0), 火(1), 水(2), 木(3), 金(4)
    const days = getCalendarDays(2026, 5);

    expect(days[0].date).toBe("2026-04-27"); // 月
    expect(days[0].isCurrentMonth).toBe(false);
    expect(days[3].date).toBe("2026-04-30"); // 木
    expect(days[3].isCurrentMonth).toBe(false);

    expect(days[4].date).toBe("2026-05-01"); // 金
    expect(days[4].isCurrentMonth).toBe(true);
    expect(days[4].day).toBe(1);

    expect(days[5].date).toBe("2026-05-02"); // 土
    expect(days[5].isSaturday).toBe(true);
    expect(days[6].date).toBe("2026-05-03"); // 日
    expect(days[6].isSunday).toBe(true);
  });
});
