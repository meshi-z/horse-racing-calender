import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Layout } from "../../src/components/shared/Layout";
import { useLanguageStore } from "../../src/store/useLanguageStore";
import { useRaceStore } from "../../src/store/useRaceStore";

describe("Layout", () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: "ja" });
    useRaceStore.setState({ viewMode: "timeline" });
  });

  describe("タイムラインビュー時 (viewMode: timeline - Issue #140)", () => {
    beforeEach(() => {
      useRaceStore.setState({ viewMode: "timeline" });
    });

    it("画面下部固定フッター（Fixed Bottom Bar）が表示され、最下部余白（pb-16）が確保されること", () => {
      const { container } = render(
        <Layout>
          <div>コンテンツ</div>
        </Layout>
      );

      const fixedFooter = screen.getByTestId("timeline-fixed-footer");
      expect(fixedFooter).toBeInTheDocument();
      expect(fixedFooter).toHaveClass("fixed");
      expect(fixedFooter).toHaveClass("bottom-0");

      // コピーライト、確定ガイド、免責事項リンクが1行で表示されること
      expect(screen.getByText("© 2026 horse-racing-calendar")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "発走時刻の確定について" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "免責事項・データ出典" })
      ).toBeInTheDocument();

      // main コンテナに最下部被り防止の pb-16 が付与されていること
      const mainElement = container.querySelector("main");
      expect(mainElement).toHaveClass("pb-16");

      // コンテンツ末尾に非公式注記が表示されること
      expect(
        screen.getByText(
          /当サイトは非公式ファンサイトです。レース日程・発走時刻等の最新情報は必ず主催者/
        )
      ).toBeInTheDocument();

      // 通常静的フッターは表示されないこと
      expect(screen.queryByTestId("standard-footer")).not.toBeInTheDocument();
    });

    it("英語モード時に固定フッター内のリンクが英語で表示されること", () => {
      useLanguageStore.setState({ language: "en" });

      render(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      const fixedFooter = screen.getByTestId("timeline-fixed-footer");
      expect(fixedFooter).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "About Post Time Confirmation" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Disclaimer & Data Sources" })
      ).toBeInTheDocument();
    });

    it("フランス語モード時に固定フッター内のリンクがフランス語で表示されること", () => {
      useLanguageStore.setState({ language: "fr" });

      render(
        <Layout>
          <div>Contenu</div>
        </Layout>
      );

      const fixedFooter = screen.getByTestId("timeline-fixed-footer");
      expect(fixedFooter).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "À propos des horaires de départ" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Mentions légales & Sources" })
      ).toBeInTheDocument();
    });

    it("繁体字中国語モード時に固定フッター内のリンクが中国語で表示されること", () => {
      useLanguageStore.setState({ language: "zh" });

      render(
        <Layout>
          <div>內容</div>
        </Layout>
      );

      const fixedFooter = screen.getByTestId("timeline-fixed-footer");
      expect(fixedFooter).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "關於開跑時間確定日程" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "免責聲明・資料來源" })
      ).toBeInTheDocument();
    });
  });

  describe("カレンダービュー時 (viewMode: calendar - Issue #140)", () => {
    beforeEach(() => {
      useRaceStore.setState({ viewMode: "calendar" });
    });

    it("通常の静的フッター（非公式注記テキスト含む）が表示され、固定フッターおよび余白（pb-16）は付与されないこと", () => {
      const { container } = render(
        <Layout>
          <div>コンテンツ</div>
        </Layout>
      );

      const standardFooter = screen.getByTestId("standard-footer");
      expect(standardFooter).toBeInTheDocument();
      expect(standardFooter).not.toHaveClass("fixed");

      // コピーライト、確定ガイド、免責事項、非公式注記が表示されること
      expect(screen.getByText("© 2026 horse-racing-calendar")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "発走時刻の確定について" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "免責事項・データ出典" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /当サイトは非公式ファンサイトです。レース日程・発走時刻等の最新情報は必ず主催者（JRA・NAR・France Galop・BHA・Equibase・HKJC・HRI等）公式発表をご確認ください。/
        )
      ).toBeInTheDocument();

      // main コンテナに pb-16 は付与されないこと
      const mainElement = container.querySelector("main");
      expect(mainElement).not.toHaveClass("pb-16");

      // 固定フッターは表示されないこと
      expect(screen.queryByTestId("timeline-fixed-footer")).not.toBeInTheDocument();
    });
  });
});
