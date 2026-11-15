import fs from 'fs';
import path from 'path';

export type SupportedRedirectLang = 'ja' | 'en' | 'fr' | 'zh';

export const TARGET_ORIGIN = 'https://horse-racing-calendar.web.app';
export const LEGACY_REPO_PREFIX = '/horse-racing-calender';

export interface RedirectLocaleMeta {
  langKey: SupportedRedirectLang;
  htmlLang: string;
  ogLocale: string;
  title: string;
  description: string;
  heading: string;
  message: string;
  buttonLabel: string;
}

export const REDIRECT_LOCALES: Record<SupportedRedirectLang, RedirectLocaleMeta> = {
  ja: {
    langKey: 'ja',
    htmlLang: 'ja',
    ogLocale: 'ja_JP',
    title: 'サイト移転のお知らせ | 重賞カレンダー',
    description: '重賞カレンダーは新しいURL（https://horse-racing-calendar.web.app/ja/）へ移転しました。',
    heading: '重賞カレンダーは新しいURLへ移転しました',
    message: '自動的に新しいサイトへ移動します。移動しない場合は以下のボタンをクリックしてください。',
    buttonLabel: '新しいサイトへ移動する',
  },
  en: {
    langKey: 'en',
    htmlLang: 'en',
    ogLocale: 'en_US',
    title: 'Site Moved | Graded Races Calendar',
    description: 'Graded Races Calendar has moved to https://horse-racing-calendar.web.app/en/.',
    heading: 'Graded Races Calendar has moved to a new URL',
    message: 'You are being redirected automatically. If you are not redirected, please click the button below.',
    buttonLabel: 'Go to the new site',
  },
  fr: {
    langKey: 'fr',
    htmlLang: 'fr',
    ogLocale: 'fr_FR',
    title: 'Changement d’adresse | Courses de Groupe',
    description: 'Le Calendrier des Courses de Groupe a déménagé vers https://horse-racing-calendar.web.app/fr/.',
    heading: 'Le Calendrier des Courses de Groupe a déménagé',
    message: 'Vous allez être redirigé automatiquement. Si la redirection ne fonctionne pas, veuillez cliquer sur le bouton ci-dessous.',
    buttonLabel: 'Accéder au nouveau site',
  },
  zh: {
    langKey: 'zh',
    htmlLang: 'zh-HK',
    ogLocale: 'zh_HK',
    title: '網站搬遷通知 | 分級賽行事曆',
    description: '分級賽行事曆已搬遷至新網址（https://horse-racing-calendar.web.app/zh/）。',
    heading: '分級賽行事曆已搬遷至新網址',
    message: '系統正在自動為您跳轉至新網站。若未自動跳轉，請點擊下方按鈕。',
    buttonLabel: '前往新網站',
  },
};

/**
 * 旧 GitHub Pages の pathname / search / hash から、移転先 Firebase Hosting の完全URLを算出する
 */
export function resolveRedirectTargetUrl(
  pathname: string,
  search = '',
  hash = '',
  targetOrigin = TARGET_ORIGIN,
  legacyPrefix = LEGACY_REPO_PREFIX
): string {
  let cleanPath = pathname || '/';
  if (cleanPath === legacyPrefix || cleanPath.startsWith(`${legacyPrefix}/`)) {
    cleanPath = cleanPath.slice(legacyPrefix.length);
  }
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }
  const normalizedSearch = search ? (search.startsWith('?') ? search : `?${search}`) : '';
  const normalizedHash = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
  return `${targetOrigin}${cleanPath}${normalizedSearch}${normalizedHash}`;
}

/**
 * 転送用 HTML を生成する（ルート用または言語別パス用）
 */
