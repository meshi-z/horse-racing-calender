import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// モック: virtual:pwa-register/react
vi.mock('virtual:pwa-register/react', () => {
  return {
    useRegisterSW: () => ({
      offlineReady: [false, vi.fn()],
      needRefresh: [false, vi.fn()],
      updateServiceWorker: vi.fn(),
    }),
  };
});
