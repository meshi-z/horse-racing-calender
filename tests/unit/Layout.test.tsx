import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Layout } from "../../src/components/shared/Layout";

describe("Layout", () => {
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
        /当サイトは非公式ファンサイトです。レース日程・発走時刻等の最新情報は必ず主催者（JRA等）公式発表をご確認ください。/
      )
    ).toBeInTheDocument();
  });
});
