import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/shared/Header";
import { THEME_STORAGE_KEY } from "@/hooks/useTheme";

describe("Header", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
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
});
