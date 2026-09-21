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
    expect(screen.getByText("Graded Races Calendar")).toBeInTheDocument();
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

  it("言語切替セレクターが表示され、JA/EN/FRを選択するとタブ表示や属性が切り替わること", () => {
    const trackEventSpy = vi.spyOn(analytics, "trackEvent").mockImplementation(() => {});

    render(<Header />);

    const langTrigger = screen.getByRole("combobox", {
      name: "言語を選択 (日本語)",
    });
    expect(langTrigger).toBeInTheDocument();
    expect(langTrigger).toHaveTextContent("JA");
    expect(screen.getByRole("tab", { name: "タイムライン" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "カレンダー" })).toBeInTheDocument();

    // 英語を選択
    fireEvent.click(langTrigger);
    const enOption = screen.getByRole("option", { name: /English \(EN\)/ });
    fireEvent.click(enOption);

    expect(trackEventSpy).toHaveBeenCalledWith("language_change", {
      from: "ja",
      to: "en",
    });
    expect(useLanguageStore.getState().language).toBe("en");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(langTrigger).toHaveTextContent("EN");
    expect(screen.getByRole("tab", { name: "Timeline" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Calendar" })).toBeInTheDocument();

    // フランス語を選択
    fireEvent.click(langTrigger);
    const frOption = screen.getByRole("option", { name: /Français \(FR\)/ });
    fireEvent.click(frOption);

    expect(trackEventSpy).toHaveBeenCalledWith("language_change", {
      from: "en",
      to: "fr",
    });
    expect(useLanguageStore.getState().language).toBe("fr");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fr");
    expect(document.documentElement.lang).toBe("fr");
    expect(langTrigger).toHaveTextContent("FR");
    expect(screen.getByRole("tab", { name: "Chronologie" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Calendrier" })).toBeInTheDocument();
  });
});
