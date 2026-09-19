import { describe, it, expect } from 'vitest';
import { translations, t } from '@/libs/i18n';

describe('i18n dictionary & helper', () => {
  it('日本語と英語の辞書キー構造が完全に一致していること', () => {
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

    expect(jaKeys).toEqual(enKeys);
  });

  it('t() ヘルパーが指定したキーの文字列を正しく取得できること', () => {
    expect(t('nav.timeline', 'ja')).toBe('タイムライン');
    expect(t('nav.timeline', 'en')).toBe('Timeline');
    expect(t('nav.calendar', 'ja')).toBe('カレンダー');
    expect(t('nav.calendar', 'en')).toBe('Calendar');
    expect(t('status.scheduled', 'ja')).toBe('発走予定');
    expect(t('status.scheduled', 'en')).toBe('Scheduled');
  });

  it('存在しないキーが指定された場合はキー文字列そのものを返すこと', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(t('non.existent.key' as any, 'ja')).toBe('non.existent.key');
  });

  it('パラメータ展開が正常に機能すること', () => {
    expect(t('timeline.racesCount', 'ja', { count: 3 })).toBe('3レース');
    expect(t('timeline.racesCount', 'en', { count: 3 })).toBe('3 Races');
  });
});
