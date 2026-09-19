import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RaceDetailDialog } from "../../src/components/shared/RaceDetailDialog";
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

describe("RaceDetailDialog", () => {
  it("発走時刻前のレースにおいて、'発走予定' バッジが表示されること", () => {
    const upcomingRace: Race = {
      ...mockRace,
      start_time: "2099-12-31T06:40:00.000Z",
    };
    render(
      <RaceDetailDialog
        race={upcomingRace}
        open={true}
        onOpenChange={vi.fn()}
      />
    );
    expect(screen.getByText("発走予定")).toBeInTheDocument();
    expect(screen.queryByText("発走確定")).not.toBeInTheDocument();
  });

  it("発走時刻を経過したレースにおいて、'発走予定' バッジが表示されないこと", () => {
    const pastRace: Race = {
      ...mockRace,
      start_time: "2000-01-01T06:40:00.000Z",
    };
    render(
      <RaceDetailDialog
        race={pastRace}
        open={true}
        onOpenChange={vi.fn()}
      />
    );
    expect(screen.queryByText("発走予定")).not.toBeInTheDocument();
    expect(screen.queryByText("発走確定")).not.toBeInTheDocument();
  });

  it("確定フラグに関わらず '発走確定' バッジは表示されないこと", () => {
    const confirmedUpcomingRace: Race = {
      ...mockRace,
      start_time: "2099-12-31T06:40:00.000Z",
      is_time_confirmed: true,
    };
    render(
      <RaceDetailDialog
        race={confirmedUpcomingRace}
        open={true}
        onOpenChange={vi.fn()}
      />
    );
    expect(screen.getByText("発走予定")).toBeInTheDocument();
    expect(screen.queryByText("発走確定")).not.toBeInTheDocument();
  });

  it("代替開催（is_rescheduled=true）のレースにおいて、代替開催バッジと日程変更案内が表示されること", () => {
    const rescheduledRace: Race = {
      ...mockRace,
      date: "2026-02-23",
      is_rescheduled: true,
      original_date: "2026-02-22",
    };
    render(
      <RaceDetailDialog
        race={rescheduledRace}
        open={true}
        onOpenChange={vi.fn()}
      />
    );
    expect(screen.getByText("代替開催")).toBeInTheDocument();
    expect(screen.getByText("悪天候等による代替開催（日程変更）")).toBeInTheDocument();
    expect(screen.getByText(/2026年2月22日\(日\)/)).toBeInTheDocument();
  });

  it("出走条件・負担重量において斤量が日本語のみで表示され英語が併記されないこと", () => {
    render(
      <RaceDetailDialog
        race={mockRace}
        open={true}
        onOpenChange={vi.fn()}
      />
    );
    expect(screen.getByText("斤量: 定量")).toBeInTheDocument();
    expect(screen.queryByText(/Weight for Age/)).not.toBeInTheDocument();
  });
});
