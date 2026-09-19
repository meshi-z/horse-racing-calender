import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme, THEME_STORAGE_KEY } from '@/hooks/useTheme';

describe('useTheme', () => {
  let listeners: Array<() => void> = [];
  let matchesDark = false;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    listeners = [];
    matchesDark = false;

    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: matchesDark,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'change') {
          listeners.push(cb);
        }
      }),
      removeEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'change') {
          listeners = listeners.filter((l) => l !== cb);
        }
      }),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態（localStorageなし、OSがlight）の場合、system/lightになりdarkクラスは付与されない', () => {
    matchesDark = false;
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('初期状態（localStorageなし、OSがdark）の場合、system/darkになりdarkクラスが付与される', () => {
    matchesDark = true;
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('localStorageにdarkが保存されている場合、darkモードとして初期化される', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggleThemeを呼ぶとlightとdarkが交互に切り替わり、localStorageに保存される', () => {
    matchesDark = false;
    const { result } = renderHook(() => useTheme());

    expect(result.current.resolvedTheme).toBe('light');

    // 1回目のtoggle -> dark
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    // 2回目のtoggle -> light
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('setThemeでテーマを明示的に変更できる', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });
    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    act(() => {
      result.current.setTheme('light');
    });
    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('themeがsystemのとき、OSのテーマ変更イベントに追従する', () => {
    matchesDark = false;
    const { result } = renderHook(() => useTheme());

    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // OS側がダークモードに変更
    matchesDark = true;
    act(() => {
      listeners.forEach((listener) => listener());
    });

    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
