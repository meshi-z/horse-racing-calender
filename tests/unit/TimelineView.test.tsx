import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineView } from "../../src/features/timeline/TimelineView";
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
    id: "2026-jra-g3-02",
    organization: "jra",
    name: { ja: "日刊スポーツ賞中山金杯", en: "Nakayama Kimpai" },
    grade: "G3",
    date: "2026-01-04",
    start_time: "2026-01-04T06:40:00.000Z",
    is_time_confirmed: false,
    course: { ja: "中山", en: "Nakayama" },
    distance: 2000,
    track_type: "turf",
    sex_constraint: "none",
    age_constraint: "4yo_and_up",
    handicap: { code: "handicap", ja: "ハンデ", en: "Handicap" },
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

describe("TimelineView", () => {
  beforeEach(() => {
    useRaceStore.setState({ filters: { searchQuery: "", grades: [], trackTypes: [], sexConstraints: [], ageConstraints: [], courses: [], yearMonth: null } });
  });

  it("レース開催日ごとにグループ化され、各日付ヘッダーが表示されること", () => {
    render(<TimelineView races={mockRaces} />);

    // 2026年1月4日(日)のヘッダーとレース数
    expect(screen.getByRole("heading", { name: /2026年1月4日/ })).toBeInTheDocument();
    expect(screen.getByText("(2レース)")).toBeInTheDocument();

    // 2026年2月22日(日)のヘッダーとレース数
    expect(screen.getByRole("heading", { name: /2026年2月22日/ })).toBeInTheDocument();
    expect(screen.getByText("(1レース)")).toBeInTheDocument();

    // 各レースのカードが描画されていること
    expect(screen.getByText("スポーツニッポン賞京都金杯")).toBeInTheDocument();
    expect(screen.getByText("日刊スポーツ賞中山金杯")).toBeInTheDocument();
    expect(screen.getByText("フェブラリーステークス")).toBeInTheDocument();
  });

  it("フィルタ結果が 0 件の場合、空状態プレースホルダーとリセットボタンが表示されること", () => {
    const resetFiltersSpy = vi.spyOn(useRaceStore.getState(), "resetFilters");
    render(<TimelineView races={[]} />);

    expect(screen.getByText("該当するレースがありません")).toBeInTheDocument();
    expect(
      screen.getByText("検索キーワードやフィルター条件を変更するか、条件のリセットをお試しください。")
    ).toBeInTheDocument();

    const resetButton = screen.getByRole("button", { name: /フィルターをリセット/ });
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);
    expect(resetFiltersSpy).toHaveBeenCalled();
  });

  it("アクセシビリティ: feed ロールとセクションの見出しが関連付けられていること", () => {
    render(<TimelineView races={mockRaces} />);

    const feed = screen.getByRole("feed", { name: "重賞レース タイムライン" });
    expect(feed).toBeInTheDocument();

    // 各セクションの aria-labelledby 検証
    const section1 = feed.querySelector('section[aria-labelledby="heading-date-2026-01-04"]');
    expect(section1).toBeInTheDocument();
  });

  it("代替開催レースが含まれる場合、新日程グループに代替開催バッジ付きで表示されること", () => {
    const rescheduledRaces: Race[] = [
      {
        ...mockRaces[2],
        date: "2026-02-23", // 2/22(日) から 2/23(月) に順延
        is_rescheduled: true,
        original_date: "2026-02-22",
      },
    ];

    render(<TimelineView races={rescheduledRaces} />);

    // 順延後の日付ヘッダー
    expect(screen.getByRole("heading", { name: /2026年2月23日/ })).toBeInTheDocument();
    // 代替開催バッジ
    expect(screen.getByText("代替開催")).toBeInTheDocument();
    // 当初予定からの順延案内
    expect(screen.getByText(/当初予定: 2026年2月22日\(日\) から順延/)).toBeInTheDocument();
  });

  it("初期表示時に今日以降の直近レース日付セクションへ自動スクロールされること", () => {
    // 仮想時刻を 2026-02-01 に設定（2026-02-22 のレースが直近となる）
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));

    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    render(<TimelineView races={mockRaces} />);

    // setTimeout を進める
    vi.runAllTimers();

    // 2026-02-22 のセクション要素を取得
    const targetSection = document.getElementById("section-date-2026-02-22");
    expect(targetSection).toBeInTheDocument();
    expect(targetSection).toHaveClass("scroll-mt-16");

    // scrollIntoView が呼び出されたことを確認
    expect(scrollIntoViewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        block: "start",
      })
    );

    vi.useRealTimers();
  });

  it("当日のレースがある場合、日付ヘッダーおよび対象レースカードが強調（本日開催バッジ・ハイライト）表示されること", () => {
    // 仮想時刻を 2026-01-04 (当日) に設定
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 4, 10, 0, 0));

    render(<TimelineView races={mockRaces} />);

    // 日付ヘッダーおよびカード内の「本日開催」バッジが表示されること
    const todayBadges = screen.getAllByText("本日開催");
    expect(todayBadges.length).toBeGreaterThanOrEqual(1);

    // 2026-01-04 のセクションヘッダーが強調スタイル（border-primary/30）を持つこと
    const section = document.getElementById("section-date-2026-01-04");
    expect(section).toBeInTheDocument();
    const dateHeader = section?.querySelector(".sticky");
    expect(dateHeader).toHaveClass("border-primary/30");

    vi.useRealTimers();
  });

  it("日付ヘッダーにFilterBar高さに連動するsticky topオフセットおよびz-20が設定されていること", () => {
    render(<TimelineView races={mockRaces} />);

    const feed = screen.getByRole("feed", { name: "重賞レース タイムライン" });
    const section = feed.querySelector("#section-date-2026-01-04");
    expect(section).toBeInTheDocument();

    const dateHeader = section?.querySelector(".sticky");
    expect(dateHeader).toBeInTheDocument();
    expect(dateHeader).toHaveClass("z-20");
    expect(dateHeader).toHaveStyle({
      top: "calc(3.5rem + var(--filterbar-height, 0px))",
    });
  });
});
