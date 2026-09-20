import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DisclaimerDialog } from "../../src/components/shared/DisclaimerDialog";
import { useLanguageStore } from "../../src/store/useLanguageStore";

describe("DisclaimerDialog", () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: "ja" });
  });
  it("デフォルトのトリガーボタンが表示され、クリックすると免責事項ダイアログが開くこと", () => {
    render(<DisclaimerDialog />);

    const triggerButton = screen.getByRole("button", {
      name: "免責事項・データ出典",
    });
    expect(triggerButton).toBeInTheDocument();

    // ダイアログを開く
    fireEvent.click(triggerButton);

    // ダイアログタイトルが表示される
    expect(
      screen.getByRole("heading", { name: "免責事項・データ出典" })
    ).toBeInTheDocument();
  });

  it("ダイアログ内に非公式ファンサイト・データ出典・免責・権利帰属の各セクションが含まれていること", () => {
    render(<DisclaimerDialog open={true} />);

    // 見出しの確認
    expect(screen.getByText("非公式ファンサイトについて")).toBeInTheDocument();
    expect(screen.getByText("データの出典")).toBeInTheDocument();
    expect(
      screen.getByText("開催変更・公式発表確認の推奨と免責事項")
    ).toBeInTheDocument();
    expect(screen.getByText("権利・商標の帰属")).toBeInTheDocument();
    expect(
      screen.getByText("アクセス解析ツール（Google Analytics）について")
    ).toBeInTheDocument();

    // 重要文言の確認
    expect(
      screen.getByText(/日本中央競馬会（JRA）、地方競馬全国協会（NAR）/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/一般公開されている公式情報.*を取得・加工して提供/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/必ず主催者（JRA・NAR等）公式発表の最新情報をご確認ください/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/開発者および運営者は一切の責任を負いません/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/各主催者（JRA、NAR、各地方競馬主催者等）ならびに各権利者に帰属します/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Google社が提供するアクセス解析ツール「Google Analytics（GA4）」を利用しています/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Google Analyticsはデータの収集のためにCookie（クッキー）を使用しています/)
    ).toBeInTheDocument();
  });

  it("カスタムの子要素をトリガーとして渡した場合にその要素がトリガーとなること", () => {
    render(
      <DisclaimerDialog>
        <button type="button">カスタム免責トリガー</button>
      </DisclaimerDialog>
    );

    const customButton = screen.getByRole("button", {
      name: "カスタム免責トリガー",
    });
    expect(customButton).toBeInTheDocument();

    fireEvent.click(customButton);

    expect(
      screen.getByRole("heading", { name: "免責事項・データ出典" })
    ).toBeInTheDocument();
  });

  describe("英語モード (English mode)", () => {
    beforeEach(() => {
      useLanguageStore.setState({ language: "en" });
    });

    it("英語のトリガーボタンが表示され、クリックすると英語の免責事項ダイアログが開くこと", () => {
      render(<DisclaimerDialog />);

      const triggerButton = screen.getByRole("button", {
        name: "Disclaimer & Data Sources",
      });
      expect(triggerButton).toBeInTheDocument();

      fireEvent.click(triggerButton);

      expect(
        screen.getByRole("heading", { name: "Disclaimer & Data Sources" })
      ).toBeInTheDocument();
      expect(
        screen.getByText("Terms of use, data handling, and disclaimer for this application.")
      ).toBeInTheDocument();
    });

    it("英語の各セクション見出しおよび本文が表示されること", () => {
      render(<DisclaimerDialog open={true} />);

      // 見出しの確認
      expect(screen.getByText("Unofficial Fan Site")).toBeInTheDocument();
      expect(screen.getByText("Data Sources")).toBeInTheDocument();
      expect(screen.getByText("Schedule Changes & Disclaimer")).toBeInTheDocument();
      expect(screen.getByText("Intellectual Property & Trademarks")).toBeInTheDocument();
      expect(screen.getByText("Access Analytics (Google Analytics)")).toBeInTheDocument();

      // 本文の確認
      expect(screen.getByText(/unofficial, personal fan project and has no affiliation with JRA/)).toBeInTheDocument();
      expect(screen.getByText(/sourced and processed from publicly accessible official information published by JRA and NAR/)).toBeInTheDocument();
      expect(screen.getByText(/When purchasing betting tickets or attending races in person, please always verify official announcements/)).toBeInTheDocument();
      expect(screen.getByText(/assume no liability for any direct or indirect damages/)).toBeInTheDocument();
      expect(screen.getByText(/belong to their respective rights holders \(JRA, NAR, local authorities, etc\.\)/)).toBeInTheDocument();
      expect(screen.getByText(/Google Analytics \(GA4\) provided by Google LLC/)).toBeInTheDocument();
      expect(screen.getByText(/Google Analytics uses cookies to collect data/)).toBeInTheDocument();
    });
  });
});
