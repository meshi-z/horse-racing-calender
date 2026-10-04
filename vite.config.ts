import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';

const rawBase = process.env.BASE_URL || '/';
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

interface LanguageMeta {
  lang: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogLocale: string;
  twitterTitle: string;
  twitterDescription: string;
}

const LOCALIZED_METAS: Record<'ja' | 'en' | 'fr' | 'zh', LanguageMeta> = {
  ja: {
    lang: 'ja',
    title: '重賞カレンダー | 中央・地方・海外重賞レーススケジュール',
    description: 'JRA（中央競馬）、NAR（地方競馬・ばんえい）、および海外主要重賞の日程・確定発走時刻を網羅したオフライン対応カレンダー。',
    ogTitle: '重賞カレンダー | 中央・地方・海外重賞レーススケジュール',
    ogDescription: 'JRA（中央競馬）、NAR（地方競馬・ばんえい）、および海外主要重賞の日程・確定発走時刻を網羅したオフライン対応カレンダー。',
    ogLocale: 'ja_JP',
    twitterTitle: '重賞カレンダー | 中央・地方・海外重賞レーススケジュール',
    twitterDescription: 'JRA（中央競馬）、NAR（地方競馬・ばんえい）、および海外主要重賞の日程・確定発走時刻を網羅したオフライン対応カレンダー。',
  },
  en: {
    lang: 'en',
    title: 'Graded Races Calendar | Schedule of World Graded Races',
    description: 'Comprehensive schedule and confirmed race times for graded horse racing worldwide.',
    ogTitle: 'Graded Races Calendar | Schedule of World Graded Races',
    ogDescription: 'Comprehensive schedule and confirmed race times for graded horse racing worldwide.',
    ogLocale: 'en_US',
    twitterTitle: 'Graded Races Calendar | Schedule of World Graded Races',
    twitterDescription: 'Comprehensive schedule and confirmed race times for graded horse racing worldwide.',
  },
  fr: {
    lang: 'fr',
    title: 'Courses de Groupe | Calendrier Hippique International',
    description: 'Calendrier complet des courses de groupe en France, Royaume-Uni, États-Unis, Japon et Hong Kong.',
    ogTitle: 'Courses de Groupe | Calendrier Hippique International',
    ogDescription: 'Calendrier complet des courses de groupe en France, Royaume-Uni, États-Unis, Japon et Hong Kong.',
    ogLocale: 'fr_FR',
    twitterTitle: 'Courses de Groupe | Calendrier Hippique International',
    twitterDescription: 'Calendrier complet des courses de groupe en France, Royaume-Uni, États-Unis, Japon et Hong Kong.',
  },
  zh: {
    lang: 'zh-HK',
    title: '分級賽行事曆 | 香港・日本・歐美賽馬賽程',
    description: '全面收錄香港賽馬會、日本中央及地方、歐美各國一級賽等分級賽賽程與開跑時間。',
    ogTitle: '分級賽行事曆 | 香港・日本・歐美賽馬賽程',
    ogDescription: '全面收錄香港賽馬會、日本中央及地方、歐美各國一級賽等分級賽賽程與開跑時間。',
    ogLocale: 'zh_HK',
    twitterTitle: '分級賽行事曆 | 香港・日本・歐美賽馬賽程',
    twitterDescription: '全面收錄香港賽馬會、日本中央及地方、歐美各國一級賽等分級賽賽程與開跑時間。',
  },
};

