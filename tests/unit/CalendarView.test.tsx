import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CalendarView } from "../../src/features/calendar/CalendarView";
import { useRaceStore } from "../../src/store/useRaceStore";
import type { Race } from "../../src/types/race";

const mockRaces: Race[] = [
  {
    id: "2026-jra-g3-01",
    organization: "jra",
    name: { ja: "スポーツニッポン賞京都金杯", en: "Kyoto Kimpai" },
    grade: "G3",
    date: "2026-01-04",
    start_time: "2026-01-04T06:45:00.000Z",
    is_time_confirmed: false,
    course: { ja: "京都", en: "Kyoto" },
    distance: 1600,
    track_type: "turf",
    sex_constraint: "none",
    age_constraint: "4yo_and_up",
    handicap: { code: "set_weight", ja: "別定", en: "Set Weight" },
  },
  {
    id: "2026-jra-g1-01",
    organization: "jra",
    name: { ja: "フェブラリーステークス", en: "February Stakes" },
    grade: "G1",
    date: "2026-02-22",
    start_time: "2026-02-22T06:40:00.000Z",
    is_time_confirmed: false,
    course: { ja: "東京", en: "Tokyo" },
    distance: 1600,
    track_type: "dirt",
    sex_constraint: "none",
    age_constraint: "4yo_and_up",
    handicap: { code: "weight_for_age", ja: "定量", en: "Weight for Age" },
  },
];

describe("CalendarView", () => {
  beforeEach(() => {
    useRaceStore.setState({
      currentYearMonth: { year: 2026, month: 2 },
    });
  });

  it("月曜始まりの曜日ヘッダー（月〜日）が順番通りに表示されること", () => {
    render(<CalendarView races={mockRaces} />);

    const weekdays = ["月", "火", "水", "木", "金", "土", "日"];
    const headers = screen.getAllByLabelText(/曜日/);
    expect(headers).toHaveLength(7);
    weekdays.forEach((wd, index) => {
      expect(headers[index]).toHaveTextContent(wd);
    });
  });

  it("現在の年月表示と当月レース件数が正しく表示されること", () => {
    render(<CalendarView races={mockRaces} />);

    expect(screen.getByText("2026年 2月")).toBeInTheDocument();
    // 2026年2月のレースはフェブラリーSの1件
    expect(screen.getByText("1 レース")).toBeInTheDocument();
  });

  it("ナビゲーションボタン（翌月・前月・今月）で年月が正しく更新されること", () => {
    render(<CalendarView races={mockRaces} />);

    // 翌月ボタンをクリック (2026年2月 -> 2026年3月)
    const nextButton = screen.getByRole("button", { name: "翌月へ" });
    fireEvent.click(nextButton);
    expect(useRaceStore.getState().currentYearMonth).toEqual({ year: 2026, month: 3 });

    // 前月ボタンをクリック (2026年3月 -> 2026年2月)
    const prevButton = screen.getByRole("button", { name: "前月へ" });
    fireEvent.click(prevButton);
    expect(useRaceStore.getState().currentYearMonth).toEqual({ year: 2026, month: 2 });

    // 今月ボタンをクリック
    const todayButton = screen.getByRole("button", { name: "今月へジャンプ" });
    fireEvent.click(todayButton);
    const now = new Date();
    expect(useRaceStore.getState().currentYearMonth).toEqual({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
  });

  it("当月の日付セルにレースバッジが表示されること", () => {
    render(<CalendarView races={mockRaces} />);

    // フェブラリーステークスのバッジが存在すること
    const raceButton = screen.getByRole("button", {
      name: "フェブラリーステークス 詳細を表示",
    });
    expect(raceButton).toBeInTheDocument();
    expect(raceButton).toHaveTextContent("フェブラリーステークス");
  });

  it("カレンダー内のレースバッジをクリックすると詳細ダイアログが表示されること", () => {
    render(<CalendarView races={mockRaces} />);

    const raceButton = screen.getByRole("button", {
      name: "フェブラリーステークス 詳細を表示",
    });
    fireEvent.click(raceButton);

    // RaceDetailDialog が開くこと
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("February Stakes")).toBeInTheDocument();
    expect(screen.getByText("出走条件・負担重量")).toBeInTheDocument();
  });

  it("レースバッジで Enter キーを押下した際も詳細ダイアログが表示されること", () => {
    render(<CalendarView races={mockRaces} />);

    const raceButton = screen.getByRole("button", {
      name: "フェブラリーステークス 詳細を表示",
    });
    fireEvent.keyDown(raceButton, { key: "Enter" });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