export function buildRedirectHtml(locale?: SupportedRedirectLang): string {
  const activeMeta = locale ? REDIRECT_LOCALES[locale] : REDIRECT_LOCALES.en;
  const targetUrl = locale ? `${TARGET_ORIGIN}/${locale}/` : `${TARGET_ORIGIN}/`;
  const localesClientJson = JSON.stringify(
    Object.fromEntries(
      Object.entries(REDIRECT_LOCALES).map(([k, v]) => [
        k,
        {
          title: v.title,
          heading: v.heading,
          message: v.message,
          buttonLabel: v.buttonLabel,
        },
      ])
    )
  );

  return `<!DOCTYPE html>
<html lang="${activeMeta.htmlLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, follow" />
    <meta name="theme-color" content="#047B5F" />
    <title>${activeMeta.title}</title>
    <meta name="description" content="${activeMeta.description}" />
    <link rel="canonical" href="${targetUrl}" />
    <meta http-equiv="refresh" content="0; url=${targetUrl}" />

    <!-- OGP -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${targetUrl}" />
    <meta property="og:title" content="${activeMeta.title}" />
    <meta property="og:description" content="${activeMeta.description}" />
    <meta property="og:image" content="${TARGET_ORIGIN}/icons/icon-512.png" />
    <meta property="og:locale" content="${activeMeta.ogLocale}" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${activeMeta.title}" />
    <meta name="twitter:description" content="${activeMeta.description}" />
    <meta name="twitter:image" content="${TARGET_ORIGIN}/icons/icon-512.png" />

    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background-color: #f8fafc;
        color: #0f172a;
        padding: 1.5rem;
        box-sizing: border-box;
      }
      @media (prefers-color-scheme: dark) {
        body {
          background-color: #090d16;
          color: #f8fafc;
        }
        .card {
          background-color: #111827 !important;
          border-color: #1f2937 !important;
        }
        .msg {
          color: #94a3b8 !important;
        }
      }
      .card {
        max-width: 28rem;
        width: 100%;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        padding: 2rem;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
      h1 {
        font-size: 1.25rem;
        margin: 0 0 0.75rem 0;
        line-height: 1.4;
      }
      .msg {
        font-size: 0.9375rem;
        color: #475569;
        margin: 0 0 1.5rem 0;
        line-height: 1.6;
      }
      .btn {
        display: inline-block;
        background-color: #047B5F;
        color: #ffffff;
        font-weight: 600;
        text-decoration: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-size: 0.9375rem;
      }
      .btn:hover {
        background-color: #03634c;
      }
    </style>

    <script>
      (function () {
        var TARGET_ORIGIN = ${JSON.stringify(TARGET_ORIGIN)};
        var LEGACY_PREFIX = ${JSON.stringify(LEGACY_REPO_PREFIX)};
        var FIXED_LOCALE = ${JSON.stringify(locale ?? null)};
        var LOCALES = ${localesClientJson};

        function computeTargetUrl() {
          var path = window.location.pathname || '/';
          if (path === LEGACY_PREFIX || path.indexOf(LEGACY_PREFIX + '/') === 0) {
            path = path.slice(LEGACY_PREFIX.length);
          }
          if (!path || path.charAt(0) !== '/') {
            path = '/' + (path || '');
          }
          var search = window.location.search || '';
          var hash = window.location.hash || '';
          return TARGET_ORIGIN + path + search + hash;
        }

        function detectLocale() {
          if (FIXED_LOCALE && LOCALES[FIXED_LOCALE]) return FIXED_LOCALE;
          var path = window.location.pathname || '';
          if (path.indexOf('/ja/') !== -1 || path.slice(-3) === '/ja') return 'ja';
          if (path.indexOf('/fr/') !== -1 || path.slice(-3) === '/fr') return 'fr';
          if (path.indexOf('/zh/') !== -1 || path.slice(-3) === '/zh') return 'zh';
          if (path.indexOf('/en/') !== -1 || path.slice(-3) === '/en') return 'en';
          try {
            var stored = localStorage.getItem('language');
            if (stored && LOCALES[stored]) return stored;
          } catch (e) {}
          var nav = (navigator.language || '').toLowerCase();
          if (nav.indexOf('ja') === 0) return 'ja';
          if (nav.indexOf('fr') === 0) return 'fr';
          if (nav.indexOf('zh') === 0) return 'zh';
          return 'en';
        }

        var destination = computeTargetUrl();
        var activeLocale = detectLocale();

        window.addEventListener('DOMContentLoaded', function () {
          var copy = LOCALES[activeLocale] || LOCALES.en;
          document.title = copy.title;
          var h1 = document.getElementById('redirect-heading');
          var p = document.getElementById('redirect-message');
          var a = document.getElementById('redirect-link');
          if (h1) h1.textContent = copy.heading;
          if (p) p.textContent = copy.message;
          if (a) {
            a.textContent = copy.buttonLabel;
            a.setAttribute('href', destination);
          }
        });

        var redirected = false;
        function performRedirect() {
          if (redirected) return;
          redirected = true;
          window.location.replace(destination);
        }

        // Fallback timer ensures redirect happens even if SW cleanup takes >150ms
        setTimeout(performRedirect, 150);

        try {
          var tasks = [];
          if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
            tasks.push(
              navigator.serviceWorker.getRegistrations().then(function (regs) {
                return Promise.all(regs.map(function (r) { return r.unregister(); }));
              })
            );
          }
          if ('caches' in window && caches.keys) {
            tasks.push(
              caches.keys().then(function (keys) {
                return Promise.all(keys.map(function (k) { return caches.delete(k); }));
              })
            );
          }
          Promise.all(tasks).then(performRedirect, performRedirect);
        } catch (e) {
          performRedirect();
        }
      })();
    </script>
  </head>
  <body>
    <main class="card">
      <h1 id="redirect-heading">${activeMeta.heading}</h1>
      <p id="redirect-message" class="msg">${activeMeta.message}</p>
      <a id="redirect-link" class="btn" href="${targetUrl}">${activeMeta.buttonLabel}</a>
    </main>
  </body>
</html>
`;
}

