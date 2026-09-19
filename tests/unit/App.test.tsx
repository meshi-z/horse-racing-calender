import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "../../src/App";
import { useRaceStore } from "../../src/store/useRaceStore";
import { useLanguageStore } from "../../src/store/useLanguageStore";
import * as useRacesModule from "../../src/hooks/useRaces";
import type { Race } from "../../src/types/race";

const mockRaces: Race[] = [
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

describe("App Integration", () => {
  beforeEach(() => {
    localStorage.clear();
    useLanguageStore.setState({ language: "ja" });
    useRaceStore.setState({
      races: mockRaces,
      viewMode: "timeline",
      currentYearMonth: { year: 2026, month: 2 },
      filters: {
        searchQuery: "",
        grades: [],
        trackTypes: [],
        sexConstraints: [],
        ageConstraints: [],
        courses: [],
        distanceCategories: [],
        yearMonth: null,
      },
    });
  });

  it("データ取得中 (isLoading) はスケルトンローディングが表示されること", () => {
    vi.spyOn(useRacesModule, "useRaces").mockReturnValue({
      isLoading: true,
      error: null,
      races: [],
    });

    render(<App />);

    expect(screen.getByRole("status", { name: "レース日程を読み込み中" })).toBeInTheDocument();
  });

  it("データ取得失敗 (error) はエラーアラートが表示されること", () => {
    vi.spyOn(useRacesModule, "useRaces").mockReturnValue({
      isLoading: false,
      error: new Error("ネットワークエラー"),
      races: [],
    });

    render(<App />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/レースデータの取得に失敗しました: ネットワークエラー/)).toBeInTheDocument();
  });

  it("viewMode が 'timeline' の場合、TimelineView がレンダリングされること", () => {
    vi.spyOn(useRacesModule, "useRaces").mockReturnValue({
      isLoading: false,
      error: null,
      races: mockRaces,
    });
    useRaceStore.setState({ viewMode: "timeline" });

    render(<App />);

    expect(screen.getByRole("feed", { name: "重賞レース タイムライン" })).toBeInTheDocument();
    expect(screen.getByText("表示: タイムライン")).toBeInTheDocument();
  });

  it("viewMode が 'calendar' の場合、CalendarView がレンダリングされること", () => {
    vi.spyOn(useRacesModule, "useRaces").mockReturnValue({
      isLoading: false,
      error: null,
      races: mockRaces,
    });
    useRaceStore.setState({ viewMode: "calendar" });

    render(<App />);

    expect(screen.getByRole("grid", { name: /カレンダー/ })).toBeInTheDocument();
    expect(screen.getByText("表示: 月間カレンダー")).toBeInTheDocument();
  });

  it("言語設定に応じて document.documentElement.lang と document.title が動的に更新されること", () => {
    vi.spyOn(useRacesModule, "useRaces").mockReturnValue({
      isLoading: false,
      error: null,
      races: mockRaces,
    });

    // 日本語モード
    useLanguageStore.setState({ language: "ja" });
    const { rerender } = render(<App />);

    expect(document.documentElement.lang).toBe("ja");
    expect(document.title).toBe("重賞カレンダー - JRA重賞レーススケジュール");
    expect(screen.getByText("該当レース: 1 件")).toBeInTheDocument();
    expect(screen.getByText("表示: タイムライン")).toBeInTheDocument();

    // 英語モードへ切り替え
    useLanguageStore.setState({ language: "en" });
    rerender(<App />);

    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe("JRA Graded Races Calendar - Schedule & Details");
    expect(screen.getByText("Matching races: 1")).toBeInTheDocument();
    expect(screen.getByText("View: Timeline")).toBeInTheDocument();
  });
});
