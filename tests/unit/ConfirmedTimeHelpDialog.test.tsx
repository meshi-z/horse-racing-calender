import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmedTimeHelpDialog } from "../../src/components/shared/ConfirmedTimeHelpDialog";
import { useLanguageStore } from "../../src/store/useLanguageStore";

describe("ConfirmedTimeHelpDialog", () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: "ja" });
  });

  it("デフォルトのトリガーボタンが表示され、クリックすると確定スケジュールガイドダイアログが開くこと", () => {
    render(<ConfirmedTimeHelpDialog />);

    const triggerButton = screen.getByRole("button", {
      name: "発走時刻の確定について",
    });
    expect(triggerButton).toBeInTheDocument();

    // ダイアログを開く
    fireEvent.click(triggerButton);

    // ダイアログタイトルが表示される
    expect(
      screen.getByRole("heading", { name: "発走予定時刻の確定タイミングについて" })
    ).toBeInTheDocument();
  });

  it("ダイアログ内に概要・主催者別スケジュール一覧・注意事項の各セクションが含まれていること", () => {
    render(<ConfirmedTimeHelpDialog open={true} />);

    // 概要セクション
    expect(screen.getByText("発走時刻の反映の仕組み")).toBeInTheDocument();
    expect(
      screen.getByText(/公式発表前のレースは「時刻未定（TBD）」と表示されます/)
    ).toBeInTheDocument();

    // 全7主催者が表内に含まれること
    expect(screen.getByText("JRA（中央競馬）")).toBeInTheDocument();
    expect(screen.getByText("NAR（地方競馬・ばんえい）")).toBeInTheDocument();
    expect(screen.getByText("France Galop")).toBeInTheDocument();
    expect(screen.getByText("BHA（英国競馬統轄機構）")).toBeInTheDocument();
    expect(screen.getByText("HRI（アイルランド競馬協会）")).toBeInTheDocument();
    expect(screen.getByText("Equibase / The Jockey Club")).toBeInTheDocument();
    expect(screen.getByText("HKJC（香港賽馬會）")).toBeInTheDocument();

    // 反映目安テキストの確認
    expect(screen.getByText("金曜昼およびレース前日")).toBeInTheDocument();
    expect(screen.getByText("レース前々日夜〜前日朝")).toBeInTheDocument();
    expect(screen.getByText("レース2日前夜〜前日")).toBeInTheDocument();
    expect(screen.getAllByText("レース2日前の深夜〜前日朝")).toHaveLength(2); // BHA & HRI
    expect(screen.getByText("レース2日前〜前日")).toBeInTheDocument();
    expect(screen.getByText("レース2日前の午後")).toBeInTheDocument();

    // 注意事項セクション
    expect(
      screen.getByText("天候や主催者都合による直前変更について")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/悪天候や馬場状態、競走除外、主催者の進行都合等により/)
    ).toBeInTheDocument();
  });

  it("カスタムの子要素をトリガーとして渡した場合にその要素がトリガーとなること", () => {
    render(
      <ConfirmedTimeHelpDialog>
        <button type="button">いつ決まる？</button>
      </ConfirmedTimeHelpDialog>
    );

    const customButton = screen.getByRole("button", {
      name: "いつ決まる？",
    });
    expect(customButton).toBeInTheDocument();

    fireEvent.click(customButton);

    expect(
      screen.getByRole("heading", { name: "発走予定時刻の確定タイミングについて" })
    ).toBeInTheDocument();
  });

  describe("多言語表示 (Multilingual support)", () => {
    it("英語モード (English mode) で英語のダイアログが開くこと", () => {
      useLanguageStore.setState({ language: "en" });
      render(<ConfirmedTimeHelpDialog />);

      const triggerButton = screen.getByRole("button", {
        name: "About Post Time Confirmation",
      });
      expect(triggerButton).toBeInTheDocument();

      fireEvent.click(triggerButton);

      expect(
        screen.getByRole("heading", { name: "Post Time Confirmation Schedule" })
      ).toBeInTheDocument();
      expect(screen.getByText("How Post Times Are Updated")).toBeInTheDocument();
      expect(screen.getByText("JRA (Japan Racing Association)")).toBeInTheDocument();
      expect(screen.getByText("Last-minute Changes & Weather Delays")).toBeInTheDocument();
    });

    it("フランス語モード (French mode) でフランス語のダイアログが開くこと", () => {
      useLanguageStore.setState({ language: "fr" });
      render(<ConfirmedTimeHelpDialog open={true} />);

      expect(
        screen.getByRole("heading", {
          name: "Calendrier de confirmation des horaires de départ",
        })
      ).toBeInTheDocument();
      expect(screen.getByText("Mise à jour des horaires de départ")).toBeInTheDocument();
      expect(screen.getByText("JRA (Japon Central)")).toBeInTheDocument();
      expect(
        screen.getByText("Modifications de dernière minute et météo")
      ).toBeInTheDocument();
    });

    it("繁体字中国語モード (Traditional Chinese mode) で中国語のダイアログが開くこと", () => {
      useLanguageStore.setState({ language: "zh" });
      render(<ConfirmedTimeHelpDialog open={true} />);

      expect(
        screen.getByRole("heading", { name: "預計開跑時間確定時程指南" })
      ).toBeInTheDocument();
      expect(screen.getByText("開跑時間更新機制")).toBeInTheDocument();
      expect(screen.getByText("JRA（日本中央競馬會）")).toBeInTheDocument();
      expect(
        screen.getByText("天候與主辦機構臨時變更說明")
      ).toBeInTheDocument();
    });
  });
});
