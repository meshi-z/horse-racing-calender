import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('Localized Static HTML Output (Issue #187)', () => {
  const distDir = path.resolve(process.cwd(), 'dist');

  beforeAll(() => {
    // dist が存在しない、または言語別HTMLがない場合はビルドを実行
    const jaHtmlPath = path.join(distDir, 'ja', 'index.html');
    if (!fs.existsSync(jaHtmlPath)) {
      execSync('npm run build', { stdio: 'pipe' });
    }
  }, 60000);

  it('ルート index.html が英語デフォルトOGPであること', () => {
    const indexPath = path.join(distDir, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);

    const html = fs.readFileSync(indexPath, 'utf-8');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('<title>Graded Races Calendar | Schedule of World Graded Races</title>');
    expect(html).toContain('property="og:locale" content="en_US"');
    expect(html).toContain('property="og:title" content="Graded Races Calendar | Schedule of World Graded Races"');
  });

  it('404.html が生成されていること', () => {
    const notFoundPath = path.join(distDir, '404.html');
    expect(fs.existsSync(notFoundPath)).toBe(true);
  });

  it('dist/ja/index.html に日本語OGPと日本語タイトルが設定されていること', () => {
    const jaPath = path.join(distDir, 'ja', 'index.html');
    expect(fs.existsSync(jaPath)).toBe(true);

    const html = fs.readFileSync(jaPath, 'utf-8');
    expect(html).toContain('<html lang="ja"');
    expect(html).toContain('<title>重賞カレンダー | 中央・地方・海外重賞レーススケジュール</title>');
    expect(html).toContain('property="og:locale" content="ja_JP"');
    expect(html).toContain('property="og:title" content="重賞カレンダー | 中央・地方・海外重賞レーススケジュール"');
    expect(html).toContain('name="twitter:title" content="重賞カレンダー | 中央・地方・海外重賞レーススケジュール"');
    expect(html).toContain('link rel="canonical" href="https://meshi-z.github.io/horse-racing-calender/ja/"');
  });

  it('dist/en/index.html に英語OGPと英語タイトルが設定されていること', () => {
    const enPath = path.join(distDir, 'en', 'index.html');
    expect(fs.existsSync(enPath)).toBe(true);

    const html = fs.readFileSync(enPath, 'utf-8');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('<title>Graded Races Calendar | Schedule of World Graded Races</title>');
    expect(html).toContain('property="og:locale" content="en_US"');
    expect(html).toContain('property="og:title" content="Graded Races Calendar | Schedule of World Graded Races"');
    expect(html).toContain('link rel="canonical" href="https://meshi-z.github.io/horse-racing-calender/en/"');
  });

  it('dist/fr/index.html にフランス語OGPとフランス語タイトルが設定されていること', () => {
    const frPath = path.join(distDir, 'fr', 'index.html');
    expect(fs.existsSync(frPath)).toBe(true);

    const html = fs.readFileSync(frPath, 'utf-8');
    expect(html).toContain('<html lang="fr"');
    expect(html).toContain('<title>Courses de Groupe | Calendrier Hippique International</title>');
    expect(html).toContain('property="og:locale" content="fr_FR"');
    expect(html).toContain('property="og:title" content="Courses de Groupe | Calendrier Hippique International"');
    expect(html).toContain('link rel="canonical" href="https://meshi-z.github.io/horse-racing-calender/fr/"');
  });

  it('dist/zh/index.html に繁体字中国語OGPと中国語タイトルが設定されていること', () => {
    const zhPath = path.join(distDir, 'zh', 'index.html');
    expect(fs.existsSync(zhPath)).toBe(true);

    const html = fs.readFileSync(zhPath, 'utf-8');
    expect(html).toContain('<html lang="zh-HK"');
    expect(html).toContain('<title>分級賽行事曆 | 香港・日本・歐美賽馬賽程</title>');
    expect(html).toContain('property="og:locale" content="zh_HK"');
    expect(html).toContain('property="og:title" content="分級賽行事曆 | 香港・日本・歐美賽馬賽程"');
    expect(html).toContain('link rel="canonical" href="https://meshi-z.github.io/horse-racing-calender/zh/"');
  });
});
