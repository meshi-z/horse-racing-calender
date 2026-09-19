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
});
