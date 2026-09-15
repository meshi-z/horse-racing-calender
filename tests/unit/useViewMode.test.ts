import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useViewMode,
  getInitialViewMode,
  VIEW_MODE_STORAGE_KEY,
} from "../../src/hooks/useViewMode";
import { useRaceStore } from "../../src/store/useRaceStore";

describe("useViewMode & getInitialViewMode", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    useRaceStore.setState({ viewMode: "timeline" });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("localStorage に保存されている設定が最優先されること ('calendar')", () => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, "calendar");
    // matchMedia が false（モバイル）であっても localStorage が優先される
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    expect(getInitialViewMode()).toBe("calendar");
  });

  it("localStorage に保存されている設定が最優先されること ('timeline')", () => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, "timeline");
    // matchMedia が true（デスクトップ）であっても localStorage が優先される
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

    expect(getInitialViewMode()).toBe("timeline");
  });

  it("localStorage に未設定の場合、画面幅 >= 768px では 'calendar' が初期選択されること", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(min-width: 768px)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(getInitialViewMode()).toBe("calendar");
  });

  it("localStorage に未設定の場合、画面幅 < 768px では 'timeline' が初期選択されること", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    expect(getInitialViewMode()).toBe("timeline");
  });

  it("useViewMode の setViewMode を呼ぶと、store と localStorage の両方が更新されること", () => {
    const { result } = renderHook(() => useViewMode());

    act(() => {
      result.current.setViewMode("calendar");
    });

    expect(useRaceStore.getState().viewMode).toBe("calendar");
    expect(localStorage.getItem(VIEW_MODE_STORAGE_KEY)).toBe("calendar");

    act(() => {
      result.current.setViewMode("timeline");
    });

    expect(useRaceStore.getState().viewMode).toBe("timeline");
    expect(localStorage.getItem(VIEW_MODE_STORAGE_KEY)).toBe("timeline");
  });
});
