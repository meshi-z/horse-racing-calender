import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TimelineView } from "../../src/features/timeline/TimelineView";
import { useRaceStore } from "../../src/store/useRaceStore";
import { useLanguageStore } from "../../src/store/useLanguageStore";
import type { Race } from "../../src/types/race";
import fs from "fs";
import path from "path";

// 10日分のモックレースデータを作成するヘルパー
function createMockRacesForDates(dateStrings: string[]): Race[] {
  return dateStrings.flatMap((date, i) => [
    {
      id: `mock-race-${i}-1`,
      organization: "jra" as const,
      name: { ja: `テスト重賞 ${date} A`, en: `Test Stakes ${date} A` },
      grade: "G3" as const,
      date,
      start_time: `${date}T06:40:00.000Z`,
      is_time_confirmed: true,
      course: { ja: "東京", en: "Tokyo" },
      distance: 1600,
      track_type: "turf" as const,
      sex_constraint: "none" as const,
      age_constraint: "4yo_and_up" as const,
      handicap: { code: "set_weight" as const, ja: "別定", en: "Set Weight" },
    },
    {
      id: `mock-race-${i}-2`,
      organization: "jra" as const,
      name: { ja: `テスト重賞 ${date} B`, en: `Test Stakes ${date} B` },
      grade: "G2" as const,
      date,
      start_time: `${date}T07:15:00.000Z`,
      is_time_confirmed: true,
      course: { ja: "阪神", en: "Hanshin" },
      distance: 2000,
      track_type: "turf" as const,
      sex_constraint: "none" as const,
      age_constraint: "4yo_and_up" as const,
      handicap: { code: "weight_for_age" as const, ja: "定量", en: "Weight for Age" },
    },
  ]);
}

describe("TimelineView 仮想スクロール / 遅延マウント (Issue #180, NFR 準拠)", () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: "ja" });
    useRaceStore.setState({
      filters: {
        organizations: [],
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

  it("大規模データセット時（> 5日）にターゲット日付のみ即時描画され、他日付はプレースホルダー化されること", () => {
    const dates = [
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
    ];
    const mockRaces = createMockRacesForDates(dates);

    // 仮想時刻を 2026-03-05 に設定（2026-03-05 がターゲット日付となる）
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T00:00:00.000Z"));

    render(<TimelineView races={mockRaces} />);

    // ターゲット日付（2026-03-05）のカードは即時描画されていること
    expect(screen.getByText("テスト重賞 2026-03-05 A")).toBeInTheDocument();
    expect(screen.getByText("テスト重賞 2026-03-05 B")).toBeInTheDocument();

    // 画面外の他日付（例: 2026-03-01, 2026-03-10）はプレースホルダーが展開され、カードはマウントされないこと
    expect(screen.getByTestId("timeline-placeholder-2026-03-01")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-placeholder-2026-03-10")).toBeInTheDocument();
    expect(screen.queryByText("テスト重賞 2026-03-01 A")).not.toBeInTheDocument();
    expect(screen.queryByText("テスト重賞 2026-03-10 A")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("IntersectionObserver で画面内侵入時にカードがマウントされ、画面外退出時にアンマウントされること", () => {
    const dates = [
      "2026-04-01",
      "2026-04-02",
      "2026-04-03",
      "2026-04-04",
      "2026-04-05",
      "2026-04-06",
    ];
    const mockRaces = createMockRacesForDates(dates);

    // 観察対象の要素とコールバックを保持するモック
    const observersMap = new Map<Element, (entry: IntersectionObserverEntry) => void>();

    class ControllableIntersectionObserver {
      callback: IntersectionObserverCallback;
      targetElement: Element | null = null;

      constructor(cb: IntersectionObserverCallback) {
        this.callback = cb;
      }
      observe(el: Element) {
        this.targetElement = el;
        observersMap.set(el, (entry) => this.callback([entry], this as unknown as IntersectionObserver));
      }
      unobserve(el: Element) {
        observersMap.delete(el);
      }
      disconnect() {
        if (this.targetElement) observersMap.delete(this.targetElement);
      }
    }

    const originalIO = window.IntersectionObserver;
    window.IntersectionObserver = ControllableIntersectionObserver as unknown as typeof IntersectionObserver;

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T00:00:00.000Z"));

    render(<TimelineView races={mockRaces} />);

    // 2026-04-06 は初期状態ではプレースホルダー
    expect(screen.getByTestId("timeline-placeholder-2026-04-06")).toBeInTheDocument();
    expect(screen.queryByText("テスト重賞 2026-04-06 A")).not.toBeInTheDocument();

    const section0406 = document.getElementById("section-date-2026-04-06");
    expect(section0406).toBeInTheDocument();

    const trigger0406 = observersMap.get(section0406!);
    expect(trigger0406).toBeDefined();

    // 画面内に侵入（isIntersecting: true）をシミュレート
    act(() => {
      trigger0406!({ isIntersecting: true } as IntersectionObserverEntry);
    });

    // カードがマウントされ、プレースホルダーが解除されること
    expect(screen.queryByTestId("timeline-placeholder-2026-04-06")).not.toBeInTheDocument();
    expect(screen.getByText("テスト重賞 2026-04-06 A")).toBeInTheDocument();
    expect(screen.getByText("テスト重賞 2026-04-06 B")).toBeInTheDocument();

    // 画面外へ退出（isIntersecting: false）をシミュレート
    act(() => {
      trigger0406!({ isIntersecting: false } as IntersectionObserverEntry);
    });

    // 再度アンマウントされプレースホルダーに戻ること
    expect(screen.getByTestId("timeline-placeholder-2026-04-06")).toBeInTheDocument();
    expect(screen.queryByText("テスト重賞 2026-04-06 A")).not.toBeInTheDocument();

    window.IntersectionObserver = originalIO;
    vi.useRealTimers();
  });

  it("実データ（全1,336レース / 276開催日）読み込み時でも、DOMノード数が1,500個以下に抑制されること (NFR 2.2 達成ベンチマーク)", () => {
    const racesFilePath = path.resolve(__dirname, "../../public/data/races.json");
    const rawData = fs.readFileSync(racesFilePath, "utf8");
    const allRaces: Race[] = JSON.parse(rawData);

    expect(allRaces.length).toBeGreaterThanOrEqual(1300);

    // 仮想時刻を 2026-05-01 に設定
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T00:00:00.000Z"));

    const { container } = render(<TimelineView races={allRaces} />);

    // コンテナ内の全DOMノード数を計測
    const totalDomNodes = container.querySelectorAll("*").length;
    console.log(`[Benchmark] Total DOM nodes with 1,336 races: ${totalDomNodes}`);

    // NFR 2.2 で策定された SLO: 常時 1,500 ノード以下
    expect(totalDomNodes).toBeLessThanOrEqual(1500);

    // ターゲット日付セクションが存在し、カードがマウントされていること
    const targetSection = container.querySelector("#section-date-2026-05-02");
    expect(targetSection).toBeInTheDocument();

    vi.useRealTimers();
  });
});
