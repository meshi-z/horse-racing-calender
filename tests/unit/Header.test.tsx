import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/shared/Header";
import { THEME_STORAGE_KEY } from "@/hooks/useTheme";
import { useLanguageStore, LANGUAGE_STORAGE_KEY } from "@/store/useLanguageStore";
import * as analytics from "@/libs/analytics";

describe("Header", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.lang = "ja";
    useLanguageStore.setState({ language: "ja" });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ロゴとタイトル、タイムライン/カレンダー切替タブが表示されること", () => {
    render(<Header />);

    expect(screen.getByText("重賞カレンダー")).toBeInTheDocument();
    expect(screen.getByText("JRA Graded Races Calendar")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /タイムライン/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /カレンダー/ })).toBeInTheDocument();
  });

  it("テーマ切替ボタンが表示され、クリックするとライト/ダークがトグルされること", () => {
    render(<Header />);

    const themeButton = screen.getByRole("button", {
      name: "ダークモードに切り替え",
    });
    expect(themeButton).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // クリックしてダークモードへ
    fireEvent.click(themeButton);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(
      screen.getByRole("button", { name: "ライトモードに切り替え" })
    ).toBeInTheDocument();

    // 再度クリックしてライトモードへ
    fireEvent.click(
      screen.getByRole("button", { name: "ライトモードに切り替え" })
    );

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(
      screen.getByRole("button", { name: "ダークモードに切り替え" })
    ).toBeInTheDocument();
  });

  it("言語切替ボタンが表示され、クリックするとJA/ENがトグルされ、タブ表示や属性が切り替わること", () => {
    const trackEventSpy = vi.spyOn(analytics, "trackEvent").mockImplementation(() => {});

    render(<Header />);

    const langButton = screen.getByRole("button", {
      name: "英語に切り替え",
    });
    expect(langButton).toBeInTheDocument();
    expect(langButton).toHaveTextContent("JA");
    expect(screen.getByRole("tab", { name: "タイムライン" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "カレンダー" })).toBeInTheDocument();

    // クリックして英語へ切り替え
    fireEvent.click(langButton);

    expect(trackEventSpy).toHaveBeenCalledWith("language_change", {
      from: "ja",
      to: "en",
    });
    expect(useLanguageStore.getState().language).toBe("en");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
    expect(document.documentElement.lang).toBe("en");

    // ボタンのテキストとaria-label、タブの英語表示を確認
    expect(langButton).toHaveTextContent("EN");
    expect(
      screen.getByRole("button", { name: "Switch to Japanese" })
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Timeline" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Calendar" })).toBeInTheDocument();

    // 再度クリックして日本語へ切り替え
    fireEvent.click(langButton);

    expect(trackEventSpy).toHaveBeenCalledWith("language_change", {
      from: "en",
      to: "ja",
    });
    expect(useLanguageStore.getState().language).toBe("ja");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("ja");
    expect(document.documentElement.lang).toBe("ja");
    expect(langButton).toHaveTextContent("JA");
    expect(screen.getByRole("tab", { name: "タイムライン" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "カレンダー" })).toBeInTheDocument();
  });
});
