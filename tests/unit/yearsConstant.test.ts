import { describe, it, expect, vi } from 'vitest';
import {
  AVAILABLE_YEARS,
  DEFAULT_YEAR,
  isAvailableYear,
  resolveInitialYear,
  syncYearToUrl,
  getYearDataUrl,
} from '@/constants/years';

describe('years constants & resolution', () => {
  it('AVAILABLE_YEARS と DEFAULT_YEAR が正しく定義されていること', () => {
    expect(AVAILABLE_YEARS).toEqual([2026, 2027]);
    expect(DEFAULT_YEAR).toBe(2026);
  });

  it('isAvailableYear で年度判定ができること', () => {
    expect(isAvailableYear(2026)).toBe(true);
    expect(isAvailableYear(2027)).toBe(true);
    expect(isAvailableYear(2025)).toBe(false);
    expect(isAvailableYear(2028)).toBe(false);
  });

  describe('resolveInitialYear', () => {
    it('URLクエリパラメータに利用可能年度が含まれる場合はそれを最優先すること', () => {
      expect(resolveInitialYear('?year=2027', new Date('2026-05-01'))).toBe(2027);
      expect(resolveInitialYear('?year=2026', new Date('2027-01-01'))).toBe(2026);
    });

    it('URLクエリパラメータが無効・範囲外の場合はシステム日時を照合すること', () => {
      // クエリパラメータが無効な年 (2025) -> システム年 2027 を採用
      expect(resolveInitialYear('?year=2025', new Date('2027-05-01'))).toBe(2027);
      // クエリパラメータなし -> システム年 2026 を採用
      expect(resolveInitialYear('', new Date('2026-05-01'))).toBe(2026);
    });

    it('クエリパラメータがなくシステム日時も範囲外の場合は DEFAULT_YEAR (2026) を返すこと', () => {
      expect(resolveInitialYear('', new Date('2025-12-31'))).toBe(2026);
      expect(resolveInitialYear('', new Date('2029-01-01'))).toBe(2026);
    });
  });

  describe('syncYearToUrl', () => {
    it('URLのクエリパラメータを ?year=YYYY に同期・更新すること', () => {
      const replaceSpy = vi.spyOn(window.history, 'replaceState');
      syncYearToUrl(2027);
      expect(replaceSpy).toHaveBeenCalled();
      const calledUrl = replaceSpy.mock.calls[0][2];
      expect(calledUrl).toContain('year=2027');
      replaceSpy.mockRestore();
    });
  });

  describe('getYearDataUrl', () => {
    it('年度別 JSON パスを生成できること', () => {
      const url = getYearDataUrl(2027);
      expect(url).toContain('data/races-2027.json');
    });
  });
});
