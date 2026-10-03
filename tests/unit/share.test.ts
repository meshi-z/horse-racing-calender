import { describe, it, expect } from 'vitest';
import { getLocalizedPath, getShareUrl } from '@/libs/share';

describe('share utility', () => {
  describe('getLocalizedPath', () => {
    it('ルート base (/) の場合に正しいパスを返すこと', () => {
      expect(getLocalizedPath('ja', '/')).toBe('/ja/');
      expect(getLocalizedPath('en', '/')).toBe('/en/');
      expect(getLocalizedPath('fr', '/')).toBe('/fr/');
      expect(getLocalizedPath('zh', '/')).toBe('/zh/');
    });

    it('サブディレクトリ base (/horse-racing-calender/) の場合に正しいパスを返すこと', () => {
      const base = '/horse-racing-calender/';
      expect(getLocalizedPath('ja', base)).toBe('/horse-racing-calender/ja/');
      expect(getLocalizedPath('en', base)).toBe('/horse-racing-calender/en/');
      expect(getLocalizedPath('fr', base)).toBe('/horse-racing-calender/fr/');
      expect(getLocalizedPath('zh', base)).toBe('/horse-racing-calender/zh/');
    });
  });

  describe('getShareUrl', () => {
    it('指定された URL から言語パスを差し替えて完全なURLを生成すること', () => {
      const currentUrl = 'https://example.com/horse-racing-calender/ja/?filter=g1#2026-05-31';
      const shareUrl = getShareUrl('en', currentUrl);
      expect(shareUrl).toContain('/en/');
      expect(shareUrl).toContain('filter=g1');
      expect(shareUrl).toContain('#2026-05-31');
    });

    it('ブラウザ環境外でもフォールバックURLを生成できること', () => {
      const url = getShareUrl('ja');
      expect(url).toContain('/ja/');
    });
  });
});
