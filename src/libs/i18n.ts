import { useLanguageStore, type Language } from '../store/useLanguageStore';

/**
 * アプリケーション共通のUI翻訳辞書定義
 */
export const translations = {
  ja: {
    app: {
      title: '重賞カレンダー',
      subtitle: 'JRA Graded Races Calendar',
    },
    nav: {
      timeline: 'タイムライン',
      calendar: 'カレンダー',
      switchLanguageToEn: '英語に切り替え',
      switchLanguageToJa: '日本語に切り替え',
      switchToDark: 'ダークモードに切り替え',
      switchToLight: 'ライトモードに切り替え',
    },
    status: {
      scheduled: '発走予定',
      today: '今日',
      rescheduled: '代替開催',
    },
    action: {
      close: '閉じる',
      reset: 'リセット',
      jumpToToday: '今日へ戻る',
    },
    timeline: {
      ariaLabel: '重賞レース タイムライン',
      todayBadge: '本日開催',
      rescheduledBadge: '代替開催',
      racesCount: '{count}レース',
      noRacesTitle: '該当するレースがありません',
      noRacesDesc: '検索キーワードやフィルター条件を変更するか、条件のリセットをお試しください。',
      resetFilters: 'フィルターをリセット',
      jumpToToday: '今日へ戻る',
      jumpToUpcoming: '直近のレースへ',
      jumpToTodayAria: '今日開催のレースへジャンプ',
      jumpToUpcomingAria: '直近のレースへジャンプ',
    },
    card: {
      postponedFrom: '当初予定: {date} から順延',
    },
    dialog: {
      course: '開催場',
      trackAndDistance: '馬場・距離',
      eligibilityAndWeight: '出走条件・負担重量',
      weightPrefix: '斤量: ',
      rescheduledTitle: '悪天候等による代替開催（日程変更）',
      rescheduledNoticeWithDate: '当初開催予定日：{date} より変更されました。',
      rescheduledNotice: '当初の予定日程から変更されました。',
    },
    calendar: {
      prevMonth: '前月へ',
      nextMonth: '翌月へ',
      today: '今月',
      todayAria: '今月へジャンプ',
      monthRaces: '{count} レース',
      rescheduledShort: '代替',
      daysCount: '{count}件',
    },
  },
  en: {
    app: {
      title: 'Graded Races',
      subtitle: 'JRA Graded Races Calendar',
    },
    nav: {
      timeline: 'Timeline',
      calendar: 'Calendar',
      switchLanguageToEn: 'Switch to English',
      switchLanguageToJa: 'Switch to Japanese',
      switchToDark: 'Switch to dark mode',
      switchToLight: 'Switch to light mode',
    },
    status: {
      scheduled: 'Scheduled',
      today: 'Today',
      rescheduled: 'Rescheduled',
    },
    action: {
      close: 'Close',
      reset: 'Reset',
      jumpToToday: 'Jump to Today',
    },
    timeline: {
      ariaLabel: 'Graded Races Timeline',
      todayBadge: 'Today',
      rescheduledBadge: 'Rescheduled',
      racesCount: '{count} Races',
      noRacesTitle: 'No races found',
      noRacesDesc: 'Try changing keywords/filter criteria or reset filters.',
      resetFilters: 'Reset Filters',
      jumpToToday: 'Jump to Today',
      jumpToUpcoming: 'To Upcoming',
      jumpToTodayAria: "Jump to today's races",
      jumpToUpcomingAria: 'Jump to upcoming races',
    },
    card: {
      postponedFrom: 'Postponed from {date}',
    },
    dialog: {
      course: 'Course',
      trackAndDistance: 'Track & Distance',
      eligibilityAndWeight: 'Eligibility & Weight',
      weightPrefix: 'Weight: ',
      rescheduledTitle: 'Rescheduled Race (Date Postponed)',
      rescheduledNoticeWithDate: 'Postponed from original scheduled date: {date}.',
      rescheduledNotice: 'Schedule was changed from the original date.',
    },
    calendar: {
      prevMonth: 'Previous month',
      nextMonth: 'Next month',
      today: 'Today',
      todayAria: 'Jump to current month',
      monthRaces: '{count} Races',
      rescheduledShort: 'Resched',
      daysCount: '{count} races',
    },
  },
} as const;

export const trackTypeLabels: Record<Language, Record<'turf' | 'dirt' | 'obstacle', string>> = {
  ja: {
    turf: '芝',
    dirt: 'ダート',
    obstacle: '障害',
  },
  en: {
    turf: 'Turf',
    dirt: 'Dirt',
    obstacle: 'Jump',
  },
};

export const sexConstraintLabels: Record<
  Language,
  Record<'filly_and_mare' | 'colt_and_filly' | 'none', { short: string | null; full: string }>
> = {
  ja: {
    filly_and_mare: { short: '牝', full: '牝馬限定' },
    colt_and_filly: { short: '牡・牝', full: '牡・牝' },
    none: { short: null, full: '性別不問（制限なし）' },
  },
  en: {
    filly_and_mare: { short: 'Fillies', full: 'Fillies & Mares' },
    colt_and_filly: { short: 'Colts & Fillies', full: 'Colts & Fillies' },
    none: { short: null, full: 'Open to All' },
  },
};

export const ageConstraintLabels: Record<
  Language,
  Record<'2yo' | '3yo' | '3yo_and_up' | '4yo_and_up', { short: string; full: string }>
> = {
  ja: {
    '2yo': { short: '2歳', full: '2歳' },
    '3yo': { short: '3歳', full: '3歳' },
    '3yo_and_up': { short: '3歳上', full: '3歳以上' },
    '4yo_and_up': { short: '4歳上', full: '4歳以上' },
  },
  en: {
    '2yo': { short: '2yo', full: '2yo' },
    '3yo': { short: '3yo', full: '3yo' },
    '3yo_and_up': { short: '3yo+', full: '3yo & Up' },
    '4yo_and_up': { short: '4yo+', full: '4yo & Up' },
  },
};

export const CALENDAR_WEEKDAYS_BY_LANG: Record<Language, readonly string[]> = {
  ja: ['月', '火', '水', '木', '金', '土', '日'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

export type TranslationDictionary = typeof translations.ja;

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationDictionary>;

/**
 * ドット区切りのキー（例: 'nav.timeline'）から翻訳文字列を取得する（パラメータ置換対応）
 */
export function t(
  key: TranslationKey,
  lang: Language,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = translations[lang] || translations.en;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // フォールバック: 英語辞書から検索
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fallback: any = translations.en;
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk];
        } else {
          return key;
        }
      }
      current = fallback;
      break;
    }
  }

  let text = typeof current === 'string' ? current : key;

  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    }
  }

  return text;
}

/**
 * コンポーネント用の多言語翻訳フック
 */
export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const toggleLanguage = useLanguageStore((state) => state.toggleLanguage);

  return {
    language,
    setLanguage,
    toggleLanguage,
    t: (key: TranslationKey, params?: Record<string, string | number>) =>
      t(key, language, params),
  };
}
