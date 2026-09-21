import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  detectUserRegion,
  getDefaultOrganizationsForRegion,
  getInitialOrganizations,
  saveOrganizationsPreference,
  ORGANIZATIONS_STORAGE_KEY,
  LEGACY_ORGANIZATION_STORAGE_KEY,
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

    it('タイムゾーンが America/New_York などの米国タイムゾーンの場合は US を返すこと', () => {
      expect(detectUserRegion({ timeZone: 'America/New_York' })).toBe('US');
      expect(detectUserRegion({ timeZone: 'America/Chicago' })).toBe('US');
      expect(detectUserRegion({ timeZone: 'America/Los_Angeles' })).toBe('US');
      expect(detectUserRegion({ timeZone: 'US/Pacific' })).toBe('US');
    });

    it('タイムゾーンが存在しない場合、言語設定から推定すること', () => {
      expect(detectUserRegion({ timeZone: '', language: 'ja-JP' })).toBe('JP');
      expect(detectUserRegion({ timeZone: '', language: 'fr-FR' })).toBe('FR');
      expect(detectUserRegion({ timeZone: '', language: 'en-GB' })).toBe('GB');
      expect(detectUserRegion({ timeZone: '', language: 'en-US' })).toBe('US');
    });

    it('該当しない地域の場合は OTHER を返すこと', () => {
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

  describe('getDefaultOrganizationsForRegion', () => {
    it('JP の場合は [jra, nar] を返すこと (日本国内重賞)', () => {
      expect(getDefaultOrganizationsForRegion('JP')).toEqual(['jra', 'nar']);
    });

    it('FR の場合は [france_galop] を返すこと', () => {
      expect(getDefaultOrganizationsForRegion('FR')).toEqual(['france_galop']);
    });

    it('GB の場合は [bha] を返すこと', () => {
      expect(getDefaultOrganizationsForRegion('GB')).toEqual(['bha']);
    });

    it('US の場合は [equibase] を返すこと', () => {
      expect(getDefaultOrganizationsForRegion('US')).toEqual(['equibase']);
    });

    it('OTHER の場合は [] (すべて) を返すこと', () => {
      expect(getDefaultOrganizationsForRegion('OTHER')).toEqual([]);
    });
  });

  describe('getInitialOrganizations', () => {
    it('localStorage に新キーの有効な設定が保存されている場合はそれを最優先で返すこと', () => {
      localStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify(['france_galop', 'bha']));
      expect(getInitialOrganizations({ timeZone: 'Asia/Tokyo' })).toEqual(['france_galop', 'bha']);

      localStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify([]));
      expect(getInitialOrganizations({ timeZone: 'Asia/Tokyo' })).toEqual([]);
    });

    it('localStorage に旧キーの設定が存在する場合はマイグレーションして返すこと', () => {
      localStorage.setItem(LEGACY_ORGANIZATION_STORAGE_KEY, 'france_galop');
      expect(getInitialOrganizations({ timeZone: 'Asia/Tokyo' })).toEqual(['france_galop']);

      localStorage.setItem(LEGACY_ORGANIZATION_STORAGE_KEY, 'all');
      expect(getInitialOrganizations({ timeZone: 'Asia/Tokyo' })).toEqual([]);
    });

    it('localStorage に無効な値がある場合は地域判定へフォールバックすること', () => {
      localStorage.setItem(ORGANIZATIONS_STORAGE_KEY, 'invalid_json');
      expect(getInitialOrganizations({ timeZone: 'Asia/Tokyo' })).toEqual(['jra', 'nar']);
      expect(getInitialOrganizations({ timeZone: 'Europe/Paris' })).toEqual(['france_galop']);

      localStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify(['invalid_org']));
      expect(getInitialOrganizations({ timeZone: 'Asia/Tokyo' })).toEqual(['jra', 'nar']);
    });

    it('localStorage に何も保存されていない場合は地域判定に従うこと', () => {
      expect(getInitialOrganizations({ timeZone: 'Asia/Tokyo' })).toEqual(['jra', 'nar']);
      expect(getInitialOrganizations({ timeZone: 'Europe/London' })).toEqual(['bha']);
      expect(getInitialOrganizations({ timeZone: 'Europe/Paris' })).toEqual(['france_galop']);
      expect(getInitialOrganizations({ timeZone: 'America/New_York' })).toEqual(['equibase']);
      expect(getInitialOrganizations({ timeZone: 'Australia/Sydney' })).toEqual([]);
    });
  });

  describe('saveOrganizationsPreference', () => {
    it('選択された主催者配列を localStorage に JSON として保存すること', () => {
      saveOrganizationsPreference(['nar', 'jra']);
      expect(localStorage.getItem(ORGANIZATIONS_STORAGE_KEY)).toBe(JSON.stringify(['nar', 'jra']));

      saveOrganizationsPreference(['france_galop']);
      expect(localStorage.getItem(ORGANIZATIONS_STORAGE_KEY)).toBe(JSON.stringify(['france_galop']));

      saveOrganizationsPreference([]);
      expect(localStorage.getItem(ORGANIZATIONS_STORAGE_KEY)).toBe(JSON.stringify([]));
    });
  });
});
