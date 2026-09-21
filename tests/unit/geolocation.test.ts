import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  detectUserRegion,
  getDefaultOrganizationForRegion,
  getInitialOrganization,
  saveOrganizationPreference,
  ORGANIZATION_STORAGE_KEY,
} from '../../src/libs/geolocation';

describe('geolocation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('detectUserRegion', () => {
    it('タイムゾーンが Asia/Tokyo または Japan の場合は JP を返すこと', () => {
      expect(detectUserRegion({ timeZone: 'Asia/Tokyo' })).toBe('JP');
      expect(detectUserRegion({ timeZone: 'Japan' })).toBe('JP');
    });

    it('タイムゾーンが Europe/Paris やフランス海外領土の場合は FR を返すこと', () => {
      expect(detectUserRegion({ timeZone: 'Europe/Paris' })).toBe('FR');
      expect(detectUserRegion({ timeZone: 'Indian/Reunion' })).toBe('FR');
      expect(detectUserRegion({ timeZone: 'Pacific/Tahiti' })).toBe('FR');
    });

    it('タイムゾーンが Europe/* かつ 言語がフランス語の場合は FR を返すこと', () => {
      expect(detectUserRegion({ timeZone: 'Europe/Brussels', language: 'fr-BE' })).toBe('FR');
    });

    it('タイムゾーンが Europe/London または GB の場合は GB を返すこと', () => {
      expect(detectUserRegion({ timeZone: 'Europe/London' })).toBe('GB');
      expect(detectUserRegion({ timeZone: 'GB' })).toBe('GB');
      expect(detectUserRegion({ timeZone: 'GB-Eire' })).toBe('GB');
    });

    it('タイムゾーンが Europe/* かつ 言語が en-GB の場合は GB を返すこと', () => {
      expect(detectUserRegion({ timeZone: 'Europe/Dublin', language: 'en-GB' })).toBe('GB');
    });

    it('タイムゾーンが存在しない場合、言語設定から推定すること', () => {
      expect(detectUserRegion({ timeZone: '', language: 'ja-JP' })).toBe('JP');
      expect(detectUserRegion({ timeZone: '', language: 'fr-FR' })).toBe('FR');
      expect(detectUserRegion({ timeZone: '', language: 'en-GB' })).toBe('GB');
      expect(detectUserRegion({ timeZone: '', language: 'en-US' })).toBe('OTHER');
    });

    it('該当しない地域の場合は OTHER を返すこと', () => {
      expect(detectUserRegion({ timeZone: 'America/New_York', language: 'en-US' })).toBe('OTHER');
      expect(detectUserRegion({ timeZone: 'Australia/Sydney', language: 'en-AU' })).toBe('OTHER');
      expect(detectUserRegion({ timeZone: 'Asia/Seoul', language: 'ko-KR' })).toBe('OTHER');
    });

    it('エラーが発生した場合は OTHER にフォールバックすること', () => {
      const faultyContext = {
        get timeZone(): string {
          throw new Error('timezone access error');
        },
      };
      expect(detectUserRegion(faultyContext)).toBe('OTHER');
    });
  });

  describe('getDefaultOrganizationForRegion', () => {
    it('JP の場合は jra を返すこと', () => {
      expect(getDefaultOrganizationForRegion('JP')).toBe('jra');
    });

    it('FR の場合は france_galop を返すこと', () => {
      expect(getDefaultOrganizationForRegion('FR')).toBe('france_galop');
    });

    it('GB の場合は bha を返すこと', () => {
      expect(getDefaultOrganizationForRegion('GB')).toBe('bha');
    });

    it('OTHER の場合は all を返すこと', () => {
      expect(getDefaultOrganizationForRegion('OTHER')).toBe('all');
    });
  });

  describe('getInitialOrganization', () => {
    it('localStorage に有効な設定が保存されている場合はそれを最優先で返すこと', () => {
      localStorage.setItem(ORGANIZATION_STORAGE_KEY, 'france_galop');
      expect(getInitialOrganization({ timeZone: 'Asia/Tokyo' })).toBe('france_galop');

      localStorage.setItem(ORGANIZATION_STORAGE_KEY, 'bha');
      expect(getInitialOrganization({ timeZone: 'Asia/Tokyo' })).toBe('bha');

      localStorage.setItem(ORGANIZATION_STORAGE_KEY, 'all');
      expect(getInitialOrganization({ timeZone: 'Asia/Tokyo' })).toBe('all');
    });

    it('localStorage に無効な値がある場合は地域判定へフォールバックすること', () => {
      localStorage.setItem(ORGANIZATION_STORAGE_KEY, 'invalid_org');
      expect(getInitialOrganization({ timeZone: 'Asia/Tokyo' })).toBe('jra');
      expect(getInitialOrganization({ timeZone: 'Europe/Paris' })).toBe('france_galop');
    });

    it('localStorage に何も保存されていない場合は地域判定に従うこと', () => {
      expect(getInitialOrganization({ timeZone: 'Asia/Tokyo' })).toBe('jra');
      expect(getInitialOrganization({ timeZone: 'Europe/London' })).toBe('bha');
      expect(getInitialOrganization({ timeZone: 'Europe/Paris' })).toBe('france_galop');
      expect(getInitialOrganization({ timeZone: 'America/New_York' })).toBe('all');
    });
  });

  describe('saveOrganizationPreference', () => {
    it('選択された主催者を localStorage に保存すること', () => {
      saveOrganizationPreference('nar');
      expect(localStorage.getItem(ORGANIZATION_STORAGE_KEY)).toBe('nar');

      saveOrganizationPreference('france_galop');
      expect(localStorage.getItem(ORGANIZATION_STORAGE_KEY)).toBe('france_galop');
    });
  });
});
