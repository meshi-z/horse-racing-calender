/**
 * Google Analytics (gtag.js) client-side integration
 * Measurement ID: G-BWG7RYDEB9
 */

export const GA_MEASUREMENT_ID = 'G-BWG7RYDEB9';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Initialize Google Analytics 4 (gtag.js).
 * Only loads in production environments (import.meta.env.PROD) and in browser contexts.
 * Gracefully handles offline or blocked network conditions.
 */
export function initAnalytics(measurementId = GA_MEASUREMENT_ID): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Prevent loading in development or testing environments
  if (!import.meta.env.PROD) {
    return;
  }

  // Prevent duplicate script injection
  const scriptId = 'google-analytics-gtag';
  if (document.getElementById(scriptId)) {
    return;
  }

  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.onerror = (err) => {
      // Gracefully catch network failure (e.g. offline, adblocker)
      console.warn('[Analytics] Failed to load Google Analytics script:', err);
    };

    document.head.appendChild(script);
  } catch (error) {
    // Non-blocking fallback
    console.warn('[Analytics] Error initializing Google Analytics:', error);
  }
}

/**
 * Send custom tracking event to Google Analytics
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, unknown>
): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, eventParams);
    } catch {
      // ignore
    }
  }
}
