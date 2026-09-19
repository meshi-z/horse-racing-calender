import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DisclaimerDialog } from "../../src/components/shared/DisclaimerDialog";

describe("DisclaimerDialog", () => {
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
      screen.getByText(/日本中央競馬会（JRA）およびその他の競馬主催団体、関連機関とは一切関係ありません/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/一般公開されている公式情報.*を取得・加工して提供/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/必ず主催者（JRA等）公式発表の最新情報をご確認ください/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/開発者および運営者は一切の責任を負いません/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/日本中央競馬会（JRA）ならびに各権利者に帰属します/)
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
});
