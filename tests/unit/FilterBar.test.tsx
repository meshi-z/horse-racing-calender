import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { FilterBar } from "../../src/components/shared/FilterBar";
import { useRaceStore } from "../../src/store/useRaceStore";
import { useLanguageStore } from "../../src/store/useLanguageStore";

describe("FilterBar", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
    useLanguageStore.setState({ language: "ja" });
    useRaceStore.getState().resetFilters();
  });

  it("検索入力に入力した内容が store.filters.searchQuery に反映されること", () => {
    render(<FilterBar />);
    const input = screen.getByLabelText("レース名検索");

    fireEvent.change(input, { target: { value: "金杯" } });
    expect(useRaceStore.getState().filters.searchQuery).toBe("金杯");

    // クリアボタンを押下
    const clearBtn = screen.getByLabelText("検索キーワードをクリア");
    fireEvent.click(clearBtn);
    expect(useRaceStore.getState().filters.searchQuery).toBe("");
  });

  it("グレードボタンをクリックすると store.filters.grades にトグル反映されること", () => {
    render(<FilterBar />);
    const g1Btn = screen.getByRole("button", { name: "G1" });

    // 選択
    fireEvent.click(g1Btn);
    expect(useRaceStore.getState().filters.grades).toContain("G1");

    // 解除
    fireEvent.click(g1Btn);
    expect(useRaceStore.getState().filters.grades).not.toContain("G1");
  });

  it("馬場種別ボタンをクリックすると store.filters.trackTypes にトグル反映されること", () => {
    render(<FilterBar />);
    const turfBtn = screen.getByRole("button", { name: "芝" });

    fireEvent.click(turfBtn);
    expect(useRaceStore.getState().filters.trackTypes).toContain("turf");

    fireEvent.click(turfBtn);
    expect(useRaceStore.getState().filters.trackTypes).not.toContain("turf");
  });

  it("リセットボタンをクリックすると全フィルターが初期化されること", () => {
    render(<FilterBar />);
    const input = screen.getByLabelText("レース名検索");
    fireEvent.change(input, { target: { value: "有馬" } });

    const g1Btn = screen.getByRole("button", { name: "G1" });
    fireEvent.click(g1Btn);

    const resetBtn = screen.getByRole("button", { name: "フィルターをリセット" });
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);

    expect(useRaceStore.getState().filters.searchQuery).toBe("");
    expect(useRaceStore.getState().filters.grades).toEqual([]);
    expect(useRaceStore.getState().filters.trackTypes).toEqual([]);
    expect(useRaceStore.getState().filters.courses).toEqual([]);
    expect(useRaceStore.getState().filters.distanceCategories).toEqual([]);
  });

  it("ヘッダー直下に固定表示するための sticky top-14 z-30 クラスが設定されていること", () => {
    render(<FilterBar />);
    const bar = screen.getByTestId("filter-bar");
    expect(bar).toHaveClass("sticky");
    expect(bar).toHaveClass("top-14");
    expect(bar).toHaveClass("z-30");
  });

  it("ページスクロール時もボタンや入力欄が縮小されず通常サイズと影が維持されること (Issue #33)", () => {
    render(<FilterBar />);
    const bar = screen.getByTestId("filter-bar");
    const input = screen.getByLabelText("レース名検索");
    const g1Btn = screen.getByRole("button", { name: "G1" });

    expect(bar).toHaveAttribute("data-scrolled", "false");
    expect(bar).toHaveClass("p-3.5");
    expect(input).toHaveClass("h-9");
    expect(g1Btn).toHaveClass("min-h-[30px]");

    // スクロール位置を 50px に変更してイベント発火
    Object.defineProperty(window, "scrollY", { value: 50, writable: true, configurable: true });
    fireEvent.scroll(window);

    expect(bar).toHaveAttribute("data-scrolled", "true");
    expect(bar).toHaveClass("shadow-md");

    // スクロール後もパディング、入力欄の高さ、ボタンの高さが維持されていること（コンパクト縮小されない）
    expect(bar).toHaveClass("p-3.5");
    expect(input).toHaveClass("h-9");
    expect(g1Btn).toHaveClass("min-h-[30px]");

    // 最上部へスクロールバック
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
    fireEvent.scroll(window);

    expect(bar).toHaveAttribute("data-scrolled", "false");
    expect(bar).toHaveClass("p-3.5");
  });

  it("競馬場ボタンをクリックすると展開パネルが開き、各競馬場をトグル選択できること (Issue #35)", () => {
    render(<FilterBar />);

    const courseToggleBtn = screen.getByRole("button", {
      name: "競馬場フィルターを展開",
    });
    expect(courseToggleBtn).toBeInTheDocument();
    expect(screen.queryByTestId("course-filter-panel")).not.toBeInTheDocument();

    // 展開パネルを開く
    fireEvent.click(courseToggleBtn);
    expect(screen.getByTestId("course-filter-panel")).toBeInTheDocument();

    // 東京競馬場を選択
    const tokyoBtn = screen.getByRole("button", { name: "東京" });
    fireEvent.click(tokyoBtn);
    expect(useRaceStore.getState().filters.courses).toContain("東京");

    // 阪神競馬場も選択（複数選択）
    const hanshinBtn = screen.getByRole("button", { name: "阪神" });
    fireEvent.click(hanshinBtn);
    expect(useRaceStore.getState().filters.courses).toEqual(["東京", "阪神"]);

    // 東京を再度クリックして解除
    fireEvent.click(tokyoBtn);
    expect(useRaceStore.getState().filters.courses).toEqual(["阪神"]);

    // パネル内のクリアボタンで全解除
    const clearCoursesBtn = screen.getByRole("button", {
      name: "競馬場選択をクリア",
    });
    fireEvent.click(clearCoursesBtn);
    expect(useRaceStore.getState().filters.courses).toEqual([]);
  });

  it("競馬場パネルが折りたたまれている場合でも選択中バッジが表示され個別解除できること (Issue #35)", () => {
    // ストアに直接競馬場を設定
    useRaceStore.getState().setFilter("courses", ["中山", "京都"]);

    render(<FilterBar />);

    // パネルが閉じていてもバッジが表示される
    const badgesBar = screen.getByTestId("selected-courses-bar");
    expect(badgesBar).toBeInTheDocument();
    expect(screen.getByText("中山")).toBeInTheDocument();
    expect(screen.getByText("京都")).toBeInTheDocument();

    // 中山の解除ボタンをクリック
    const removeNakayamaBtn = screen.getByRole("button", {
      name: "中山の絞り込みを解除",
    });
    fireEvent.click(removeNakayamaBtn);
    expect(useRaceStore.getState().filters.courses).toEqual(["京都"]);

    // バッジバーのクリアボタンで全解除
    const clearBtn = screen.getByRole("button", { name: "クリア" });
    fireEvent.click(clearBtn);
    expect(useRaceStore.getState().filters.courses).toEqual([]);
    expect(screen.queryByTestId("selected-courses-bar")).not.toBeInTheDocument();
  });

  it("距離ボタンをクリックすると store.filters.distanceCategories にトグル反映されること (Issue #36)", () => {
    render(<FilterBar />);

    const sprintBtn = screen.getByRole("button", { name: "距離フィルター: 短距離（1400m以下（スプリント））" });
    const mileBtn = screen.getByRole("button", { name: "距離フィルター: マイル（1500〜1700m（マイル））" });
    const intermediateBtn = screen.getByRole("button", { name: "距離フィルター: 中距離（1800〜2200m（中距離））" });
    const longBtn = screen.getByRole("button", { name: "距離フィルター: 長距離（2400m以上（長距離・障害））" });

    expect(sprintBtn).toBeInTheDocument();
    expect(mileBtn).toBeInTheDocument();
    expect(intermediateBtn).toBeInTheDocument();
    expect(longBtn).toBeInTheDocument();

    // マイルを選択
    fireEvent.click(mileBtn);
    expect(useRaceStore.getState().filters.distanceCategories).toEqual(["mile"]);

    // 中距離も選択（複数選択）
    fireEvent.click(intermediateBtn);
    expect(useRaceStore.getState().filters.distanceCategories).toEqual(["mile", "intermediate"]);

    // マイルを再クリックして解除
    fireEvent.click(mileBtn);
    expect(useRaceStore.getState().filters.distanceCategories).toEqual(["intermediate"]);

    // 中距離も解除
    fireEvent.click(intermediateBtn);
    expect(useRaceStore.getState().filters.distanceCategories).toEqual([]);
  });

  describe("英語モード (English mode)", () => {
    beforeEach(() => {
      useLanguageStore.setState({ language: "en" });
    });

    it("英語のプレースホルダー・aria-label・セクション見出しが表示されること", () => {
      render(<FilterBar />);
      const input = screen.getByLabelText("Search races");
      expect(input).toHaveAttribute("placeholder", "Search by race name (e.g. Arima Kinen, Tokyo Daishoten, February, Tokyo Derby)");
      expect(screen.getByText("Grade:")).toBeInTheDocument();
      expect(screen.getByText("Track:")).toBeInTheDocument();
      expect(screen.getByText("Distance:")).toBeInTheDocument();
      expect(screen.getByText("Courses")).toBeInTheDocument();
    });

    it("馬場種別・距離・競馬場パネルのラベルが英語で表示され操作できること", () => {
      render(<FilterBar />);
      const turfBtn = screen.getByRole("button", { name: "Turf" });
      fireEvent.click(turfBtn);
      expect(useRaceStore.getState().filters.trackTypes).toContain("turf");

      const sprintBtn = screen.getByRole("button", {
        name: "Distance filter: Sprint (~1,400m (Sprint))",
      });
      fireEvent.click(sprintBtn);
      expect(useRaceStore.getState().filters.distanceCategories).toContain("sprint");

      // 競馬場パネル展開
      const courseExpandBtn = screen.getByRole("button", { name: "Toggle course filter" });
      fireEvent.click(courseExpandBtn);
      expect(screen.getByText("Select courses (multiple choice):")).toBeInTheDocument();

      const tokyoBtn = screen.getByRole("button", { name: "Tokyo" });
      fireEvent.click(tokyoBtn);
      expect(useRaceStore.getState().filters.courses).toContain("東京");
    });

    it("選択中の競馬場バッジが英語表記され解除できること", () => {
      useRaceStore.getState().setFilter("courses", ["東京", "阪神"]);
      render(<FilterBar />);

      expect(screen.getByText("Selected courses:")).toBeInTheDocument();
      expect(screen.getByText("Tokyo")).toBeInTheDocument();
      expect(screen.getByText("Hanshin")).toBeInTheDocument();

      const removeTokyoBtn = screen.getByRole("button", { name: "Remove Tokyo filter" });
      fireEvent.click(removeTokyoBtn);
      expect(useRaceStore.getState().filters.courses).toEqual(["阪神"]);

      const clearBtn = screen.getByRole("button", { name: "Clear" });
      fireEvent.click(clearBtn);
      expect(useRaceStore.getState().filters.courses).toEqual([]);
    });

    it("リセットボタンが英語で表示され機能すること", () => {
      useRaceStore.getState().setFilter("grades", ["G1"]);
      render(<FilterBar />);

      const resetBtn = screen.getByRole("button", { name: "Reset filters" });
      expect(resetBtn).toBeInTheDocument();
      expect(screen.getByText("Reset")).toBeInTheDocument();
      fireEvent.click(resetBtn);
      expect(useRaceStore.getState().filters.grades).toEqual([]);
    });
  });

  describe("NAR全重賞・ばんえい競馬・新グレード対応 (Step 20 - Phase 3)", () => {
    it("主催者セグメントコントロールで複数選択（JRA + NAR同時選択など）および All が機能すること", () => {
      render(<FilterBar />);
      const jraBtn = screen.getByRole("button", { name: "JRA (中央)" });
      const narBtn = screen.getByRole("button", { name: "地方競馬 (NAR)" });
      const franceBtn = screen.getByRole("button", { name: "フランス (France)" });
      const allBtn = screen.getByRole("button", { name: "すべて" });

      // 初期状態は All または地域初期値。まずは「すべて」を押して空に
      fireEvent.click(allBtn);
      expect(useRaceStore.getState().filters.organizations).toEqual([]);
      expect(allBtn).toHaveAttribute("aria-pressed", "true");

      // JRA を選択
      fireEvent.click(jraBtn);
      expect(useRaceStore.getState().filters.organizations).toEqual(["jra"]);
      expect(jraBtn).toHaveAttribute("aria-pressed", "true");
      expect(allBtn).toHaveAttribute("aria-pressed", "false");

      // NAR を追加選択（JRA + NAR の複数選択）
      fireEvent.click(narBtn);
      expect(useRaceStore.getState().filters.organizations).toEqual(["jra", "nar"]);
      expect(jraBtn).toHaveAttribute("aria-pressed", "true");
      expect(narBtn).toHaveAttribute("aria-pressed", "true");

      // France を追加選択
      fireEvent.click(franceBtn);
      expect(useRaceStore.getState().filters.organizations).toEqual(["jra", "nar", "france_galop"]);

      // JRA をトグル解除
      fireEvent.click(jraBtn);
      expect(useRaceStore.getState().filters.organizations).toEqual(["nar", "france_galop"]);
      expect(jraBtn).toHaveAttribute("aria-pressed", "false");

      // すべて を選択するとクリアされること
      fireEvent.click(allBtn);
      expect(useRaceStore.getState().filters.organizations).toEqual([]);
      expect(allBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("ダートグレード(Jpn1)、南関重賞(S1)、地方重賞(local_grade)がトグル選択できること", () => {
      render(<FilterBar />);
      const jpn1Btn = screen.getByRole("button", { name: "Jpn1" });
      const s1Btn = screen.getByRole("button", { name: "S1" });
      const localBtn = screen.getByRole("button", { name: "地方重賞" });

      fireEvent.click(jpn1Btn);
      expect(useRaceStore.getState().filters.grades).toContain("Jpn1");

      fireEvent.click(s1Btn);
      expect(useRaceStore.getState().filters.grades).toContain("S1");

      fireEvent.click(localBtn);
      expect(useRaceStore.getState().filters.grades).toContain("local_grade");

      // 解除
      fireEvent.click(jpn1Btn);
      expect(useRaceStore.getState().filters.grades).not.toContain("Jpn1");
    });

    it("ダートグレード一括トグルで Jpn1〜Jpn3 がまとめて選択・解除できること", () => {
      render(<FilterBar />);
      const dirtGroupBtn = screen.getByRole("button", { name: "ダートグレード一括" });

      // 一括選択
      fireEvent.click(dirtGroupBtn);
      expect(useRaceStore.getState().filters.grades).toEqual(
        expect.arrayContaining(["Jpn1", "Jpn2", "Jpn3"])
      );

      // 再度クリックで一括解除
      fireEvent.click(dirtGroupBtn);
      expect(useRaceStore.getState().filters.grades).not.toEqual(
        expect.arrayContaining(["Jpn1", "Jpn2", "Jpn3"])
      );
    });

    it("馬場種別の「ばんえい」および「AW」ボタンをクリックすると store.filters.trackTypes に反映されること", () => {
      render(<FilterBar />);
      const baneiBtn = screen.getByRole("button", { name: "ばんえい" });
      const awBtn = screen.getByRole("button", { name: "AW" });

      fireEvent.click(baneiBtn);
      expect(useRaceStore.getState().filters.trackTypes).toContain("banei");

      fireEvent.click(awBtn);
      expect(useRaceStore.getState().filters.trackTypes).toContain("aw");

      fireEvent.click(baneiBtn);
      expect(useRaceStore.getState().filters.trackTypes).not.toContain("banei");
      expect(useRaceStore.getState().filters.trackTypes).toContain("aw");
    });

    it("競馬場パネルで5つのグループ（中央、南関、その他地方、ばんえい、フランス）が表示され、グループ一括選択ができること", () => {
      render(<FilterBar />);
      const expandBtn = screen.getByRole("button", { name: "競馬場フィルターを展開" });
      fireEvent.click(expandBtn);

      // グループ見出しの確認
      const coursePanel = screen.getByTestId("course-filter-panel");
      expect(within(coursePanel).getByText("中央競馬 (JRA)")).toBeInTheDocument();
      expect(within(coursePanel).getByText("南関東 (NAR)")).toBeInTheDocument();
      expect(within(coursePanel).getByText("その他地方 (NAR)")).toBeInTheDocument();
      expect(within(coursePanel).getByText("ばんえい (NAR)")).toBeInTheDocument();
      expect(within(coursePanel).getByText("フランス (France)")).toBeInTheDocument();
      expect(within(coursePanel).getByText("イギリス (UK)")).toBeInTheDocument();

      // フランス競馬場（パリロンシャン）を選択
      const longchampBtn = screen.getByRole("button", { name: "パリロンシャン" });
      fireEvent.click(longchampBtn);
      expect(useRaceStore.getState().filters.courses).toContain("パリロンシャン");

      // イギリス競馬場（アスコット）を選択
      const ascotBtn = screen.getByRole("button", { name: "アスコット" });
      fireEvent.click(ascotBtn);
      expect(useRaceStore.getState().filters.courses).toContain("アスコット");

      // 南関競馬（大井）を選択
      const oiBtn = screen.getByRole("button", { name: "大井" });
      fireEvent.click(oiBtn);
      expect(useRaceStore.getState().filters.courses).toContain("大井");

      // アメリカ競馬場（チャーチルダウンズ）を選択
      const churchillBtn = screen.getByRole("button", { name: "チャーチルダウンズ" });
      fireEvent.click(churchillBtn);
      expect(useRaceStore.getState().filters.courses).toContain("チャーチルダウンズ");
    });

    it("主催者フィルターでイギリス (UK) およびアメリカ (Equibase) を選択できること", () => {
      render(<FilterBar />);
      const ukOrgBtn = screen.getByRole("button", { name: "イギリス (UK)" });
      expect(ukOrgBtn).toBeInTheDocument();

      fireEvent.click(ukOrgBtn);
      expect(useRaceStore.getState().filters.organizations).toContain("bha");

      const usaOrgBtn = screen.getByRole("button", { name: "アメリカ (Equibase)" });
      expect(usaOrgBtn).toBeInTheDocument();

      fireEvent.click(usaOrgBtn);
      expect(useRaceStore.getState().filters.organizations).toContain("equibase");
    });
  });

  describe("スマホ画面での開催国・主催者フィルターUI (Issue #92)", () => {
    it("モバイル用トリガーボタンからダイアログが開き、地域別グルーピング（日本・欧州・アメリカ）が表示されること", () => {
      useRaceStore.getState().setFilter("organizations", ["jra", "nar"]);
      render(<FilterBar />);

      const triggerBtn = screen.getByRole("button", { name: "開催国・主催者の選択" });
      expect(triggerBtn).toBeInTheDocument();
      expect(triggerBtn).toHaveTextContent("🇯🇵 日本 (2)");

      // ダイアログを開く
      fireEvent.click(triggerBtn);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("表示する競馬の開催団体を選択してください（複数選択可）")).toBeInTheDocument();
      // 日本はすでに全選択されているため「解除」、欧州は未選択のため「欧州全重賞」、アメリカは未選択のため「米国全重賞」
      expect(screen.getByRole("button", { name: "解除" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "欧州全重賞" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "米国全重賞" })).toBeInTheDocument();
    });

    it("ダイアログ内で日本全重賞の一括解除・一括選択が動作すること", () => {
      useRaceStore.getState().setFilter("organizations", ["jra", "nar"]);
      render(<FilterBar />);

      const triggerBtn = screen.getByRole("button", { name: "開催国・主催者の選択" });
      fireEvent.click(triggerBtn);

      // 解除（日本全重賞がすでに選択されているため「解除」ボタンになっている）
      const clearJapanBtn = screen.getByRole("button", { name: "解除" });
      fireEvent.click(clearJapanBtn);
      expect(useRaceStore.getState().filters.organizations).not.toContain("jra");
      expect(useRaceStore.getState().filters.organizations).not.toContain("nar");

      // 一括選択
      const allJapanBtn = screen.getByRole("button", { name: "日本全重賞" });
      fireEvent.click(allJapanBtn);
      expect(useRaceStore.getState().filters.organizations).toContain("jra");
      expect(useRaceStore.getState().filters.organizations).toContain("nar");
    });

    it("ダイアログ内で欧州全重賞および米国全重賞の一括選択が動作すること", () => {
      useRaceStore.getState().setFilter("organizations", []);
      render(<FilterBar />);

      const triggerBtn = screen.getByRole("button", { name: "開催国・主催者の選択" });
      fireEvent.click(triggerBtn);

      const allEuropeBtn = screen.getByRole("button", { name: "欧州全重賞" });
      fireEvent.click(allEuropeBtn);
      expect(useRaceStore.getState().filters.organizations).toEqual(["france_galop", "bha"]);

      const allAmericaBtn = screen.getByRole("button", { name: "米国全重賞" });
      fireEvent.click(allAmericaBtn);
      expect(useRaceStore.getState().filters.organizations).toEqual(["france_galop", "bha", "equibase"]);
    });

    it("ダイアログ内の「完了」ボタンでダイアログを閉じられること", () => {
      render(<FilterBar />);

      const triggerBtn = screen.getByRole("button", { name: "開催国・主催者の選択" });
      fireEvent.click(triggerBtn);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      const doneBtn = screen.getByRole("button", { name: "完了" });
      fireEvent.click(doneBtn);
    });
  });

  describe("アコーディオン型折りたたみ/展開機能 (Issue #51)", () => {
    it("初期状態（最上部）では詳細フィルターパネルが展開表示されていること", () => {
      render(<FilterBar />);
      expect(screen.getByTestId("detailed-filters-panel")).toBeInTheDocument();
      const toggleBtn = screen.getByRole("button", { name: "フィルターを折りたたむ" });
      expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
      expect(toggleBtn).toHaveAttribute("aria-controls", "detailed-filters-panel");
    });

    it("スクロール時に詳細フィルターが自動で折りたたまれ、展開ボタンで再展開できること", () => {
      render(<FilterBar />);
      expect(screen.getByTestId("detailed-filters-panel")).toBeInTheDocument();

      // スクロール実行
      Object.defineProperty(window, "scrollY", { value: 50, writable: true, configurable: true });
      fireEvent.scroll(window);

      // 自動折りたたみ確認
      expect(screen.queryByTestId("detailed-filters-panel")).not.toBeInTheDocument();
      const expandBtn = screen.getByRole("button", { name: "フィルターを展開" });
      expect(expandBtn).toHaveAttribute("aria-expanded", "false");

      // 手動で展開ボタンをクリック
      fireEvent.click(expandBtn);
      expect(screen.getByTestId("detailed-filters-panel")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "フィルターを折りたたむ" })).toHaveAttribute("aria-expanded", "true");
    });

    it("手動展開後にスクロールしても展開状態が維持されること（意図の尊重）", () => {
      render(<FilterBar />);

      // スクロールで折りたたみ
      Object.defineProperty(window, "scrollY", { value: 50, writable: true, configurable: true });
      fireEvent.scroll(window);
      expect(screen.queryByTestId("detailed-filters-panel")).not.toBeInTheDocument();

      // 手動で展開
      const expandBtn = screen.getByRole("button", { name: "フィルターを展開" });
      fireEvent.click(expandBtn);
      expect(screen.getByTestId("detailed-filters-panel")).toBeInTheDocument();

      // さらにスクロールしても展開されたまま
      Object.defineProperty(window, "scrollY", { value: 100, writable: true, configurable: true });
      fireEvent.scroll(window);
      expect(screen.getByTestId("detailed-filters-panel")).toBeInTheDocument();

      // 最上部へ戻ると手動フラグがリセットされ、引き続き展開されている
      Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
      fireEvent.scroll(window);
      expect(screen.getByTestId("detailed-filters-panel")).toBeInTheDocument();

      // 再びスクロールすると、リセットされたため自動で折りたたまれる
      Object.defineProperty(window, "scrollY", { value: 50, writable: true, configurable: true });
      fireEvent.scroll(window);
      expect(screen.queryByTestId("detailed-filters-panel")).not.toBeInTheDocument();
    });

    it("折りたたみ状態でも適用中のフィルター件数バッジおよび要約バッジが表示され、個別解除とリセットができること", () => {
      // グレード、馬場、距離、競馬場を複数選択
      useRaceStore.getState().setFilter("grades", ["G1"]);
      useRaceStore.getState().setFilter("trackTypes", ["turf"]);
      useRaceStore.getState().setFilter("distanceCategories", ["mile"]);
      useRaceStore.getState().setFilter("courses", ["東京"]);

      render(<FilterBar />);

      // スクロールして折りたたむ
      Object.defineProperty(window, "scrollY", { value: 50, writable: true, configurable: true });
      fireEvent.scroll(window);

      // バッジ件数の確認 (4件)
      const countBadge = screen.getByTestId("filter-badge-count");
      expect(countBadge).toHaveTextContent("4");

      // 要約バッジバーの表示確認
      const summaryBar = screen.getByTestId("active-filters-summary");
      expect(summaryBar).toBeInTheDocument();
      expect(summaryBar).toHaveTextContent("4件適用中");
      expect(screen.getByText("G1")).toBeInTheDocument();
      expect(screen.getByText("芝")).toBeInTheDocument();
      expect(screen.getByText("マイル")).toBeInTheDocument();
      expect(screen.getByText("東京")).toBeInTheDocument();

      // G1の個別解除ボタンをクリック
      const removeG1Btn = screen.getByLabelText("G1の絞り込みを解除");
      fireEvent.click(removeG1Btn);
      expect(useRaceStore.getState().filters.grades).not.toContain("G1");
      expect(countBadge).toHaveTextContent("3");

      // 常時表示エリアのリセットボタンで全解除
      const resetBtn = screen.getByRole("button", { name: "フィルターをリセット" });
      fireEvent.click(resetBtn);
      expect(useRaceStore.getState().filters.grades).toEqual([]);
      expect(useRaceStore.getState().filters.trackTypes).toEqual([]);
      expect(useRaceStore.getState().filters.distanceCategories).toEqual([]);
      expect(useRaceStore.getState().filters.courses).toEqual([]);
      expect(screen.queryByTestId("active-filters-summary")).not.toBeInTheDocument();
    });

    it("英語モードで展開/折りたたみボタンのラベルが正しくローカライズされること", () => {
      useLanguageStore.setState({ language: "en" });
      render(<FilterBar />);

      const collapseBtn = screen.getByRole("button", { name: "Collapse filters" });
      expect(collapseBtn).toBeInTheDocument();
      // 表示テキストは短縮された名詞 "Filters" (Issue #96)
      expect(collapseBtn).toHaveTextContent("Filters");

      // スクロールで折りたたみ
      Object.defineProperty(window, "scrollY", { value: 50, writable: true, configurable: true });
      fireEvent.scroll(window);

      const expandBtn = screen.getByRole("button", { name: "Expand filters" });
      expect(expandBtn).toBeInTheDocument();
      expect(expandBtn).toHaveTextContent("Filters");
    });

    it("モバイル画面で主催者トリガーの全主催者表示が短縮文言で表示されること (Issue #96)", () => {
      // 日本語: "全主催者"
      useLanguageStore.setState({ language: "ja" });
      useRaceStore.getState().setFilter("organizations", []);
      const { unmount } = render(<FilterBar />);
      const triggerBtnJa = screen.getByRole("button", { name: "開催国・主催者の選択" });
      expect(triggerBtnJa).toHaveTextContent("全主催者");
      unmount();

      // 英語: "All Orgs"
      useLanguageStore.setState({ language: "en" });
      const { unmount: unmountEn } = render(<FilterBar />);
      const triggerBtnEn = screen.getByRole("button", { name: "Select Countries & Organizations" });
      expect(triggerBtnEn).toHaveTextContent("All Orgs");
      unmountEn();

      // フランス語: "Toutes"
      useLanguageStore.setState({ language: "fr" });
      render(<FilterBar />);
      const triggerBtnFr = screen.getByRole("button", { name: "Sélectionner pays et organisateurs" });
      expect(triggerBtnFr).toHaveTextContent("Toutes");
    });
  });

  describe("主催者選択と競馬場・グレード・馬場の動的連動および画面溢れ防止 (Issue #107)", () => {
    it("主催者（アメリカ）を選択時、競馬場パネルにはアメリカの競馬場のみが表示されること", () => {
      useRaceStore.getState().setFilter("organizations", ["equibase"]);
      render(<FilterBar />);

      // 競馬場パネルを展開
      const courseExpandBtn = screen.getByRole("button", { name: "競馬場フィルターを展開" });
      fireEvent.click(courseExpandBtn);

      const panel = screen.getByTestId("course-filter-panel");
      // アメリカ (USA) グループが表示されていること
      expect(within(panel).getByText("アメリカ (USA)")).toBeInTheDocument();
      expect(within(panel).getByRole("button", { name: "チャーチルダウンズ" })).toBeInTheDocument();

      // 日本や欧州の競馬場グループは表示されないこと
      expect(within(panel).queryByText("中央競馬 (JRA)")).not.toBeInTheDocument();
      expect(within(panel).queryByText("南関東 (NAR)")).not.toBeInTheDocument();
      expect(within(panel).queryByText("フランス (France)")).not.toBeInTheDocument();
      expect(within(panel).queryByText("イギリス (UK)")).not.toBeInTheDocument();
    });

    it("主催者（フランス）を選択時、フランス競馬場のみが表示されること", () => {
      useRaceStore.getState().setFilter("organizations", ["france_galop"]);
      render(<FilterBar />);

      const courseExpandBtn = screen.getByRole("button", { name: "競馬場フィルターを展開" });
      fireEvent.click(courseExpandBtn);

      const panel = screen.getByTestId("course-filter-panel");
      expect(within(panel).getByText("フランス (France)")).toBeInTheDocument();
      expect(within(panel).getByRole("button", { name: "パリロンシャン" })).toBeInTheDocument();

      expect(within(panel).queryByText("中央競馬 (JRA)")).not.toBeInTheDocument();
      expect(within(panel).queryByText("アメリカ (USA)")).not.toBeInTheDocument();
    });

    it("海外主催者（アメリカ）選択時、日本特有のグレード・一括トグル・ばんえい馬場が非表示となり、G1〜G3とAWが表示されること", () => {
      useRaceStore.getState().setFilter("organizations", ["equibase"]);
      render(<FilterBar />);

      // G1, G2, G3 は表示される
      expect(screen.getByRole("button", { name: "G1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "G2" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "G3" })).toBeInTheDocument();

      // J.G1, Jpn1, S1, 地方重賞、一括トグルは非表示
      expect(screen.queryByRole("button", { name: "J.G1" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Jpn1" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "S1" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "地方重賞" })).not.toBeInTheDocument();
      expect(screen.queryByText("一括:")).not.toBeInTheDocument();

      // 馬場種別: AWは表示され、ばんえいは非表示
      expect(screen.getByRole("button", { name: "AW" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "ばんえい" })).not.toBeInTheDocument();
    });

    it("JRAのみ選択時、G1〜G3およびJ.G1〜J.G3が表示され、Jpn/S1/地方重賞/一括トグル/ばんえい/AWは非表示になること", () => {
      useRaceStore.getState().setFilter("organizations", ["jra"]);
      render(<FilterBar />);

      expect(screen.getByRole("button", { name: "G1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "J.G1" })).toBeInTheDocument();

      expect(screen.queryByRole("button", { name: "Jpn1" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "S1" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "地方重賞" })).not.toBeInTheDocument();
      expect(screen.queryByText("一括:")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "ばんえい" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "AW" })).not.toBeInTheDocument();
    });

    it("NARのみ選択時、Jpn1〜Jpn3、S1〜S3、地方重賞、一括トグル、ばんえいが表示され、J.G1〜J.G3やAWは非表示になること", () => {
      useRaceStore.getState().setFilter("organizations", ["nar"]);
      render(<FilterBar />);

      expect(screen.getByRole("button", { name: "G1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Jpn1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "S1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "地方重賞" })).toBeInTheDocument();
      expect(screen.getByText("一括:")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "ばんえい" })).toBeInTheDocument();

      expect(screen.queryByRole("button", { name: "J.G1" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "AW" })).not.toBeInTheDocument();
    });

    it("全主催者表示（未選択）時、地域クイックセレクターが表示され、地域タブで競馬場グループが切り替わること", () => {
      useRaceStore.getState().setFilter("organizations", []);
      render(<FilterBar />);

      const courseExpandBtn = screen.getByRole("button", { name: "競馬場フィルターを展開" });
      fireEvent.click(courseExpandBtn);

      const panel = screen.getByTestId("course-filter-panel");
      // 地域セレクタータブが表示されていること
      const regionTabs = screen.getByTestId("course-region-tabs");
      expect(regionTabs).toBeInTheDocument();

      // 初期状態は「すべて」で全7グループ表示
      expect(within(panel).getByText("中央競馬 (JRA)")).toBeInTheDocument();
      expect(within(panel).getByText("アメリカ (USA)")).toBeInTheDocument();

      // 「日本」タブをクリック
      const japanTab = within(regionTabs).getByRole("button", { name: /日本/ });
      fireEvent.click(japanTab);

      expect(within(panel).getByText("中央競馬 (JRA)")).toBeInTheDocument();
      expect(within(panel).getByText("南関東 (NAR)")).toBeInTheDocument();
      expect(within(panel).queryByText("フランス (France)")).not.toBeInTheDocument();
      expect(within(panel).queryByText("アメリカ (USA)")).not.toBeInTheDocument();

      // 「米国」タブをクリック
      const americaTab = within(regionTabs).getByRole("button", { name: /アメリカ/ });
      fireEvent.click(americaTab);

      expect(within(panel).queryByText("中央競馬 (JRA)")).not.toBeInTheDocument();
      expect(within(panel).getByText("アメリカ (USA)")).toBeInTheDocument();
    });

    it("競馬場パネルおよび詳細フィルターパネルに高さ制限・内部スクロールクラスが付与されていること", () => {
      render(<FilterBar />);

      const detailedPanel = screen.getByTestId("detailed-filters-panel");
      expect(detailedPanel).toHaveClass("max-h-[75vh]");
      expect(detailedPanel).toHaveClass("overflow-y-auto");

      const courseExpandBtn = screen.getByRole("button", { name: "競馬場フィルターを展開" });
      fireEvent.click(courseExpandBtn);

      const coursePanel = screen.getByTestId("course-filter-panel");
      // 内部スクロールコンテナの確認
      const scrollContainer = coursePanel.querySelector(".overflow-y-auto");
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass("max-h-60");
    });
  });
});


