import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ENABLE_OFFICIAL_LINKS } from '@/libs/officialUrl';
import { RaceDetailDialog } from '@/components/shared/RaceDetailDialog';
import { RaceCard } from '@/components/shared/RaceCard';
import { useLanguageStore } from '@/store/useLanguageStore';
import type { Race } from '@/types/race';

const mockBaseRace: Race = {
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

describe('UI Integration: Official race link temporary disabling (Issue #155)', () => {
  it('ENABLE_OFFICIAL_LINKS が false のとき、RaceDetailDialog に公式リンクボタンが表示されないこと', () => {
    expect(ENABLE_OFFICIAL_LINKS).toBe(false);
    useLanguageStore.getState().setLanguage('ja');
    const raceWithUrl: Race = {
      ...mockBaseRace,
      official_url: 'https://www.jra.go.jp/keiba/thisweek/2026/0222_1/',
    };

    render(
      <RaceDetailDialog
        race={raceWithUrl}
        open={true}
        onOpenChange={() => {}}
      />
    );

    const linkBtn = screen.queryByTestId('official-race-link-btn');
    expect(linkBtn).not.toBeInTheDocument();
  });

  it('ENABLE_OFFICIAL_LINKS が false のとき、RaceCard 上に外部リンクアイコンボタンが表示されないこと', () => {
    expect(ENABLE_OFFICIAL_LINKS).toBe(false);
    useLanguageStore.getState().setLanguage('ja');
    const onSelectMock = vi.fn();
    render(<RaceCard race={mockBaseRace} onSelect={onSelectMock} />);

    const linkIcon = screen.queryByTestId('race-card-official-link');
    expect(linkIcon).not.toBeInTheDocument();
  });

  it('外部リンク非表示時も、カード全体のクリックイベントや詳細ダイアログ展開が正常に機能すること', () => {
    const onSelectMock = vi.fn();
    render(<RaceCard race={mockBaseRace} onSelect={onSelectMock} />);

    const card = screen.getByRole('button', { name: /フェブラリーステークス/ });
    expect(card).toBeInTheDocument();

    fireEvent.click(card);
    expect(onSelectMock).toHaveBeenCalledTimes(1);
    expect(onSelectMock).toHaveBeenCalledWith(mockBaseRace);
  });
});
