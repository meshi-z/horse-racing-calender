import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Web App Manifest configuration', () => {
  const rootDir = process.cwd();
  const viteConfigPath = path.resolve(rootDir, 'vite.config.ts');
  const distManifestPath = path.resolve(rootDir, 'dist/manifest.webmanifest');

  it('vite.config.ts に英語デフォルトおよび多言語ローカライズ設定が含まれていること', () => {
    const configContent = fs.readFileSync(viteConfigPath, 'utf-8');

    // デフォルト英語設定
    expect(configContent).toContain("lang: 'en'");
    expect(configContent).toContain("name: 'Graded Races - Horse Racing Calendar'");
    expect(configContent).toContain("short_name: 'Graded Races'");

    // localized フィールド
    expect(configContent).toContain("short_name_localized:");
    expect(configContent).toContain("ja: '重賞カレンダー'");
    expect(configContent).toContain("fr: 'Courses de Groupe'");
    expect(configContent).toContain("zh: '分級賽行事曆'");

    // translations フィールド
    expect(configContent).toContain("translations:");
    expect(configContent).toContain("ja: {");
    expect(configContent).toContain("fr: {");
    expect(configContent).toContain("zh: {");
  });

  it('dist/manifest.webmanifest が生成されている場合、W3C標準およびローカライズ定義を充足すること', () => {
    if (!fs.existsSync(distManifestPath)) {
      // ビルド前環境スキップ
      return;
    }
    const manifest = JSON.parse(fs.readFileSync(distManifestPath, 'utf-8'));

    // デフォルト基底言語
    expect(manifest.lang).toBe('en');
    expect(manifest.name).toBe('Graded Races - Horse Racing Calendar');
    expect(manifest.short_name).toBe('Graded Races');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#047B5F');

    // 多言語 translations
    expect(manifest.translations).toBeDefined();
    expect(manifest.translations.ja.short_name).toBe('重賞カレンダー');
    expect(manifest.translations.fr.short_name).toBe('Courses de Groupe');
    expect(manifest.translations.zh.short_name).toBe('分級賽行事曆');

    // localized 互換フィールド
    expect(manifest.short_name_localized).toBeDefined();
    expect(manifest.short_name_localized.ja).toBe('重賞カレンダー');
    expect(manifest.short_name_localized.fr).toBe('Courses de Groupe');
    expect(manifest.short_name_localized.zh).toBe('分級賽行事曆');
  });
});
