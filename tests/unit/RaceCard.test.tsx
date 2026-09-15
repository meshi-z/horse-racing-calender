import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RaceCard } from "../../src/components/shared/RaceCard";
import type { Race } from "../../src/types/race";

const mockRace: Race = {
  id: "2026-jra-g1-01",
  organization: "jra",
  name: {
    ja: "フェブラリーステークス",
    en: "February Stakes",
  },
  grade: "G1",
  date: "2026-02-22",
  start_time: "2026-02-22T06:40:00.000Z",
  is_time_confirmed: false,
  course: {
    ja: "東京",
    en: "Tokyo",
  },
  distance: 1600,
  track_type: "dirt",
  sex_constraint: "none",
  age_constraint: "4yo_and_up",
  handicap: {
    code: "weight_for_age",
    ja: "定量",
    en: "Weight for Age",
  },
};

describe("RaceCard", () => {
  it("レース名、英語名、グレード、開催場、距離、馬場情報が正しく表示されること", () => {
    render(<RaceCard race={mockRace} />);

    expect(screen.getByText("フェブラリーステークス")).toBeInTheDocument();
    expect(screen.getByText("February Stakes")).toBeInTheDocument();
    expect(screen.getByLabelText("グレード: G1")).toBeInTheDocument();
    expect(screen.getByText("東京")).toBeInTheDocument();
    expect(screen.getByText("ダート 1600m")).toBeInTheDocument();
    expect(screen.getByText("4歳上")).toBeInTheDocument();
    expect(screen.getByText("定量")).toBeInTheDocument();
  });

  it("未確定の発走予定時刻において、'発走予定' バッジが表示されること", () => {
    render(<RaceCard race={mockRace} />);
    expect(screen.getByText("発走予定")).toBeInTheDocument();
  });

  it("確定済みの発走時刻において、'発走確定' バッジが表示されること", () => {
    const confirmedRace: Race = {
      ...mockRace,
      is_time_confirmed: true,
    };
    render(<RaceCard race={confirmedRace} />);
    expect(screen.getByText("発走確定")).toBeInTheDocument();
  });

  it("アクセシビリティ属性（role='button', tabIndex=0, aria-haspopup='dialog'）を有していること", () => {
    render(<RaceCard race={mockRace} />);
    const card = screen.getByRole("button", { name: "フェブラリーステークス 詳細を表示" });
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("tabindex", "0");
    expect(card).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("カードをクリックした際に onSelect が呼ばれ、詳細ダイアログが開くこと", () => {
    const onSelect = vi.fn();
    render(<RaceCard race={mockRace} onSelect={onSelect} />);

    const card = screen.getByRole("button", { name: "フェブラリーステークス 詳細を表示" });
    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith(mockRace);
    // 詳細ダイアログの内容が表示されること
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("出走条件・負担重量")).toBeInTheDocument();
  });

  it("Enter キーを押下した際に詳細ダイアログが開くこと", () => {
    render(<RaceCard race={mockRace} />);

    const card = screen.getByRole("button", { name: "フェブラリーステークス 詳細を表示" });
    fireEvent.keyDown(card, { key: "Enter" });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