function generateLocalizedHtmlPlugin(): Plugin {
  return {
    name: 'generate-localized-html',
    closeBundle() {
      const distDir = path.resolve(import.meta.dirname, 'dist');
      const indexPath = path.join(distDir, 'index.html');
      const notFoundPath = path.join(distDir, '404.html');

      if (!fs.existsSync(indexPath)) return;

      // 404.html for GitHub Pages fallback
      fs.copyFileSync(indexPath, notFoundPath);

      const htmlContent = fs.readFileSync(indexPath, 'utf-8');

      for (const [langKey, meta] of Object.entries(LOCALIZED_METAS) as [keyof typeof LOCALIZED_METAS, LanguageMeta][]) {
        let localizedHtml = htmlContent;

        // 1. html lang
        localizedHtml = localizedHtml.replace(/<html\s+lang="[^"]*"/i, `<html lang="${meta.lang}"`);

        // 2. title
        localizedHtml = localizedHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${meta.title}</title>`);

        // 3. meta description
        localizedHtml = localizedHtml.replace(
          /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="description" content="${meta.description}" />`
        );

        // 4. canonical & og:url
        const canonicalUrl = `https://meshi-z.github.io/horse-racing-calender/${langKey}/`;
        localizedHtml = localizedHtml.replace(
          /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
          `<link rel="canonical" href="${canonicalUrl}" />`
        );
        localizedHtml = localizedHtml.replace(
          /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:url" content="${canonicalUrl}" />`
        );

        // 5. og:title, og:description, og:locale
        localizedHtml = localizedHtml.replace(
          /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:title" content="${meta.ogTitle}" />`
        );
        localizedHtml = localizedHtml.replace(
          /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:description" content="${meta.ogDescription}" />`
        );
        localizedHtml = localizedHtml.replace(
          /<meta\s+property="og:locale"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:locale" content="${meta.ogLocale}" />`
        );

        // 6. twitter:title, twitter:description
        localizedHtml = localizedHtml.replace(
          /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:title" content="${meta.twitterTitle}" />`
        );
        localizedHtml = localizedHtml.replace(
          /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:description" content="${meta.twitterDescription}" />`
        );

        // Output to dist/${langKey}/index.html
        const langDir = path.join(distDir, langKey);
        if (!fs.existsSync(langDir)) {
          fs.mkdirSync(langDir, { recursive: true });
        }
        fs.writeFileSync(path.join(langDir, 'index.html'), localizedHtml, 'utf-8');
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    react(),
    generateLocalizedHtmlPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', 'icons/*.svg', 'robots.txt', 'sitemap.xml'],
      manifest: {
        lang: 'en',
        name: 'Graded Races - Horse Racing Calendar',
        short_name: 'Graded Races',
        description: 'Comprehensive schedule and offline-capable calendar for graded horse races worldwide.',
        short_name_localized: {
          ja: '重賞カレンダー',
          fr: 'Courses de Groupe',
          zh: '分級賽行事曆',
        },
        name_localized: {
          ja: '重賞カレンダー - 中央・地方・海外重賞レーススケジュール',
          fr: 'Courses de Groupe - Calendrier Hippique International',
          zh: '分級賽行事曆 - 香港・日本・歐美賽馬賽程',
        },
        description_localized: {
          ja: 'JRA（中央競馬）、NAR（地方競馬）、および海外主要競馬の重賞レーススケジュールを閲覧・管理するオフライン対応カレンダー',
          fr: 'Calendrier hors-ligne complet des courses de groupe internationales (France, Royaume-Uni, Irlande, etc.).',
          zh: '提供香港、日本、歐洲及美國主要分級賽（重賞）賽程、排位及賽果的離線行事曆。',
        },
        translations: {
          ja: {
            name: '重賞カレンダー - 中央・地方・海外重賞レーススケジュール',
            short_name: '重賞カレンダー',
            description: 'JRA（中央競馬）、NAR（地方競馬）、および海外主要競馬の重賞レーススケジュールを閲覧・管理するオフライン対応カレンダー',
          },
          fr: {
            name: 'Courses de Groupe - Calendrier Hippique International',
            short_name: 'Courses de Groupe',
            description: 'Calendrier hors-ligne complet des courses de groupe internationales (France, Royaume-Uni, Irlande, etc.).',
          },
          zh: {
            name: '分級賽行事曆 - 香港・日本・歐美賽馬賽程',
            short_name: '分級賽行事曆',
            description: '提供香港、日本、歐洲及美國主要分級賽（重賞）賽程、排位及賽果的離線行事曆。',
          },
        },
        theme_color: '#047B5F',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: base,
        start_url: base,
        icons: [
          {
            src: `${base}icons/icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: `${base}icons/icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: `${base}icons/icon-maskable.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: `${base}icons/icon.svg`,
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/data\/(races(-[0-9]{4})?|index)\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'races-data-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              broadcastUpdate: {
                channelName: 'races-data-updates',
                options: {
                  headersToCheck: ['content-length', 'etag', 'last-modified'],
                },
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // @ts-expect-error vitest config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
