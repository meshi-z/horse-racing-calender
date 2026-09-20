import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GradeBadge } from "../../src/components/shared/GradeBadge";
import { useLanguageStore } from "../../src/store/useLanguageStore";

describe("GradeBadge", () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: "ja" });
  });

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

  it("ダートグレード (Jpn1, Jpn2, Jpn3) が適切なスタイルでレンダリングされること", () => {
    const { rerender } = render(<GradeBadge grade="Jpn1" />);
    const badge1 = screen.getByLabelText("グレード: Jpn1");
    expect(badge1).toHaveTextContent("Jpn1");
    expect(badge1).toHaveClass("bg-grade-jpn1");

    rerender(<GradeBadge grade="Jpn2" />);
    const badge2 = screen.getByLabelText("グレード: Jpn2");
    expect(badge2).toHaveTextContent("Jpn2");
    expect(badge2).toHaveClass("bg-grade-jpn2");

    rerender(<GradeBadge grade="Jpn3" />);
    const badge3 = screen.getByLabelText("グレード: Jpn3");
    expect(badge3).toHaveTextContent("Jpn3");
    expect(badge3).toHaveClass("bg-grade-jpn3");
  });

  it("南関東重賞 (S1, S2, S3) が適切なスタイルでレンダリングされること", () => {
    const { rerender } = render(<GradeBadge grade="S1" />);
    const badge1 = screen.getByLabelText("グレード: S1");
    expect(badge1).toHaveTextContent("S1");
    expect(badge1).toHaveClass("bg-grade-s1");

    rerender(<GradeBadge grade="S2" />);
    const badge2 = screen.getByLabelText("グレード: S2");
    expect(badge2).toHaveTextContent("S2");
    expect(badge2).toHaveClass("bg-grade-s2");

    rerender(<GradeBadge grade="S3" />);
    const badge3 = screen.getByLabelText("グレード: S3");
    expect(badge3).toHaveTextContent("S3");
    expect(badge3).toHaveClass("bg-grade-s3");
  });

  it("地方重賞 (local_grade) が日本語・英語で正しくレンダリングされること", () => {
    const { rerender } = render(<GradeBadge grade="local_grade" />);
    const badgeJa = screen.getByLabelText("グレード: 地方重賞");
    expect(badgeJa).toHaveTextContent("地方重賞");
    expect(badgeJa).toHaveClass("bg-grade-local");

    useLanguageStore.setState({ language: "en" });
    rerender(<GradeBadge grade="local_grade" />);
    const badgeEn = screen.getByLabelText("Grade: Regional");
    expect(badgeEn).toHaveTextContent("Regional");
    expect(badgeEn).toHaveClass("bg-grade-local");
  });

  it("children を渡した場合はカスタムテキストが表示されること", () => {
    render(<GradeBadge grade="G1">GI レース</GradeBadge>);
    expect(screen.getByText("GI レース")).toBeInTheDocument();
  });
});
