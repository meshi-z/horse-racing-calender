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

    // 非公式注記
    expect(
      screen.getByText(
        /当サイトは非公式ファンサイトです。レース日程・発走時刻等の最新情報は必ず主催者（JRA・NAR・France Galop・BHA・Equibase・HKJC等）公式発表をご確認ください。/
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
      screen.getByText(
        /Ce site est un projet de fans non officiel/
      )
    ).toBeInTheDocument();
  });
});
