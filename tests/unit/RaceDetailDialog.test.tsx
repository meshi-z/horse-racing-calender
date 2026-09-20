import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RaceDetailDialog } from "../../src/components/shared/RaceDetailDialog";
import { useLanguageStore } from "../../src/store/useLanguageStore";
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
  beforeEach(() => {
    useLanguageStore.setState({ language: "ja" });
  });

  it("発走時刻前かつ確定済みのレースにおいて、'発走予定' バッジが表示されること", () => {
    const upcomingRace: Race = {
      ...mockRace,
      start_time: "2099-12-31T06:40:00.000Z",
      is_time_confirmed: true,
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

  it("発走時刻が未確定のレースにおいて、'時刻未定' が表示され '発走予定' バッジが表示されないこと (Issue #56)", () => {
    const unconfirmedRace: Race = {
      ...mockRace,
      is_time_confirmed: false,
    };
    render(
      <RaceDetailDialog
        race={unconfirmedRace}
        open={true}
        onOpenChange={vi.fn()}
      />
    );
    expect(screen.getByText("時刻未定")).toBeInTheDocument();
    expect(screen.queryByText("発走予定")).not.toBeInTheDocument();
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

  describe("多言語表示 (en)", () => {
    beforeEach(() => {
      useLanguageStore.setState({ language: "en" });
    });

    it("英語モード時にモーダル各見出し・出走条件・斤量・代替開催案内が英語化されること", () => {
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

      // 見出し
      expect(screen.getByText("Course")).toBeInTheDocument();
      expect(screen.getByText("Track & Distance")).toBeInTheDocument();
      expect(screen.getByText("Eligibility & Weight")).toBeInTheDocument();

      // 馬場・出走資格・斤量
      expect(screen.getByText("Dirt 1600m")).toBeInTheDocument();
      expect(screen.getByText("4yo & Up")).toBeInTheDocument();
      expect(screen.getByText("Open to All")).toBeInTheDocument();
      expect(screen.getByText("Weight: Weight for Age")).toBeInTheDocument();

      // 代替開催案内
      expect(screen.getByText("Rescheduled")).toBeInTheDocument();
      expect(
        screen.getByText("Rescheduled Race (Date Postponed)")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Postponed from original scheduled date: Sun, Feb 22, 2026\./)
      ).toBeInTheDocument();
    });

    it("英語モード時に未確定レースで 'TBD' が表示されること (Issue #56)", () => {
      const unconfirmedRace: Race = {
        ...mockRace,
        is_time_confirmed: false,
      };

      render(
        <RaceDetailDialog
          race={unconfirmedRace}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("TBD")).toBeInTheDocument();
      expect(screen.queryByText("Scheduled")).not.toBeInTheDocument();
    });
  });

  describe("フランス競馬・海外重賞対応", () => {
    const mockFranceRace: Race = {
      id: "2026-france-g1-01",
      organization: "france_galop",
      country_code: "FR",
      name: {
        ja: "凱旋門賞",
        en: "Prix de l'Arc de Triomphe",
        fr: "Prix de l'Arc de Triomphe",
      },
      grade: "G1",
      date: "2026-10-04",
      start_time: "2026-10-04T14:05:00.000Z",
      is_time_confirmed: true,
      course: {
        ja: "パリロンシャン",
        en: "ParisLongchamp",
      },
      distance: 2400,
      track_type: "turf",
      sex_constraint: "none",
      age_constraint: "3yo_and_up",
      handicap: {
        code: "weight_for_age",
        ja: "定量",
        en: "Weight for Age",
      },
    };

    it("詳細ダイアログに国コード「FR」、主催者「France Galop (フランス)」、原語表記が表示されること", () => {
      render(
        <RaceDetailDialog
          race={mockFranceRace}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("FR")).toBeInTheDocument();
      expect(screen.getByText("France Galop (フランス)")).toBeInTheDocument();
      expect(screen.getByText("凱旋門賞")).toBeInTheDocument();
      expect(screen.getByText("Prix de l'Arc de Triomphe")).toBeInTheDocument();
    });
  });
});
