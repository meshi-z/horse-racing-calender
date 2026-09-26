import { describe, it, expect } from 'vitest';
import { getRaceOriginLanguage, getLocalizedText, getRaceDisplayNames } from '../../src/libs/raceLanguage';
import type { Race } from '../../src/types/race';

describe('raceLanguage utility', () => {
  const sampleJraRace: Race = {
    id: '2026-jra-sample-arima',
    organization: 'jra',
    country_code: 'JP',
    name: {
      ja: '有馬記念',
      en: 'Arima Kinen',
    },
    grade: 'G1',
    date: '2026-12-27',
    start_time: '2026-12-27T06:25:00.000Z',
    is_time_confirmed: true,
    course: { ja: '中山', en: 'Nakayama' },
    distance: 2500,
    track_type: 'turf',
    sex_constraint: 'none',
    age_constraint: '3yo_and_up',
    handicap: { code: 'special_weight', ja: '定量', en: 'Weight for Age' },
  };

  const sampleJraDerby: Race = {
    id: '2026-jra-sample-derby',
    organization: 'jra',
    country_code: 'JP',
    name: {
      ja: '日本ダービー',
      en: 'Tokyo Yushun',
      fr: 'Derby Japonais',
    },
    grade: 'G1',
    date: '2026-05-31',
    start_time: '2026-05-31T06:40:00.000Z',
    is_time_confirmed: true,
    course: { ja: '東京', en: 'Tokyo' },
    distance: 2400,
    track_type: 'turf',
    sex_constraint: 'colt_and_filly',
    age_constraint: '3yo',
    handicap: { code: 'set_weight', ja: '馬齢', en: 'Set Weight' },
  };

  const sampleFranceRace: Race = {
    id: '2026-france-sample-arc',
    organization: 'france_galop',
    country_code: 'FR',
    name: {
      ja: '凱旋門賞',
      en: "Prix de l'Arc de Triomphe",
      fr: "Prix de l'Arc de Triomphe",
    },
    grade: 'G1',
    date: '2026-10-04',
    start_time: '2026-10-04T14:05:00.000Z',
    is_time_confirmed: true,
    course: { ja: 'パリロンシャン', en: 'ParisLongchamp', fr: 'ParisLongchamp' },
    distance: 2400,
    track_type: 'turf',
    sex_constraint: 'none',
    age_constraint: '3yo_and_up',
    handicap: { code: 'weight_for_age', ja: '馬齢', en: 'Weight for Age' },
  };

  const sampleUkRace: Race = {
    id: '2026-uk-sample-king-george',
    organization: 'overseas',
    country_code: 'GB',
    name: {
      ja: 'キングジョージ6世&QES',
      en: 'King George VI & Queen Elizabeth Stakes',
    },
    grade: 'G1',
    date: '2026-07-25',
    start_time: '2026-07-25T14:35:00.000Z',
    is_time_confirmed: true,
    course: { ja: 'アスコット', en: 'Ascot' },
    distance: 2400,
    track_type: 'turf',
    sex_constraint: 'none',
    age_constraint: '3yo_and_up',
    handicap: { code: 'weight_for_age', ja: '馬齢', en: 'Weight for Age' },
  };

  const sampleHkRace: Race = {
    id: '2026-hk-qeii-cup',
    organization: 'hkjc',
    country_code: 'HK',
    name: {
      ja: 'クイーンエリザベス2世カップ',
      en: 'Queen Elizabeth II Cup',
      zh: '富衛保險女皇盃',
    },
    grade: 'G1',
    date: '2026-04-26',
    start_time: '2026-04-26T08:40:00.000Z',
    is_time_confirmed: true,
    course: { ja: 'シャティン', en: 'Sha Tin' },
    distance: 2000,
    track_type: 'turf',
    sex_constraint: 'none',
    age_constraint: '3yo_and_up',
    handicap: { code: 'weight_for_age', ja: '馬齢', en: 'Weight for Age' },
  };

  const sampleIrelandRace: Race = {
    id: '2026-ie-sample-derby',
    organization: 'hri',
    country_code: 'IE',
    name: {
      ja: 'アイリッシュダービー',
      en: 'Irish Derby',
      zh: '愛爾蘭打吡',
      fr: "Derby d'Irlande",
    },
    grade: 'G1',
    date: '2026-06-28',
    start_time: '2026-06-28T15:05:00.000Z',
    is_time_confirmed: true,
    course: { ja: 'カラ', en: 'Curragh' },
    distance: 2400,
    track_type: 'turf',
    sex_constraint: 'colt_and_filly',
    age_constraint: '3yo',
    handicap: { code: 'set_weight', ja: '定量', en: 'Set Weights' },
  };

  describe('getRaceOriginLanguage', () => {
    it('JRA / NAR レースは ja を返すこと', () => {
      expect(getRaceOriginLanguage(sampleJraRace)).toBe('ja');
    });

    it('フランスレースは fr を返すこと', () => {
      expect(getRaceOriginLanguage(sampleFranceRace)).toBe('fr');
    });

    it('イギリスレースは en を返すこと', () => {
      expect(getRaceOriginLanguage(sampleUkRace)).toBe('en');
    });

    it('香港レースは zh を返すこと', () => {
      expect(getRaceOriginLanguage(sampleHkRace)).toBe('zh');
    });

    it('アイルランドレースは en を返すこと', () => {
      expect(getRaceOriginLanguage(sampleIrelandRace)).toBe('en');
    });
  });

  describe('getLocalizedText', () => {
    it('指定言語が存在する場合はその値を返すこと', () => {
      expect(getLocalizedText(sampleJraDerby.name, 'fr')).toBe('Derby Japonais');
    });

    it('指定言語が存在しない場合は en にフォールバックすること', () => {
      expect(getLocalizedText(sampleJraRace.name, 'fr')).toBe('Arima Kinen');
    });

    it('en も存在しない場合は ja にフォールバックすること', () => {
      expect(getLocalizedText({ ja: 'テスト' } as any, 'fr')).toBe('テスト');
    });
  });

  describe('getRaceDisplayNames', () => {
    describe('日本レース（原語: ja、fr未定義）', () => {
      it('日本語UI: メイン有馬記念、サブ英語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleJraRace, 'ja');
        expect(primary).toBe('有馬記念');
        expect(secondary).toBe('Arima Kinen');
      });

      it('英語UI: メイン英語、サブ日本語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleJraRace, 'en');
        expect(primary).toBe('Arima Kinen');
        expect(secondary).toBe('有馬記念');
      });

      it('フランス語UI: メイン英語フォールバック、サブ日本語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleJraRace, 'fr');
        expect(primary).toBe('Arima Kinen');
        expect(secondary).toBe('有馬記念');
      });

      it('繁体字中国語UI: メイン英語フォールバック、サブ日本語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleJraRace, 'zh');
        expect(primary).toBe('Arima Kinen');
        expect(secondary).toBe('有馬記念');
      });
    });

    describe('日本レース（原語: ja、fr定義あり: 日本ダービー）', () => {
      it('フランス語UI: メインDerby Japonais、サブ日本ダービー', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleJraDerby, 'fr');
        expect(primary).toBe('Derby Japonais');
        expect(secondary).toBe('日本ダービー');
      });
    });

    describe('フランスレース（原語: fr、凱旋門賞）', () => {
      it('日本語UI: メイン凱旋門賞、サブ原語フランス語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleFranceRace, 'ja');
        expect(primary).toBe('凱旋門賞');
        expect(secondary).toBe("Prix de l'Arc de Triomphe");
      });

      it('英語UI: メインPrix de l\'Arc de Triomphe、サブは同一のため非表示', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleFranceRace, 'en');
        expect(primary).toBe("Prix de l'Arc de Triomphe");
        expect(secondary).toBeUndefined();
      });

      it('フランス語UI: メインPrix de l\'Arc de Triomphe、サブは同一のため非表示', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleFranceRace, 'fr');
        expect(primary).toBe("Prix de l'Arc de Triomphe");
        expect(secondary).toBeUndefined();
      });

      it('繁体字中国語UI: メインPrix de l\'Arc de Triomphe、サブは同一のため非表示', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleFranceRace, 'zh');
        expect(primary).toBe("Prix de l'Arc de Triomphe");
        expect(secondary).toBeUndefined();
      });
    });

    describe('イギリスレース（原語: en、キングジョージ）', () => {
      it('日本語UI: メイン日本語、サブ原語英語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleUkRace, 'ja');
        expect(primary).toBe('キングジョージ6世&QES');
        expect(secondary).toBe('King George VI & Queen Elizabeth Stakes');
      });

      it('英語UI: 英語レース×英語UIのためサブ非表示', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleUkRace, 'en');
        expect(primary).toBe('King George VI & Queen Elizabeth Stakes');
        expect(secondary).toBeUndefined();
      });

      it('フランス語UI: メイン英語フォールバック、サブ非表示', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleUkRace, 'fr');
        expect(primary).toBe('King George VI & Queen Elizabeth Stakes');
        expect(secondary).toBeUndefined();
      });

      it('繁体字中国語UI: メイン英語フォールバック、サブ非表示', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleUkRace, 'zh');
        expect(primary).toBe('King George VI & Queen Elizabeth Stakes');
        expect(secondary).toBeUndefined();
      });
    });

    describe('香港レース（原語: zh、QEII世C）', () => {
      it('日本語UI: メイン日本語、サブ原語繁体字中国語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleHkRace, 'ja');
        expect(primary).toBe('クイーンエリザベス2世カップ');
        expect(secondary).toBe('富衛保險女皇盃');
      });

      it('英語UI: メイン英語、サブ原語繁体字中国語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleHkRace, 'en');
        expect(primary).toBe('Queen Elizabeth II Cup');
        expect(secondary).toBe('富衛保險女皇盃');
      });

      it('フランス語UI: メイン英語フォールバック、サブ原語繁体字中国語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleHkRace, 'fr');
        expect(primary).toBe('Queen Elizabeth II Cup');
        expect(secondary).toBe('富衛保險女皇盃');
      });

      it('繁体字中国語UI: メイン原語繁体字中国語、サブ英語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleHkRace, 'zh');
        expect(primary).toBe('富衛保險女皇盃');
        expect(secondary).toBe('Queen Elizabeth II Cup');
      });
    });

    describe('アイルランドレース（原語: en、愛ダービー）', () => {
      it('日本語UI: メイン日本語、サブ原語英語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleIrelandRace, 'ja');
        expect(primary).toBe('アイリッシュダービー');
        expect(secondary).toBe('Irish Derby');
      });

      it('英語UI: 英語レース×英語UIのためサブ非表示', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleIrelandRace, 'en');
        expect(primary).toBe('Irish Derby');
        expect(secondary).toBeUndefined();
      });

      it('フランス語UI: メイン仏語、サブ原語英語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleIrelandRace, 'fr');
        expect(primary).toBe("Derby d'Irlande");
        expect(secondary).toBe('Irish Derby');
      });

      it('繁体字中国語UI: メイン繁体字、サブ原語英語', () => {
        const { primary, secondary } = getRaceDisplayNames(sampleIrelandRace, 'zh');
        expect(primary).toBe('愛爾蘭打吡');
        expect(secondary).toBe('Irish Derby');
      });
    });
  });
});
