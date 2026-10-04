import { describe, it, expect } from 'vitest';
import { translations, t } from '@/libs/i18n';

describe('i18n dictionary & helper', () => {
  it('日本語、英語、フランス語、繁体字中国語の辞書キー構造が完全に一致していること', () => {
    function getKeys(obj: Record<string, any>, prefix = ''): string[] {
      return Object.keys(obj).reduce((res: string[], el) => {
        if (Array.isArray(obj[el])) {
          return res;
        } else if (typeof obj[el] === 'object' && obj[el] !== null) {
          return [...res, ...getKeys(obj[el], prefix + el + '.')];
        }
        return [...res, prefix + el];
      }, []);
    }

    const jaKeys = getKeys(translations.ja).sort();
    const enKeys = getKeys(translations.en).sort();
    const frKeys = getKeys(translations.fr).sort();
    const zhKeys = getKeys(translations.zh).sort();

    expect(jaKeys).toEqual(enKeys);
    expect(jaKeys).toEqual(frKeys);
    expect(jaKeys).toEqual(zhKeys);
  });

  it('t() ヘルパーが指定したキーの文字列を正しく取得できること', () => {
    expect(t('nav.timeline', 'ja')).toBe('タイムライン');
    expect(t('nav.timeline', 'en')).toBe('Timeline');
    expect(t('nav.timeline', 'fr')).toBe('Chronologie');
    expect(t('nav.timeline', 'zh')).toBe('時間軸');
    expect(t('nav.calendar', 'ja')).toBe('カレンダー');
    expect(t('nav.calendar', 'en')).toBe('Calendar');
    expect(t('nav.calendar', 'fr')).toBe('Calendrier');
    expect(t('nav.calendar', 'zh')).toBe('行事曆');
    expect(t('status.scheduled', 'ja')).toBe('発走予定');
    expect(t('status.scheduled', 'en')).toBe('Scheduled');
    expect(t('status.scheduled', 'fr')).toBe('Prévu');
    expect(t('status.scheduled', 'zh')).toBe('預計開跑');
  });

  it('存在しないキーが指定された場合はキー文字列そのものを返すこと', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(t('non.existent.key' as any, 'ja')).toBe('non.existent.key');
  });

  it('パラメータ展開が正常に機能すること', () => {
    expect(t('timeline.racesCount', 'ja', { count: 3 })).toBe('3レース');
    expect(t('timeline.racesCount', 'en', { count: 3 })).toBe('3 Races');
    expect(t('timeline.racesCount', 'fr', { count: 3 })).toBe('3 courses');
    expect(t('timeline.racesCount', 'zh', { count: 3 })).toBe('3 場賽事');
  });

  it('getLocalizedCourseName が日本語・英語・フランス語・繁体字中国語のコース名を適切に変換すること', async () => {
    const { getLocalizedCourseName } = await import('@/libs/i18n');
    expect(getLocalizedCourseName('東京', 'ja')).toBe('東京');
    expect(getLocalizedCourseName('東京', 'en')).toBe('Tokyo');
    expect(getLocalizedCourseName('東京', 'fr')).toBe('Tokyo');
    expect(getLocalizedCourseName('東京', 'zh')).toBe('東京');
    expect(getLocalizedCourseName('Tokyo', 'ja')).toBe('東京');
    expect(getLocalizedCourseName('Tokyo', 'en')).toBe('Tokyo');
    expect(getLocalizedCourseName('Tokyo', 'fr')).toBe('Tokyo');
    expect(getLocalizedCourseName('Tokyo', 'zh')).toBe('東京');
    expect(getLocalizedCourseName('パリロンシャン', 'fr')).toBe('ParisLongchamp');
    expect(getLocalizedCourseName('ParisLongchamp', 'ja')).toBe('パリロンシャン');
    expect(getLocalizedCourseName('ParisLongchamp', 'en')).toBe('ParisLongchamp');
    expect(getLocalizedCourseName('ParisLongchamp', 'fr')).toBe('ParisLongchamp');
    expect(getLocalizedCourseName('ParisLongchamp', 'zh')).toBe('巴黎隆尚');
    expect(getLocalizedCourseName('シャティン', 'zh')).toBe('沙田');
    expect(getLocalizedCourseName('Sha Tin', 'zh')).toBe('沙田');
    expect(getLocalizedCourseName('沙田', 'ja')).toBe('シャティン');
    expect(getLocalizedCourseName('ハッピーバレー', 'zh')).toBe('跑馬地');
    expect(getLocalizedCourseName('Happy Valley', 'zh')).toBe('跑馬地');
    expect(getLocalizedCourseName('跑馬地', 'en')).toBe('Happy Valley');
    expect(getLocalizedCourseName('UnknownCourse', 'en')).toBe('UnknownCourse');
  });

  it('getLocalizedCourseName がオーストラリアの競馬場名を日本語・英語・フランス語・繁体字中国語で正しく変換すること', async () => {
    const { getLocalizedCourseName } = await import('@/libs/i18n');
    expect(getLocalizedCourseName('フレミントン', 'ja')).toBe('フレミントン');
    expect(getLocalizedCourseName('フレミントン', 'en')).toBe('Flemington');
    expect(getLocalizedCourseName('フレミントン', 'fr')).toBe('Flemington');
    expect(getLocalizedCourseName('フレミントン', 'zh')).toBe('費明頓');
    expect(getLocalizedCourseName('Flemington', 'ja')).toBe('フレミントン');
    expect(getLocalizedCourseName('Flemington', 'zh')).toBe('費明頓');
    expect(getLocalizedCourseName('ロイヤルランドウィック', 'en')).toBe('Royal Randwick');
    expect(getLocalizedCourseName('Royal Randwick', 'zh')).toBe('皇家蘭域');
    expect(getLocalizedCourseName('コーフィールド', 'en')).toBe('Caulfield');
    expect(getLocalizedCourseName('Caulfield', 'zh')).toBe('考菲爾德');
    expect(getLocalizedCourseName('ローズヒルガーデンズ', 'en')).toBe('Rosehill Gardens');
    expect(getLocalizedCourseName('Rosehill Gardens', 'zh')).toBe('玫瑰崗');
    expect(getLocalizedCourseName('ムーニーバレー', 'en')).toBe('Moonee Valley');
    expect(getLocalizedCourseName('Moonee Valley', 'zh')).toBe('滿利谷');
    expect(getLocalizedCourseName('イーグルファーム', 'en')).toBe('Eagle Farm');
    expect(getLocalizedCourseName('ドゥームベン', 'en')).toBe('Doomben');
    expect(getLocalizedCourseName('モーフェットビル', 'en')).toBe('Morphettville');
    expect(getLocalizedCourseName('アスコット (豪)', 'en')).toBe('Ascot (AUS)');
    expect(getLocalizedCourseName('Ascot (AUS)', 'zh')).toBe('雅士閣 (澳洲)');
  });

  it('オーストラリア関連の辞書キーが全4言語で正しく取得できること', () => {
    expect(t('filter.orgAustralia', 'ja')).toBe('オーストラリア (Racing Australia)');
    expect(t('filter.orgAustralia', 'en')).toBe('Australia (Racing Australia)');
    expect(t('filter.orgAustralia', 'fr')).toBe('Australie (Racing Australia)');
    expect(t('filter.orgAustralia', 'zh')).toBe('澳洲 (Racing Australia)');

    expect(t('filter.regionOceania', 'ja')).toBe('オセアニア');
    expect(t('filter.regionOceania', 'en')).toBe('Oceania');
    expect(t('filter.regionOceania', 'fr')).toBe('Océanie');
    expect(t('filter.regionOceania', 'zh')).toBe('大洋洲');

    expect(t('filter.selectAllOceania', 'ja')).toBe('オセアニア全重賞');
    expect(t('filter.selectAllOceania', 'en')).toBe('All Oceania');
    expect(t('filter.selectAllOceania', 'fr')).toBe('Toute l\'Océanie');
    expect(t('filter.selectAllOceania', 'zh')).toBe('全大洋洲重賞');
  });
});
