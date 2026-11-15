import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  resolveRedirectTargetUrl,
  generatePagesRedirectBundle,
  REDIRECT_LOCALES,
  TARGET_ORIGIN,
} from '../../scripts/lib/pages-redirect';

describe('GitHub Pages to Firebase Hosting Redirect (Issue #303)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pages-redirect-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('resolveRedirectTargetUrl', () => {
    it('旧ルートパス (/horse-racing-calender/) を Firebase ルートへ変換すること', () => {
      expect(resolveRedirectTargetUrl('/horse-racing-calender/')).toBe(
        'https://horse-racing-calendar.web.app/'
      );
      expect(resolveRedirectTargetUrl('/horse-racing-calender')).toBe(
        'https://horse-racing-calendar.web.app/'
      );
    });

    it('4言語サブパス (/ja/, /en/, /fr/, /zh/) を維持して変換すること', () => {
      expect(resolveRedirectTargetUrl('/horse-racing-calender/ja/')).toBe(
        'https://horse-racing-calendar.web.app/ja/'
      );
      expect(resolveRedirectTargetUrl('/horse-racing-calender/en/')).toBe(
        'https://horse-racing-calendar.web.app/en/'
      );
      expect(resolveRedirectTargetUrl('/horse-racing-calender/fr/')).toBe(
        'https://horse-racing-calendar.web.app/fr/'
      );
      expect(resolveRedirectTargetUrl('/horse-racing-calender/zh/')).toBe(
        'https://horse-racing-calendar.web.app/zh/'
      );
    });

    it('クエリパラメータ (?year=2027) やハッシュ (#2027-05-01) を維持して変換すること', () => {
      expect(
        resolveRedirectTargetUrl('/horse-racing-calender/ja/', '?year=2027', '#2027-05-01')
      ).toBe('https://horse-racing-calendar.web.app/ja/?year=2027#2027-05-01');
    });
  });

  describe('generatePagesRedirectBundle', () => {
    it('ルート index.html, 404.html, 4言語 HTML (ja/en/fr/zh), sw.js, robots.txt, .nojekyll を生成すること', () => {
      generatePagesRedirectBundle(tempDir);

      expect(fs.existsSync(path.join(tempDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '404.html'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'ja', 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'en', 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'fr', 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'zh', 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'sw.js'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'robots.txt'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.nojekyll'))).toBe(true);
    });

    it('日・英・仏・中の各言語 HTML に適切な lang, canonical, meta refresh, 多言語テキストが含まれること', () => {
      generatePagesRedirectBundle(tempDir);

      for (const langKey of ['ja', 'en', 'fr', 'zh'] as const) {
        const meta = REDIRECT_LOCALES[langKey];
        const html = fs.readFileSync(path.join(tempDir, langKey, 'index.html'), 'utf-8');
        const expectedUrl = `${TARGET_ORIGIN}/${langKey}/`;

        expect(html).toContain(`<html lang="${meta.htmlLang}">`);
        expect(html).toContain(`<title>${meta.title}</title>`);
        expect(html).toContain(`<link rel="canonical" href="${expectedUrl}" />`);
        expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${expectedUrl}" />`);
        expect(html).toContain(meta.heading);
        expect(html).toContain(meta.message);
        expect(html).toContain(meta.buttonLabel);
        expect(html).toContain('window.location.replace(destination)');
      }
    });

    it('sw.js に旧 Service Worker 自己解除・キャッシュ削除・クライアント転送処理が含まれること', () => {
      generatePagesRedirectBundle(tempDir);
      const swContent = fs.readFileSync(path.join(tempDir, 'sw.js'), 'utf-8');

      expect(swContent).toContain('self.skipWaiting()');
      expect(swContent).toContain('caches.keys()');
      expect(swContent).toContain('self.registration.unregister()');
      expect(swContent).toContain('client.navigate(');
      expect(swContent).toContain(TARGET_ORIGIN);
    });
  });
});
