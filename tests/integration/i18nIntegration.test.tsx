import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
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
    is_time_confirmed: true,
    course: { ja: "東京", en: "Tokyo" },
    distance: 1600,
    track_type: "dirt",
    sex_constraint: "none",
    age_constraint: "4yo_and_up",
    handicap: { code: "weight_for_age", ja: "定量", en: "Weight for Age" },
  },
  {
    id: "2026-jra-g2-01",
    organization: "jra",
    name: { ja: "アメリカジョッキークラブカップ", en: "American Jockey Club Cup" },
    grade: "G2",
    date: "2026-02-23",
    original_date: "2026-02-22",
    is_rescheduled: true,
    start_time: "2026-02-23T06:45:00.000Z",
    is_time_confirmed: true,
    course: { ja: "中山", en: "Nakayama" },
    distance: 2200,
    track_type: "turf",
    sex_constraint: "none",
    age_constraint: "4yo_and_up",
    handicap: { code: "set_weight", ja: "別定", en: "Set Weight" },
  },
];

describe("i18n 全体結合テスト (Full i18n Integration Test)", () => {
  let originalGtag: any;

  beforeEach(() => {
    localStorage.clear();
    useLanguageStore.setState({ language: "ja" });
    useRaceStore.setState({
      races: mockRaces,
      viewMode: "timeline",
      currentYearMonth: { year: 2026, month: 2 },
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

    vi.spyOn(useRacesModule, "useRaces").mockReturnValue({
      isLoading: false,
      error: null,
      races: mockRaces,
    });

    originalGtag = (window as any).gtag;
    (window as any).gtag = vi.fn();
  });

  afterEach(() => {
    (window as any).gtag = originalGtag;
    vi.restoreAllMocks();
  });

  it("ヘッダーの言語切替ボタンを押下すると、アプリ全体のUI（ドキュメントメタ、ヘッダー、フィルターバー、タイムライン、詳細ダイアログ、フッター、免責事項）が日本語と英語で完全に同期して切り替わること", () => {
    render(<App />);

    // ==========================================
    // 1. 初期状態（日本語モード）の検証
    // ==========================================
    expect(document.documentElement.lang).toBe("ja");
    expect(document.title).toBe("重賞カレンダー - JRA, NAR, France Galop, UK, USA & HK 重賞レーススケジュール");
    expect(
      document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute("content")
    ).toBe("重賞カレンダー");

    // ヘッダー
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("重賞カレンダー");
    const langSelectJa = screen.getByRole("combobox", { name: "言語を選択 (日本語)" });
    expect(langSelectJa).toBeInTheDocument();

    // サブヘッダー
    expect(screen.getByText("該当レース: 2 件")).toBeInTheDocument();
    expect(screen.getByText("表示: タイムライン")).toBeInTheDocument();

    // フィルターバー
    const searchInput = screen.getByLabelText("レース名検索");
    expect(searchInput).toHaveAttribute(
      "placeholder",
      "レース名で検索（例: 有馬記念、東京大賞典、February、Tokyo Derby）"
    );
    expect(screen.getByText("グレード:")).toBeInTheDocument();
    expect(screen.getByText("馬場:")).toBeInTheDocument();
    expect(screen.getByText("距離:")).toBeInTheDocument();
    expect(screen.getByText("競馬場")).toBeInTheDocument();

    // タイムラインビュー & レースカード
    expect(screen.getByText("フェブラリーステークス")).toBeInTheDocument();
    expect(screen.getByText("February Stakes")).toBeInTheDocument();
    expect(screen.getByText("アメリカジョッキークラブカップ")).toBeInTheDocument();
    expect(screen.getByText(/当初予定:.*2026年2月22日.*から順延/)).toBeInTheDocument();

    // フッター
    expect(screen.getByText("© 2026 horse-racing-calendar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "免責事項・データ出典" })).toBeInTheDocument();
    expect(
      screen.getByText(/当サイトは非公式ファンサイトです。レース日程・発走時刻等の最新情報は必ず主催者/)
    ).toBeInTheDocument();

    // ==========================================
    // 2. 英語モードへの切り替え（Headerの言語切替Selectクリック）
    // ==========================================
    fireEvent.click(langSelectJa);
    const enOption = screen.getByRole("option", { name: /English \(EN\)/ });
    fireEvent.click(enOption);

    // GA4 イベント計測確認
    expect((window as any).gtag).toHaveBeenCalledWith(
      "event",
      "language_change",
      expect.objectContaining({
        from: "ja",
        to: "en",
      })
    );

    // ドキュメントメタの更新
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe("Graded Races - JRA, NAR, France Galop, UK, USA & HK Graded Races Calendar");
    expect(
      document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute("content")
    ).toBe("Graded Races");

    // ヘッダーの更新
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Graded Races");
    const langSelectEn = screen.getByRole("combobox", { name: "Select language (English)" });
    expect(langSelectEn).toBeInTheDocument();

    // サブヘッダーの更新
    expect(screen.getByText("Matching races: 2")).toBeInTheDocument();
    expect(screen.getByText("View: Timeline")).toBeInTheDocument();

    // フィルターバーの更新
    const enSearchInput = screen.getByLabelText("Search races");
    expect(enSearchInput).toHaveAttribute(
      "placeholder",
      "Search by race name (e.g. Arima Kinen, Tokyo Daishoten, February, Tokyo Derby)"
    );
    expect(screen.getByText("Grade:")).toBeInTheDocument();
    expect(screen.getByText("Track:")).toBeInTheDocument();
    expect(screen.getByText("Distance:")).toBeInTheDocument();
    expect(screen.getByText("Courses")).toBeInTheDocument();

    // タイムライン上のレースカード（タイトル反転: 英語がメイン、日本語がサブ）
    const febCard = screen.getByRole("button", { name: /February Stakes/ });
    expect(within(febCard).getByRole("heading", { level: 4 })).toHaveTextContent("February Stakes");
    expect(within(febCard).getByText("フェブラリーステークス")).toBeInTheDocument();
    expect(within(febCard).getByText("Tokyo")).toBeInTheDocument();
    expect(within(febCard).getByText(/Dirt/)).toBeInTheDocument();

    // 代替開催カードの英語表記
    expect(screen.getByText(/Postponed from.*Feb 22, 2026/)).toBeInTheDocument();

    // ==========================================
    // 3. レース詳細モーダルの連動確認 (RaceDetailDialog in English)
    // ==========================================
    fireEvent.click(febCard);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "February Stakes" })).toBeInTheDocument();
    expect(within(dialog).getByText("Course")).toBeInTheDocument();
    expect(within(dialog).getByText("Track & Distance")).toBeInTheDocument();
    expect(within(dialog).getByText("Eligibility & Weight")).toBeInTheDocument();
    expect(within(dialog).getByText("Open to All")).toBeInTheDocument();
    expect(within(dialog).getByText("4yo & Up")).toBeInTheDocument();
    expect(within(dialog).getByText("Weight: Weight for Age")).toBeInTheDocument();

    // ダイアログを閉じる
    const closeBtn = within(dialog).getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);

    // ==========================================
    // 4. カレンダービューへの切替 & カレンダーの英語連動確認
    // ==========================================
    const calendarModeBtn = screen.getByRole("tab", { name: "Calendar" });
    expect(calendarModeBtn).toBeInTheDocument();
    act(() => {
      useRaceStore.getState().setViewMode("calendar");
    });

    // カレンダーのグリッドと見出し
    expect(screen.getByRole("grid", { name: /February 2026 Calendar/ })).toBeInTheDocument();
    expect(screen.getByText("February 2026")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();

    // 曜日ヘッダー
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();

    // カレンダーセル内のレース名（英語）
    expect(screen.getByText("February Stakes")).toBeInTheDocument();

    // ==========================================
    // 5. 免責事項モーダルの英語連動確認 (DisclaimerDialog in English)
    // ==========================================
    const disclaimerTrigger = screen.getByRole("button", { name: "Disclaimer & Data Sources" });
    expect(disclaimerTrigger).toBeInTheDocument();
    fireEvent.click(disclaimerTrigger);

    expect(screen.getByRole("heading", { name: "Disclaimer & Data Sources" })).toBeInTheDocument();
    expect(screen.getByText("Unofficial Fan Site")).toBeInTheDocument();
    expect(screen.getByText("Data Sources")).toBeInTheDocument();
    expect(screen.getByText("Schedule Changes & Disclaimer")).toBeInTheDocument();
    expect(screen.getByText("Intellectual Property & Trademarks")).toBeInTheDocument();
    expect(screen.getByText("Access Analytics (Google Analytics)")).toBeInTheDocument();

    // 免責事項ダイアログを閉じる
    const disclaimerCloseBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(disclaimerCloseBtn);

    // ==========================================
    // 6. 再び日本語へ切り替えて元に戻ることを確認
    // ==========================================
    const langSelectEnForBack = screen.getByRole("combobox", { name: "Select language (English)" });
    fireEvent.click(langSelectEnForBack);
    const jaOption = screen.getByRole("option", { name: /日本語 \(JA\)/ });
    fireEvent.click(jaOption);

    expect(document.documentElement.lang).toBe("ja");
    expect(document.title).toBe("重賞カレンダー - JRA, NAR, France Galop, UK, USA & HK 重賞レーススケジュール");
    expect(
      document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute("content")
    ).toBe("重賞カレンダー");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("重賞カレンダー");
    expect(screen.getByText("2026年2月")).toBeInTheDocument();
    expect(screen.getByText("月")).toBeInTheDocument();
    expect(screen.getByText("フェブラリーステークス")).toBeInTheDocument();

    // ==========================================
    // 7. フランス語モードへの切り替えを確認
    // ==========================================
    const langSelectJaAgain = screen.getByRole("combobox", { name: "言語を選択 (日本語)" });
    fireEvent.click(langSelectJaAgain);
    const frOption = screen.getByRole("option", { name: /Français \(FR\)/ });
    fireEvent.click(frOption);

    expect(document.documentElement.lang).toBe("fr");
    expect(document.title).toBe("Courses de Groupe - Calendrier JRA, NAR, France Galop, UK, USA & HK");
    expect(
      document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute("content")
    ).toBe("Courses de Groupe");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Courses de Groupe");
    expect(screen.getByText("février 2026")).toBeInTheDocument();
  });
});
