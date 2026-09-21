import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RaceCard } from "../../src/components/shared/RaceCard";
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

describe("RaceCard", () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: "ja" });
  });

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

  it("発走時刻前かつ確定済みのレースにおいて、'発走予定' バッジが表示されること", () => {
    const upcomingRace: Race = {
      ...mockRace,
      start_time: "2099-12-31T06:40:00.000Z",
      is_time_confirmed: true,
    };
    render(<RaceCard race={upcomingRace} />);
    expect(screen.getByText("発走予定")).toBeInTheDocument();
    expect(screen.queryByText("発走確定")).not.toBeInTheDocument();
  });

  it("発走時刻が未確定のレースにおいて、'時刻未定' が表示され '発走予定' バッジが表示されないこと (Issue #56)", () => {
    const unconfirmedRace: Race = {
      ...mockRace,
      is_time_confirmed: false,
    };
    render(<RaceCard race={unconfirmedRace} />);
    expect(screen.getByText("時刻未定")).toBeInTheDocument();
    expect(screen.queryByText("発走予定")).not.toBeInTheDocument();
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

  it("代替開催（is_rescheduled=true）のレースにおいて、代替開催バッジと当初予定日が表示されること", () => {
    const rescheduledRace: Race = {
      ...mockRace,
      date: "2026-02-23", // 順延後の月曜
      is_rescheduled: true,
      original_date: "2026-02-22", // 当初の日曜
    };

    render(<RaceCard race={rescheduledRace} />);

    expect(screen.getByText("代替開催")).toBeInTheDocument();
    expect(screen.getByText(/当初予定: 2026年2月22日\(日\) から順延/)).toBeInTheDocument();

    // aria-label にも代替開催の旨が含まれること
    const card = screen.getByRole("button", { name: "フェブラリーステークス（代替開催） 詳細を表示" });
    expect(card).toBeInTheDocument();
  });

  it("isToday=true の場合、カードにハイライトスタイル（ring-2等）と'本日開催'バッジが表示されること", () => {
    render(<RaceCard race={mockRace} isToday={true} />);

    const card = screen.getByRole("button", { name: "フェブラリーステークス 詳細を表示" });
    expect(card).toHaveClass("ring-2");
    expect(card).toHaveClass("ring-primary/80");
    expect(screen.getByText("本日開催")).toBeInTheDocument();
  });

  it("isToday=false の場合、'本日開催'バッジが表示されないこと", () => {
    render(<RaceCard race={mockRace} isToday={false} />);

    const card = screen.getByRole("button", { name: "フェブラリーステークス 詳細を表示" });
    expect(card).not.toHaveClass("ring-2");
    expect(screen.queryByText("本日開催")).not.toBeInTheDocument();
  });

  describe("多言語表示 (en)", () => {
    beforeEach(() => {
      useLanguageStore.setState({ language: "en" });
    });

    it("英語モード時にレース名、競馬場名、馬場、出走条件、aria-labelが英語化されること", () => {
      render(<RaceCard race={mockRace} />);

      // 主タイトルが英語、副タイトルが日本語
      expect(screen.getByText("February Stakes")).toBeInTheDocument();
      expect(screen.getByText("フェブラリーステークス")).toBeInTheDocument();

      // 競馬場名・コース・条件
      expect(screen.getByText("Tokyo")).toBeInTheDocument();
      expect(screen.getByText("Dirt 1600m")).toBeInTheDocument();
      expect(screen.getByText("4yo+")).toBeInTheDocument();
      expect(screen.getByText("Weight for Age")).toBeInTheDocument();

      // aria-label
      const card = screen.getByRole("button", { name: "February Stakes View Details" });
      expect(card).toBeInTheDocument();
    });

    it("英語モード時に確定済みレースの発走予定バッジ（Scheduled）および本日開催バッジ（Today）が表示されること", () => {
      const upcomingRace: Race = {
        ...mockRace,
        start_time: "2099-12-31T06:40:00.000Z",
        is_time_confirmed: true,
      };
      render(<RaceCard race={upcomingRace} isToday={true} />);

      expect(screen.getByText("Scheduled")).toBeInTheDocument();
      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("英語モード時に未確定レースで 'TBD' が表示されること (Issue #56)", () => {
      const unconfirmedRace: Race = {
        ...mockRace,
        is_time_confirmed: false,
      };
      render(<RaceCard race={unconfirmedRace} />);

      expect(screen.getByText("TBD")).toBeInTheDocument();
      expect(screen.queryByText("Scheduled")).not.toBeInTheDocument();
    });

    it("英語モード時に代替開催バッジ（Rescheduled）および当初予定日が英語フォーマットで表示されること", () => {
      const rescheduledRace: Race = {
        ...mockRace,
        date: "2026-02-23",
        is_rescheduled: true,
        original_date: "2026-02-22",
      };
      render(<RaceCard race={rescheduledRace} />);

      expect(screen.getByText("Rescheduled")).toBeInTheDocument();
      expect(screen.getByText(/Postponed from Sun, Feb 22, 2026/)).toBeInTheDocument();

      const card = screen.getByRole("button", {
        name: "February Stakes (Rescheduled) View Details",
      });
      expect(card).toBeInTheDocument();
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

    it("フランス重賞カードに国コード「FR」バッジおよび「FRANCE GALOP」が表示されること", () => {
      render(<RaceCard race={mockFranceRace} />);

      expect(screen.getByText("FR")).toBeInTheDocument();
      expect(screen.getByText("FRANCE GALOP")).toBeInTheDocument();
      expect(screen.getByText("凱旋門賞")).toBeInTheDocument();
      expect(screen.getByText("Prix de l'Arc de Triomphe")).toBeInTheDocument();
      expect(screen.getByText("パリロンシャン")).toBeInTheDocument();
    });

    it("英語モード時にフランス重賞で英語名とフランス語名が一致する場合、サブ名称が表示されないこと", () => {
      useLanguageStore.setState({ language: "en" });
      render(<RaceCard race={mockFranceRace} />);

      expect(screen.getByText("Prix de l'Arc de Triomphe")).toBeInTheDocument();
      expect(screen.queryByText("凱旋門賞")).not.toBeInTheDocument();
    });

    it("フランス語モード時にフランス重賞カードが正しく表示されること", () => {
      useLanguageStore.setState({ language: "fr" });
      render(<RaceCard race={mockFranceRace} />);

      expect(screen.getByText("Prix de l'Arc de Triomphe")).toBeInTheDocument();
      expect(screen.getByText("FR")).toBeInTheDocument();
      expect(screen.getByText("ParisLongchamp")).toBeInTheDocument();
      expect(screen.getByText("Gazon 2400m")).toBeInTheDocument();
    });
  });
});

