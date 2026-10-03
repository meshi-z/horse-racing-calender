import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';

const rawBase = process.env.BASE_URL || '/';
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

function copyIndexTo404Plugin(): Plugin {
  return {
    name: 'copy-index-to-404',
    closeBundle() {
      const distDir = path.resolve(import.meta.dirname, 'dist');
      const indexPath = path.join(distDir, 'index.html');
      const notFoundPath = path.join(distDir, '404.html');
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath);
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    react(),
    copyIndexTo404Plugin(),
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
            urlPattern: /\/data\/races\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'races-data-cache',
              expiration: {
                maxEntries: 10,
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
