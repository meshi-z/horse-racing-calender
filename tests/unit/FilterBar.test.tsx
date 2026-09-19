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
  });

  it("ヘッダー直下に固定表示するための sticky top-14 z-30 クラスが設定されていること", () => {
    render(<FilterBar />);
    const bar = screen.getByTestId("filter-bar");
    expect(bar).toHaveClass("sticky");
    expect(bar).toHaveClass("top-14");
    expect(bar).toHaveClass("z-30");
  });

  it("ページスクロール時にコンパクト表示（data-scrolled='true'）に切り替わること", () => {
    render(<FilterBar />);
    const bar = screen.getByTestId("filter-bar");
    expect(bar).toHaveAttribute("data-scrolled", "false");

    // スクロール位置を 50px に変更してイベント発火
    Object.defineProperty(window, "scrollY", { value: 50, writable: true, configurable: true });
    fireEvent.scroll(window);

    expect(bar).toHaveAttribute("data-scrolled", "true");
    expect(bar).toHaveClass("shadow-md");

    // 最上部へスクロールバック
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
    fireEvent.scroll(window);

    expect(bar).toHaveAttribute("data-scrolled", "false");
  });
});
