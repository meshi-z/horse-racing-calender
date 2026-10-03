import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ENABLE_OFFICIAL_LINKS } from '@/libs/officialUrl';
import { RaceDetailDialog } from '@/components/shared/RaceDetailDialog';
import { RaceCard } from '@/components/shared/RaceCard';
import { useLanguageStore } from '@/store/useLanguageStore';
import type { Race } from '@/types/race';

const mockUnconfirmedRace: Race = {
  id: '2026-jp-g1-01',
  organization: 'jra',
  country_code: 'JP',
  name: {
    ja: 'フェブラリーステークス',
    en: 'February Stakes',
  },
  grade: 'G1',
  date: '2026-02-22',
  start_time: '2026-02-22T06:40:00.000Z',
  is_time_confirmed: true,
  course: {
    ja: '東京競馬場',
    en: 'Tokyo Racecourse',
  },
  distance: 1600,
  track_type: 'dirt',
  sex_constraint: 'none',
  age_constraint: '4yo_and_up',
  handicap: {
    code: 'set_weight',
    ja: '定量',
    en: 'Set Weight',
  },
};

const mockNarRace: Race = {
  id: '2026-nar-local-01',
  organization: 'nar',
  country_code: 'JP',
  name: {
    ja: '帝王賞',
    en: 'Teio Sho',
  },
  grade: 'Jpn1',
  date: '2026-06-24',
  start_time: '2026-06-24T11:10:00.000Z',
  is_time_confirmed: true,
  course: {
    ja: '大井',
    en: 'Oi',
  },
  distance: 2000,
  track_type: 'dirt',
  sex_constraint: 'none',
  age_constraint: '4yo_and_up',
  handicap: {
    code: 'set_weight',
    ja: '定量',
    en: 'Set Weight',
  },
  race_number: 11,
};

describe('UI Integration: Official race link Phase 1 (Issue #157)', () => {
  it('ENABLE_OFFICIAL_LINKS が true であること', () => {
    expect(ENABLE_OFFICIAL_LINKS).toBe(true);
  });

  describe('未定時非表示制御', () => {
    it('official_url未設定かつ動的解決不能な未定レースでは、RaceDetailDialog に公式リンクボタンが表示されないこと', () => {
      useLanguageStore.getState().setLanguage('ja');
      render(
        <RaceDetailDialog
          race={mockUnconfirmedRace}
          open={true}
          onOpenChange={() => {}}
        />
      );

      const linkBtn = screen.queryByTestId('official-race-link-btn');
      expect(linkBtn).not.toBeInTheDocument();
    });

    it('未定レースでは、RaceCard 上に外部リンクアイコンボタンが表示されないこと', () => {
      useLanguageStore.getState().setLanguage('ja');
      const onSelectMock = vi.fn();
      render(<RaceCard race={mockUnconfirmedRace} onSelect={onSelectMock} />);

      const linkIcon = screen.queryByTestId('race-card-official-link');
      expect(linkIcon).not.toBeInTheDocument();
    });
  });

  describe('確度の高い検証済みレースのリンク表示と未検証レースの非表示', () => {
    it('NAR等の未検証レースでは、RaceDetailDialog に公式リンクボタンが表示されないこと (Issue #176)', () => {
      useLanguageStore.getState().setLanguage('ja');
      render(
        <RaceDetailDialog
          race={mockNarRace}
          open={true}
          onOpenChange={() => {}}
        />
      );

      const linkBtn = screen.queryByTestId('official-race-link-btn');
      expect(linkBtn).not.toBeInTheDocument();
    });

    it('NAR等の未検証レースでは、RaceCard 上に外部リンクアイコンボタンが表示されないこと (Issue #176)', () => {
      useLanguageStore.getState().setLanguage('ja');
      const onSelectMock = vi.fn();
      render(<RaceCard race={mockNarRace} onSelect={onSelectMock} />);

      const linkIcon = screen.queryByTestId('race-card-official-link');
      expect(linkIcon).not.toBeInTheDocument();
    });

    it('JRA G1など verified な official_url が設定されているレースでは、リンクボタンおよびアイコンが表示されること', () => {
      useLanguageStore.getState().setLanguage('ja');
      const raceWithVerifiedUrl: Race = {
        ...mockUnconfirmedRace,
        official_url: 'https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html',
      };

      render(
        <RaceDetailDialog
          race={raceWithVerifiedUrl}
          open={true}
          onOpenChange={() => {}}
        />
      );

      const linkBtn = screen.getByTestId('official-race-link-btn');
      expect(linkBtn).toBeInTheDocument();
      expect(linkBtn).toHaveAttribute('href', 'https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html');
      expect(linkBtn).toHaveAttribute('target', '_blank');
      expect(linkBtn).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('verified な official_url があるレースでは、RaceCard 上にアイコンが表示されること', () => {
      useLanguageStore.getState().setLanguage('ja');
      const onSelectMock = vi.fn();
      const raceWithVerifiedUrl: Race = {
        ...mockUnconfirmedRace,
        official_url: 'https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html',
      };
      render(<RaceCard race={raceWithVerifiedUrl} onSelect={onSelectMock} />);

      const linkIcon = screen.getByTestId('race-card-official-link');
      expect(linkIcon).toBeInTheDocument();
      expect(linkIcon).toHaveAttribute('href', 'https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html');
    });
  });

  it('カードクリック時に詳細ダイアログ展開が正常に機能すること', () => {
    const onSelectMock = vi.fn();
    render(<RaceCard race={mockNarRace} onSelect={onSelectMock} />);

    const card = screen.getByRole('button', { name: /帝王賞/ });
    expect(card).toBeInTheDocument();

    fireEvent.click(card);
    expect(onSelectMock).toHaveBeenCalledTimes(1);
    expect(onSelectMock).toHaveBeenCalledWith(mockNarRace);
  });
});
