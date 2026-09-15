import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GradeBadge } from "../../src/components/shared/GradeBadge";

describe("GradeBadge", () => {
  it("G1 バッジが正しくレンダリングされ、G1 のセマンティックスタイルが適用されること", () => {
    render(<GradeBadge grade="G1" />);
    const badge = screen.getByLabelText("グレード: G1");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("G1");
    expect(badge).toHaveClass("bg-grade-g1");
    expect(badge).toHaveClass("text-grade-g1-foreground");
  });

  it("J.G1 バッジが正しくレンダリングされ、G1 と同等のスタイルが適用されること", () => {
    render(<GradeBadge grade="J.G1" />);
    const badge = screen.getByLabelText("グレード: J.G1");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("J.G1");
    expect(badge).toHaveClass("bg-grade-g1");
  });

  it("G2 および J.G2 バッジが正しくレンダリングされ、G2 のスタイルが適用されること", () => {
    const { rerender } = render(<GradeBadge grade="G2" />);
    const badgeG2 = screen.getByLabelText("グレード: G2");
    expect(badgeG2).toHaveTextContent("G2");
    expect(badgeG2).toHaveClass("bg-grade-g2");
    expect(badgeG2).toHaveClass("text-grade-g2-foreground");

    rerender(<GradeBadge grade="J.G2" />);
    const badgeJG2 = screen.getByLabelText("グレード: J.G2");
    expect(badgeJG2).toHaveTextContent("J.G2");
    expect(badgeJG2).toHaveClass("bg-grade-g2");
  });

  it("G3 および J.G3 バッジが正しくレンダリングされ、G3 のスタイルが適用されること", () => {
    const { rerender } = render(<GradeBadge grade="G3" />);
    const badgeG3 = screen.getByLabelText("グレード: G3");
    expect(badgeG3).toHaveTextContent("G3");
    expect(badgeG3).toHaveClass("bg-grade-g3");
    expect(badgeG3).toHaveClass("text-grade-g3-foreground");

    rerender(<GradeBadge grade="J.G3" />);
    const badgeJG3 = screen.getByLabelText("グレード: J.G3");
    expect(badgeJG3).toHaveTextContent("J.G3");
    expect(badgeJG3).toHaveClass("bg-grade-g3");
  });

  it("children を渡した場合はカスタムテキストが表示されること", () => {
    render(<GradeBadge grade="G1">GI レース</GradeBadge>);
    expect(screen.getByText("GI レース")).toBeInTheDocument();
  });
});
