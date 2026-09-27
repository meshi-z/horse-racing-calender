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

  it("発走時刻前かつ確定済みのレースにおいて、'発走予定' バッジが表示され '発走時刻はいつ決まる？' は表示されないこと", () => {
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
    expect(
      screen.queryByRole("button", { name: "発走時刻はいつ決まる？" })
    ).not.toBeInTheDocument();
  });

  it("発走時刻が未確定のレースにおいて、'時刻未定' と '発走時刻はいつ決まる？' リンクが表示されること (Issue #56, #136)", () => {
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
    expect(
      screen.getByRole("button", { name: "発走時刻はいつ決まる？" })
    ).toBeInTheDocument();
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

    it("英語モード時に英語名と原語名が同一ならサブが表示されず主催者がFrance Galopとなること", () => {
      useLanguageStore.setState({ language: "en" });
      render(
        <RaceDetailDialog
          race={mockFranceRace}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("Prix de l'Arc de Triomphe")).toBeInTheDocument();
      expect(screen.queryByText("凱旋門賞")).not.toBeInTheDocument();
      expect(screen.getByText("France Galop")).toBeInTheDocument();
    });

    it("フランス語モード時に詳細ダイアログが正しく表示されること", () => {
      useLanguageStore.setState({ language: "fr" });
      render(
        <RaceDetailDialog
          race={mockFranceRace}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("Prix de l'Arc de Triomphe")).toBeInTheDocument();
      expect(screen.getByText("Hippodrome")).toBeInTheDocument();
      expect(screen.getByText("Piste & Distance")).toBeInTheDocument();
    });
  });

  describe("勝ち馬（winner）結果表示機能 (Issue #138)", () => {
    const raceWithWinner: Race = {
      ...mockRace,
      winner: {
        name: {
          ja: "ダノンデサイル",
          en: "Danon Decile",
          fr: "Danon Decile",
          zh: "野田分位",
        },
        jockey: {
          ja: "横山典弘",
          en: "Norihiro Yokoyama",
          fr: "Norihiro Yokoyama",
          zh: "橫山典弘",
        },
        horse_number: 5,
        time: "2:24.3",
      },
    };

    it("winnerが存在する場合、レース結果/優勝セクションが表示され馬名・騎手・馬番・タイムが表示されること", () => {
      render(
        <RaceDetailDialog
          race={raceWithWinner}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const section = screen.getByTestId("race-winner-section");
      expect(section).toBeInTheDocument();
      expect(screen.getByText("レース結果 / 優勝")).toBeInTheDocument();
      expect(screen.getByText("ダノンデサイル")).toBeInTheDocument();
      expect(screen.getByText("Danon Decile")).toBeInTheDocument();
      expect(screen.getByText("5番")).toBeInTheDocument();
      expect(screen.getByText("横山典弘")).toBeInTheDocument();
      expect(screen.getByText("2:24.3")).toBeInTheDocument();
    });

    it("多言語切り替え時にラベルおよび勝ち馬情報が翻訳されること", () => {
      useLanguageStore.setState({ language: "en" });
      const { rerender } = render(
        <RaceDetailDialog
          race={raceWithWinner}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("Race Result / Winner")).toBeInTheDocument();
      expect(screen.getByText("No. 5")).toBeInTheDocument();
      expect(screen.getByText("Norihiro Yokoyama")).toBeInTheDocument();

      useLanguageStore.setState({ language: "zh" });
      rerender(
        <RaceDetailDialog
          race={raceWithWinner}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("賽事結果 / 冠軍")).toBeInTheDocument();
      expect(screen.getByText("5號")).toBeInTheDocument();
      expect(screen.getByText("野田分位")).toBeInTheDocument();
      expect(screen.getByText("橫山典弘")).toBeInTheDocument();
    });

    it("winnerが存在しない場合はレース結果セクションが表示されないこと", () => {
      render(
        <RaceDetailDialog
          race={mockRace}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.queryByTestId("race-winner-section")).not.toBeInTheDocument();
    });
  });
});

