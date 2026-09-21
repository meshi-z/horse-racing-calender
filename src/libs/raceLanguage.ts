import type { Race, LocalizedText } from '../types/race';
import type { Language } from '../store/useLanguageStore';

/**
 * レースの開催国の原語（公用語）コードを判定する
 */
export function getRaceOriginLanguage(race: Race): Language {
  if (race.country_code === 'FR' || race.organization === 'france_galop') {
    return 'fr';
  }
  if (race.country_code === 'JP' || race.organization === 'jra' || race.organization === 'nar') {
    return 'ja';
  }
  if (race.country_code === 'GB' || (race.organization as string) === 'bha' || race.country_code === 'US' || (race.organization as string) === 'equibase') {
    return 'en';
  }
  return 'ja';
}

/**
 * LocalizedText から指定された言語の値を取得する（未定義時は en -> ja の順でフォールバック）
 */
export function getLocalizedText(text: LocalizedText, lang: Language): string {
  if (text[lang]) {
    return text[lang]!;
  }
  if (text.en) {
    return text.en;
  }
  return text.ja || '';
}

export interface RaceDisplayNames {
  primary: string;
  secondary?: string;
}

/**
 * レースの表示名称（メインおよびサブ）を算出する
 *
 * ルール:
 * 1. メイン: 選択言語（currentLang）の名称。未定義時は en -> ja にフォールバック。
 * 2. サブ: 開催国の原語（originLang）の名称。
 *    - ただし currentLang === originLang の場合、英語（en）をサブとする（原語が英語ならサブ非表示）。
 * 3. 一致時非表示: secondaryCandidate === primary の場合はサブを表示しない（secondary = undefined）。
 */
export function getRaceDisplayNames(race: Race, currentLang: Language): RaceDisplayNames {
  const originLang = getRaceOriginLanguage(race);
  const primary = getLocalizedText(race.name, currentLang);

  let secondaryCandidate: string | undefined;

  if (currentLang === originLang) {
    // 選択言語と原語が同一の場合
    if (originLang === 'en') {
      // 英語圏レース × 英語UIはサブ非表示
      secondaryCandidate = undefined;
    } else {
      // 日本語・フランス語等の場合は英語（en）をサブとする
      secondaryCandidate = race.name.en || race.name.ja;
    }
  } else {
    // 選択言語と原語が異なる場合: 開催国の原語をサブとする
    secondaryCandidate = getLocalizedText(race.name, originLang);
  }

  // 重複チェック: サブが未定義、またはメインとサブが一致する場合はサブを非表示
  if (
    !secondaryCandidate ||
    secondaryCandidate.trim().toLowerCase() === primary.trim().toLowerCase()
  ) {
    return { primary };
  }

  return { primary, secondary: secondaryCandidate };
}
