import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DEFAULT_OFFICIAL_URLS } from '@/libs/officialUrl';
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

describe('UI Integration: Official race link in RaceDetailDialog', () => {
  it('公式リンクボタンが正しくレンダリングされ、属性（target, rel）が設定されていること', () => {
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

    const linkBtn = screen.getByTestId('official-race-link-btn');
    expect(linkBtn).toBeInTheDocument();
    expect(linkBtn).toHaveAttribute('href', 'https://www.jra.go.jp/keiba/thisweek/2026/0222_1/');
    expect(linkBtn).toHaveAttribute('target', '_blank');
    expect(linkBtn).toHaveAttribute('rel', 'noopener noreferrer');
    expect(linkBtn).toHaveAttribute('aria-label');
  });
});

describe('UI Integration: Official race link icon in RaceCard', () => {
  it('レースカード上に外部リンクアイコンボタンが存在し、クリック時にイベント伝播が抑止されること', () => {
    useLanguageStore.getState().setLanguage('ja');
    const onSelectMock = vi.fn();
    render(<RaceCard race={mockBaseRace} onSelect={onSelectMock} />);

    const linkIcon = screen.getByTestId('race-card-official-link');
    expect(linkIcon).toBeInTheDocument();
    expect(linkIcon).toHaveAttribute('target', '_blank');
    expect(linkIcon).toHaveAttribute('rel', 'noopener noreferrer');
    expect(linkIcon).toHaveAttribute('href', DEFAULT_OFFICIAL_URLS.jra.ja);

    // リンクアイコンをクリックした際、カード全体の onSelect が呼ばれないこと（stopPropagationの検証）
    fireEvent.click(linkIcon);
    expect(onSelectMock).not.toHaveBeenCalled();
  });
});
