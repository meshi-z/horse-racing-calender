import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Layout } from "../../src/components/shared/Layout";
import { useLanguageStore } from "../../src/store/useLanguageStore";

describe("Layout", () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: "ja" });
  });

  it("フッターにコピーライト、免責事項への導線、および非公式注記が表示されること", () => {
    render(
      <Layout>
        <div>コンテンツ</div>
      </Layout>
    );

    // コピーライト
    expect(screen.getByText("© 2026 horse-racing-calendar")).toBeInTheDocument();

    // 免責事項・データ出典ボタン
    expect(
      screen.getByRole("button", { name: "免責事項・データ出典" })
    ).toBeInTheDocument();

    // 発走時刻確定ガイドボタン
    expect(
      screen.getByRole("button", { name: "発走時刻の確定について" })
    ).toBeInTheDocument();

    // 非公式注記
    expect(
      screen.getByText(
        /当サイトは非公式ファンサイトです。レース日程・発走時刻等の最新情報は必ず主催者（JRA・NAR・France Galop・BHA・Equibase・HKJC・HRI等）公式発表をご確認ください。/
      )
    ).toBeInTheDocument();
  });

  it("英語モードでフッターの免責事項導線と非公式注記が英語で表示されること", () => {
    useLanguageStore.setState({ language: "en" });

    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(
      screen.getByRole("button", { name: "Disclaimer & Data Sources" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "About Post Time Confirmation" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /This is an unofficial fan site. Please always verify the latest race schedules and post times/
      )
    ).toBeInTheDocument();
  });

  it("フランス語モードでフッターの免責事項導線と非公式注記がフランス語で表示されること", () => {
    useLanguageStore.setState({ language: "fr" });

    render(
      <Layout>
        <div>Contenu</div>
      </Layout>
    );

    expect(
      screen.getByRole("button", { name: "Mentions légales & Sources" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "À propos des horaires de départ" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Ce site est un projet de fans non officiel/
      )
    ).toBeInTheDocument();
  });

  it("繁体字中国語モードでフッターの導線と非公式注記が中国語で表示されること", () => {
    useLanguageStore.setState({ language: "zh" });

    render(
      <Layout>
        <div>內容</div>
      </Layout>
    );

    expect(
      screen.getByRole("button", { name: "免責聲明・資料來源" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "關於開跑時間確定日程" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /本網站為非官方愛好者網站/
      )
    ).toBeInTheDocument();
  });
});
