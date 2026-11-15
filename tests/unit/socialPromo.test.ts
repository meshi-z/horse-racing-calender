import { describe, expect, it } from 'vitest';
import type { Race } from '../../src/types/race.js';
import {
  buildFallbackTweet,
  buildGeminiPrompt,
  buildOAuth1Header,
  calculateWeightedTweetLength,
  formatHashtag,
  inferSocialMode,
  selectTargetRaces,
} from '../../scripts/lib/social-promo.js';

function makeRace(overrides: Partial<Race>): Race {
  return {
    id: 'test-1',
    organization: 'jra',
    country_code: 'JP',
    name: { ja: 'テストG1', en: 'Test G1' },
    grade: 'G1',
    date: '2026-11-15',
    start_time: '2026-11-15T06:40:00.000Z',
    is_time_confirmed: true,
    course: { ja: '東京', en: 'Tokyo' },
    distance: 2000,
    track_type: 'turf',
    sex_constraint: 'none',
    age_constraint: '3yo_and_up',
    handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
    ...overrides,
  };
}

describe('social-promo', () => {
  const sampleRaces: Race[] = [
    makeRace({
      id: 'jra-g1-sun',
      organization: 'jra',
      country_code: 'JP',
      grade: 'G1',
      name: { ja: 'エリザベス女王杯', en: 'Queen Elizabeth II Cup' },
      date: '2026-11-15',
      start_time: '2026-11-15T06:40:00.000Z',
      winner: { name: { ja: 'テストホース', en: 'Test Horse' } },
    }),
    makeRace({
      id: 'jra-g2-sat',
      organization: 'jra',
      country_code: 'JP',
      grade: 'G2',
      name: { ja: 'デイリー杯2歳S', en: 'Daily Hai Nisai Stakes' },
      date: '2026-11-14',
      start_time: '2026-11-14T06:45:00.000Z',
    }),
    makeRace({
      id: 'nar-jpn1-wed',
      organization: 'nar',
      country_code: 'JP',
      grade: 'Jpn1',
      name: { ja: 'JBCクラシック', en: 'JBC Classic' },
      date: '2026-11-11',
      start_time: '2026-11-11T08:00:00.000Z',
    }),
    makeRace({
      id: 'eu-g1-sat',
      organization: 'france_galop',
      country_code: 'FR',
      grade: 'G1',
      name: { ja: 'ロワイヤルオーク賞', en: 'Prix Royal-Oak', fr: 'Prix Royal-Oak' },
      date: '2026-11-14',
      start_time: '2026-11-14T14:00:00.000Z',
    }),
    makeRace({
      id: 'us-g1-sat',
      organization: 'equibase',
      country_code: 'US',
      grade: 'G1',
      name: { ja: 'BCクラシック', en: "Breeders' Cup Classic" },
      date: '2026-11-14',
      start_time: '2026-11-14T22:00:00.000Z',
    }),
    makeRace({
      id: 'au-g1-sat',
      organization: 'racing_australia',
      country_code: 'AU',
      grade: 'G1',
      name: { ja: 'チャンピオンズS', en: 'Champions Stakes' },
      date: '2026-11-14',
      start_time: '2026-11-14T04:10:00.000Z',
    }),
    makeRace({
      id: 'hk-g1-sun',
      organization: 'hkjc',
      country_code: 'HK',
      grade: 'G1',
      name: { ja: '香港カップ', en: 'Hong Kong Cup', zh: '香港盃' },
      date: '2026-11-15',
      start_time: '2026-11-15T08:30:00.000Z',
    }),
  ];

  it('selectTargetRaces filters ja monday-preview to G1/Jpn1 in Mon..Sun and excludes G2', () => {
    const selected = selectTargetRaces(sampleRaces, 'ja', 'monday-preview', new Date(), '2026-11-09');
    const ids = selected.map((r) => r.id);
    expect(ids).toContain('jra-g1-sun');
    expect(ids).toContain('nar-jpn1-wed');
    expect(ids).toContain('eu-g1-sat');
    expect(ids).not.toContain('jra-g2-sat');
  });

  it('selectTargetRaces filters saturday-preview to Sunday races only', () => {
    const selected = selectTargetRaces(sampleRaces, 'ja', 'saturday-preview', new Date(), '2026-11-14');
    expect(selected.map((r) => r.id)).toEqual(['jra-g1-sun', 'hk-g1-sun']);
  });

  it('selectTargetRaces filters sunday-results to races with winner only', () => {
    const selected = selectTargetRaces(sampleRaces, 'ja', 'sunday-results', new Date(), '2026-11-15');
    expect(selected.map((r) => r.id)).toEqual(['jra-g1-sun']);
  });

  it('selectTargetRaces filters regional audiences (eu, us, au, hk)', () => {
    expect(
      selectTargetRaces(sampleRaces, 'eu', 'friday-preview', new Date(), '2026-11-13').map((r) => r.id)
    ).toEqual(['eu-g1-sat']);
    expect(
      selectTargetRaces(sampleRaces, 'us', 'friday-preview', new Date(), '2026-11-13').map((r) => r.id)
    ).toEqual(['us-g1-sat']);
    expect(
      selectTargetRaces(sampleRaces, 'au', 'friday-preview', new Date(), '2026-11-13').map((r) => r.id)
    ).toEqual(['au-g1-sat']);
    expect(
      selectTargetRaces(sampleRaces, 'hk', 'friday-preview', new Date(), '2026-11-13').map((r) => r.id)
    ).toEqual(['hk-g1-sun']);
  });

  it('formatHashtag strips spaces and punctuation cleanly', () => {
    expect(formatHashtag("Breeders' Cup Classic")).toBe('#BreedersCupClassic');
    expect(formatHashtag('Prix Royal-Oak')).toBe('#PrixRoyalOak');
    expect(formatHashtag('エリザベス女王杯')).toBe('#エリザベス女王杯');
  });

  it('calculateWeightedTweetLength counts URLs as 23 and CJK as 2', () => {
    expect(calculateWeightedTweetLength('abc https://example.com/a/b/c')).toBe(4 + 23);
    expect(calculateWeightedTweetLength('競馬')).toBe(4);
  });

  it('buildFallbackTweet includes hashtags, inline URL, and respects 280 weighted limit', () => {
    const url = 'https://horse-racing-calendar.web.app/ja/';
    const tweet = buildFallbackTweet([sampleRaces[0]], 'ja', 'sunday-results', url);
    expect(tweet).toContain('#エリザベス女王杯');
    expect(tweet).toContain('#テストホース');
    expect(tweet).toContain('#競馬');
    expect(tweet).toContain(url);
    expect(calculateWeightedTweetLength(tweet)).toBeLessThanOrEqual(280);
  });

  it('buildGeminiPrompt includes @meshi__z style examples and inline URL', () => {
    const url = 'https://horse-racing-calendar.web.app/ja/';
    const prompt = buildGeminiPrompt([sampleRaces[0]], 'ja', 'friday-preview', url);
    expect(prompt).toContain(url);
    expect(prompt).toContain('#競馬');
  });

  it('inferSocialMode maps Mon/Fri/Sat/Sun in target timezone', () => {
    // 2026-11-15T11:30:00Z is Sunday 20:30 JST
    expect(inferSocialMode(new Date('2026-11-15T11:30:00Z'), 'Asia/Tokyo')).toBe('sunday-results');
    // 2026-11-16T11:30:00Z is Monday 20:30 JST
    expect(inferSocialMode(new Date('2026-11-16T11:30:00Z'), 'Asia/Tokyo')).toBe('monday-preview');
  });

  it('buildOAuth1Header produces valid OAuth 1.0a Authorization header', () => {
    const header = buildOAuth1Header(
      'POST',
      'https://api.x.com/2/tweets',
      {
        apiKey: 'ck',
        apiSecret: 'cs',
        accessToken: 'tk',
        accessSecret: 'ts',
      },
      '1700000000',
      'nonce123'
    );
    expect(header.startsWith('OAuth ')).toBe(true);
    expect(header).toContain('oauth_consumer_key="ck"');
    expect(header).toContain('oauth_token="tk"');
    expect(header).toContain('oauth_signature_method="HMAC-SHA1"');
    expect(header).toContain('oauth_signature="');
  });
});
