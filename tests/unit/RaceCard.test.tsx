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

  it("発走時刻前のレースにおいて、'発走予定' バッジが表示されること", () => {
    const upcomingRace: Race = {
      ...mockRace,
      start_time: "2099-12-31T06:40:00.000Z",
    };
    render(<RaceCard race={upcomingRace} />);
    expect(screen.getByText("発走予定")).toBeInTheDocument();
    expect(screen.queryByText("発走確定")).not.toBeInTheDocument();
  });

  it("発走時刻を経過したレースにおいて、'発走予定' バッジが表示されないこと", () => {
    const pastRace: Race = {
      ...mockRace,
      start_time: "2000-01-01T06:40:00.000Z",
    };
    render(<RaceCard race={pastRace} />);
    expect(screen.queryByText("発走予定")).not.toBeInTheDocument();
    expect(screen.queryByText("発走確定")).not.toBeInTheDocument();
  });

  it("確定フラグに関わらず '発走確定' バッジは表示されないこと", () => {
    const confirmedUpcomingRace: Race = {
      ...mockRace,
      start_time: "2099-12-31T06:40:00.000Z",
      is_time_confirmed: true,
    };
    render(<RaceCard race={confirmedUpcomingRace} />);
    expect(screen.getByText("発走予定")).toBeInTheDocument();
    expect(screen.queryByText("発走確定")).not.toBeInTheDocument();
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
