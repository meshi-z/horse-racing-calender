import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initAnalytics, trackEvent, GA_MEASUREMENT_ID } from "../../src/libs/analytics";

describe("analytics utility", () => {
  beforeEach(() => {
    // DOMクリーンアップ
    document.head.innerHTML = "";
    delete window.dataLayer;
    delete window.gtag;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("非本番環境（test環境）ではスクリプトタグが注入されないこと", () => {
    initAnalytics();

    const script = document.getElementById("google-analytics-gtag");
    expect(script).toBeNull();
    expect(window.dataLayer).toBeUndefined();
  });

  it("本番環境（import.meta.env.PROD = true）でinitAnalyticsを実行した場合にタグが注入されること", () => {
    // import.meta.env.PROD を一時的にシミュレート
    (vi.stubEnv as (key: string, value: unknown) => void)("PROD", true);

    initAnalytics("G-TEST12345");

    const script = document.getElementById("google-analytics-gtag") as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.src).toContain("https://www.googletagmanager.com/gtag/js?id=G-TEST12345");
    expect(script.async).toBe(true);

    expect(window.dataLayer).toBeDefined();
    expect(typeof window.gtag).toBe("function");

    // 重複して初期化を呼んでも2重注入されないこと
    initAnalytics("G-TEST12345");
    const scripts = document.querySelectorAll("#google-analytics-gtag");
    expect(scripts.length).toBe(1);

    vi.unstubAllEnvs();
  });

  it("スクリプトのロードエラー時（オフライン時等）もエラーをスローしないこと", () => {
    (vi.stubEnv as (key: string, value: unknown) => void)("PROD", true);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    initAnalytics("G-TEST12345");

    const script = document.getElementById("google-analytics-gtag") as HTMLScriptElement;
    expect(script).not.toBeNull();

    // onerror イベントを発火
    expect(() => {
      script.onerror?.(new Event("error"));
    }).not.toThrow();

    expect(warnSpy).toHaveBeenCalled();

    vi.unstubAllEnvs();
  });

  it("trackEvent が window.gtag を安全に呼び出すこと", () => {
    const gtagMock = vi.fn();
    window.gtag = gtagMock;

    trackEvent("test_event", { foo: "bar" });
    expect(gtagMock).toHaveBeenCalledWith("event", "test_event", { foo: "bar" });

    // gtag が未定義の場合でもエラーにならないこと
    delete window.gtag;
    expect(() => {
      trackEvent("another_event");
    }).not.toThrow();
  });

  it("GA_MEASUREMENT_ID が G-BWG7RYDEB9 であること", () => {
    expect(GA_MEASUREMENT_ID).toBe("G-BWG7RYDEB9");
  });
});