/**
 * 旧 GitHub Pages に残存している Service Worker を自己解除し、新ドメインへ遷移させる sw.js を生成する
 */
export function buildSelfUnregisteringSw(): string {
  return `// Self-unregistering Service Worker for legacy GitHub Pages -> Firebase Hosting migration
const TARGET_ORIGIN = '${TARGET_ORIGIN}';
const LEGACY_PREFIX = '${LEGACY_REPO_PREFIX}';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch (e) {}

      try {
        await self.registration.unregister();
      } catch (e) {}

      try {
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clientsList) {
          if (client.url && 'navigate' in client) {
            const parsed = new URL(client.url);
            let path = parsed.pathname || '/';
            if (path === LEGACY_PREFIX || path.startsWith(LEGACY_PREFIX + '/')) {
              path = path.slice(LEGACY_PREFIX.length);
            }
            if (!path.startsWith('/')) {
              path = '/' + path;
            }
            await client.navigate(TARGET_ORIGIN + path + parsed.search + parsed.hash);
          }
        }
      } catch (e) {}
    })()
  );
});
`;
}

/**
 * 指定ディレクトリに GitHub Pages 転送用静的ファイル一式を出力する
 */
export function generatePagesRedirectBundle(outDir: string): void {
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Root index.html & 404.html
  const rootHtml = buildRedirectHtml();
  fs.writeFileSync(path.join(outDir, 'index.html'), rootHtml, 'utf-8');
  fs.writeFileSync(path.join(outDir, '404.html'), rootHtml, 'utf-8');

  // 2. 4 languages: ja, en, fr, zh
  for (const langKey of Object.keys(REDIRECT_LOCALES) as SupportedRedirectLang[]) {
    const langDir = path.join(outDir, langKey);
    fs.mkdirSync(langDir, { recursive: true });
    const localizedHtml = buildRedirectHtml(langKey);
    fs.writeFileSync(path.join(langDir, 'index.html'), localizedHtml, 'utf-8');
  }

  // 3. Self-unregistering sw.js
  fs.writeFileSync(path.join(outDir, 'sw.js'), buildSelfUnregisteringSw(), 'utf-8');

  // 4. robots.txt & .nojekyll
  const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${TARGET_ORIGIN}/sitemap.xml\n`;
  fs.writeFileSync(path.join(outDir, 'robots.txt'), robotsTxt, 'utf-8');
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '', 'utf-8');
}
