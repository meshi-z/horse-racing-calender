import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CalendarView } from "../../src/features/calendar/CalendarView";
import { useRaceStore } from "../../src/store/useRaceStore";
import { useLanguageStore } from "../../src/store/useLanguageStore";
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
    useLanguageStore.setState({ language: "ja" });
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

    expect(screen.getByText("2026年2月")).toBeInTheDocument();
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

  it("代替開催（is_rescheduled=true）のレースにおいて '代替' バッジが表示されること", () => {
    const rescheduledRaces: Race[] = [
      {
        ...mockRaces[1],
        date: "2026-02-23", // 2/22(日) から 2/23(月) に順延
        is_rescheduled: true,
        original_date: "2026-02-22",
      },
    ];

    render(<CalendarView races={rescheduledRaces} />);

    const raceButton = screen.getByRole("button", {
      name: "フェブラリーステークス（代替開催） 詳細を表示",
    });
    expect(raceButton).toBeInTheDocument();
    expect(raceButton).toHaveTextContent("代替");
  });

  it("カレンダー上部に '月曜始まりカレンダー（土日連続表示）' が表示されないこと", () => {
    render(<CalendarView races={mockRaces} />);

    expect(screen.queryByText(/月曜始まりカレンダー/)).not.toBeInTheDocument();
  });

  it("発走時刻が確定済み（is_time_confirmed: true）の場合は時刻が表示され、未確定の場合は時刻が表示されないこと (Issue #56)", () => {
    const racesWithTimes: Race[] = [
      {
        ...mockRaces[1],
        is_time_confirmed: true,
      },
      {
        ...mockRaces[0],
        date: "2026-02-15",
        is_time_confirmed: false,
      },
    ];

    render(<CalendarView races={racesWithTimes} />);

    // 確定済みのフェブラリーSには時刻が表示されること
    const confirmedButton = screen.getByRole("button", {
      name: "フェブラリーステークス 詳細を表示",
    });
    expect(confirmedButton).toHaveTextContent(/\d{2}:\d{2}/);

    // 未確定の京都金杯には時刻が表示されないこと
    const unconfirmedButton = screen.getByRole("button", {
      name: "スポーツニッポン賞京都金杯 詳細を表示",
    });
    expect(unconfirmedButton).not.toHaveTextContent(/\d{2}:\d{2}/);
  });

  describe("多言語表示 (en)", () => {
    beforeEach(() => {
      useLanguageStore.setState({ language: "en" });
    });

    it("英語モード時に曜日ヘッダーがMon〜Sun、年月がFebruary 2026形式で表示されること", () => {
      render(<CalendarView races={mockRaces} />);

      const englishWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      englishWeekdays.forEach((wd) => {
        expect(screen.getByLabelText(wd)).toHaveTextContent(wd);
      });

      expect(screen.getByText("February 2026")).toBeInTheDocument();
      expect(screen.getByText("1 Races")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Jump to current month" })).toHaveTextContent("Today");

      // セル内レース名
      const raceButton = screen.getByRole("button", {
        name: "February Stakes View Details",
      });
      expect(raceButton).toBeInTheDocument();
      expect(raceButton).toHaveTextContent("February Stakes");
    });
  });
});
