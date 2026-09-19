import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterBar } from "../../src/components/shared/FilterBar";
import { useRaceStore } from "../../src/store/useRaceStore";

describe("FilterBar", () => {
  beforeEach(() => {
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
});
