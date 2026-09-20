import { useLanguageStore, type Language } from '../store/useLanguageStore';

/**
 * アプリケーション共通のUI翻訳辞書定義
 */
export const translations = {
  ja: {
    app: {
      title: '重賞カレンダー',
      subtitle: 'Graded Races Calendar',
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
      timeTbd: '時刻未定',
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
    filter: {
      searchPlaceholder: 'レース名で検索（例: 有馬記念、東京大賞典、February、Tokyo Derby）',
      searchAria: 'レース名検索',
      clearSearchAria: '検索キーワードをクリア',
      resetFilterAria: 'フィルターをリセット',
      reset: 'リセット',
      orgLabel: '主催者:',
      orgAll: 'すべて',
      orgJra: 'JRA (中央)',
      orgNar: '地方競馬 (NAR)',
      gradeLabel: 'グレード:',
      gradeGroupJra: 'JRA重賞',
      gradeGroupDart: 'ダートグレード',
      gradeGroupNankanto: '南関東重賞',
      gradeGroupRegional: '地方重賞',
      selectAll: '一括選択',
      clearGroup: '解除',
      trackLabel: '馬場:',
      distanceLabel: '距離:',
      courseLabel: '競馬場',
      courseExpandAria: '競馬場フィルターを展開',
      selectCourses: '競馬場を選択（複数選択可）:',
      clearCourses: '競馬場選択をクリア',
      selectedCourses: '選択中の競馬場:',
      clear: 'クリア',
      removeCourseAria: '{course}の絞り込みを解除',
      distanceFilterAria: '距離フィルター: {label}（{description}）',
      appDocTitle: '重賞カレンダー - JRA & NAR 重賞レーススケジュール',
      matchedRaces: '該当レース: {count} 件',
      viewModeLabel: '表示: {mode}',
      viewModeTimeline: 'タイムライン',
      viewModeCalendar: '月間カレンダー',
      expandFilters: 'フィルターを展開',
      collapseFilters: 'フィルターを折りたたむ',
      toggleFiltersAria: '詳細フィルターの表示・非表示を切り替え',
      activeFiltersCount: '{count}件適用中',
      loadingRaces: 'レース日程を読み込み中',
      loadError: 'レースデータの取得に失敗しました: ',
    },
    disclaimer: {
      trigger: '免責事項・データ出典',
      title: '免責事項・データ出典',
      description: '本アプリの利用に関する規約、データの取り扱い、および免責規定です。',
      fanSiteTitle: '非公式ファンサイトについて',
      fanSiteBody: '本サービス（重賞カレンダー）は、個人が開発・運営する非公式のファンサイトです。日本中央競馬会（JRA）、地方競馬全国協会（NAR）、各地方競馬主催者（道営、岩手、南関東4場、金沢、愛知、笠松、兵庫、高知、佐賀、ばんえい帯広）およびその他の関連団体とは一切関係ありません。',
      dataSourceTitle: 'データの出典',
      dataSourceBody: '本アプリで掲載しているレース日程、発走予定時刻、出走条件（コース・距離・出走資格・斤量等）のデータは、JRA（日本中央競馬会）公式サイトおよびNAR（地方競馬全国協会）公式サイト等で一般公開されている公式情報（カレンダーファイル、重賞一覧、確定出馬表等）を取得・加工して提供しています。',
      changesTitle: '開催変更・公式発表確認の推奨と免責事項',
      changesP1: 'レースの日程、発走時刻、出走馬、斤量等の情報は、天候悪化・自然災害や主催者の都合等により、予告なく変更・中止・延期（代替開催・続行競馬等）となる場合があります。',
      changesP2: '情報の正確性・網羅性には細心の注意を払っておりますが、リアルタイム性や完全性を保証するものではありません。馬券の購入、現地観戦、遠征等の際は、必ず主催者（JRA・NAR等）公式発表の最新情報をご確認ください。',
      changesP2Strong: '馬券の購入、現地観戦、遠征等の際は、必ず主催者（JRA・NAR等）公式発表の最新情報をご確認ください。',
      changesP3: '本サービスの利用、または利用できなかったことにより生じたあらゆる直接的・間接的な損害・トラブル（馬券投票結果、交通・宿泊費用等を含むがこれらに限定されません）について、本サービスの開発者および運営者は一切の責任を負いません。',
      rightsTitle: '権利・商標の帰属',
      rightsBody: '本サービスに記載されているレース名、競馬場名、主催団体名等の名称、商標およびロゴ等の知的財産権は、各主催者（JRA、NAR、各地方競馬主催者等）ならびに各権利者に帰属します。',
      analyticsTitle: 'アクセス解析ツール（Google Analytics）について',
      analyticsP1: '本サービスでは、利用状況の把握や機能改善・利便性向上のため、Google社が提供するアクセス解析ツール「Google Analytics（GA4）」を利用しています。',
      analyticsP2: 'Google Analyticsはデータの収集のためにCookie（クッキー）を使用しています。このデータは匿名で収集されており、個人を特定する情報は含まれません。',
      analyticsP3: 'データ収集を希望されない場合は、ブラウザの設定でCookieを無効化するか、Google社が提供する「Google アナリティクス オプトアウト アドオン」をご利用いただくことで拒否することが可能です。詳細についてはGoogle社の「ポリシーと規約」をご確認ください。',
    },
    footer: {
      copyright: '© 2026 horse-racing-calendar',
      unofficialNotice: '当サイトは非公式ファンサイトです。レース日程・発走時刻等の最新情報は必ず主催者（JRA・NAR等）公式発表をご確認ください。',
    },
    offline: {
      status: 'オフライン表示中（キャッシュされたレースデータを表示しています）',
      reconnected: 'オンラインに復帰しました',
    },
    pwa: {
      ready: 'アプリがオフラインで使用可能になりました',
      updateAvailable: '新しいバージョンが利用可能です。更新して最新のレース日程を反映しますか？',
      later: '後で',
      update: '更新する',
      close: '閉じる',
    },
  },
  en: {
    app: {
      title: 'Graded Races',
      subtitle: 'Graded Races Calendar',
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
      timeTbd: 'TBD',
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
    filter: {
      searchPlaceholder: 'Search by race name (e.g. Arima Kinen, Tokyo Daishoten, February, Tokyo Derby)',
      searchAria: 'Search races',
      clearSearchAria: 'Clear search keyword',
      resetFilterAria: 'Reset filters',
      reset: 'Reset',
      orgLabel: 'Organization:',
      orgAll: 'All',
      orgJra: 'JRA',
      orgNar: 'NAR',
      gradeLabel: 'Grade:',
      gradeGroupJra: 'JRA Grades',
      gradeGroupDart: 'Dirt Grades',
      gradeGroupNankanto: 'Minami Kanto',
      gradeGroupRegional: 'Regional Grades',
      selectAll: 'Select All',
      clearGroup: 'Clear',
      trackLabel: 'Track:',
      distanceLabel: 'Distance:',
      courseLabel: 'Courses',
      courseExpandAria: 'Toggle course filter',
      selectCourses: 'Select courses (multiple choice):',
      clearCourses: 'Clear selected courses',
      selectedCourses: 'Selected courses:',
      clear: 'Clear',
      removeCourseAria: 'Remove {course} filter',
      distanceFilterAria: 'Distance filter: {label} ({description})',
      appDocTitle: 'Graded Races - JRA & NAR Graded Races Calendar',
      matchedRaces: 'Matching races: {count}',
      viewModeLabel: 'View: {mode}',
      viewModeTimeline: 'Timeline',
      viewModeCalendar: 'Calendar',
      expandFilters: 'Expand filters',
      collapseFilters: 'Collapse filters',
      toggleFiltersAria: 'Toggle detailed filters',
      activeFiltersCount: '{count} active',
      loadingRaces: 'Loading race schedules',
      loadError: 'Failed to load race data: ',
    },
    disclaimer: {
      trigger: 'Disclaimer & Data Sources',
      title: 'Disclaimer & Data Sources',
      description: 'Terms of use, data handling, and disclaimer for this application.',
      fanSiteTitle: 'Unofficial Fan Site',
      fanSiteBody: 'This service (Graded Races Calendar) is an unofficial, personal fan project and has no affiliation with JRA (Japan Racing Association), NAR (National Association of Racing), local racing authorities, or any racing associations.',
      dataSourceTitle: 'Data Sources',
      dataSourceBody: 'Race schedules, post times, and race conditions (course, distance, eligibility, weight, etc.) published on this app are sourced and processed from publicly accessible official information published by JRA and NAR.',
      changesTitle: 'Schedule Changes & Disclaimer',
      changesP1: 'Race schedules, post times, entries, and weights are subject to change, cancellation, or postponement (e.g. rescheduled races) without notice due to severe weather, contingencies, or organizer reasons.',
      changesP2: 'While every effort is made to ensure accuracy and completeness, real-time validity and completeness are not guaranteed. When purchasing betting tickets or attending races in person, please always verify official announcements from the organizers (e.g., JRA or NAR).',
      changesP2Strong: 'When purchasing betting tickets or attending races in person, please always verify official announcements from the organizers (e.g., JRA or NAR).',
      changesP3: 'The developer and operator assume no liability for any direct or indirect damages, losses, or issues arising from the use or inability to use this service (including but not limited to betting results, transportation, or accommodation costs).',
      rightsTitle: 'Intellectual Property & Trademarks',
      rightsBody: 'Race names, track names, organization names, trademarks, and logos displayed on this service belong to their respective rights holders (JRA, NAR, local authorities, etc.).',
      analyticsTitle: 'Access Analytics (Google Analytics)',
      analyticsP1: 'This service uses Google Analytics (GA4) provided by Google LLC to understand usage patterns and enhance service quality and user experience.',
      analyticsP2: 'Google Analytics uses cookies to collect data. This data is collected anonymously and does not contain personally identifiable information.',
      analyticsP3: 'If you wish to opt out of data collection, you can disable cookies in your browser settings or use the "Google Analytics Opt-out Browser Add-on" provided by Google. For details, please refer to Google\'s Privacy & Terms.',
    },
    footer: {
      copyright: '© 2026 horse-racing-calendar',
      unofficialNotice: 'This is an unofficial fan site. Please always verify the latest race schedules and post times with official organizers (e.g., JRA, NAR).',
    },
    offline: {
      status: 'Offline Mode (Displaying cached race data)',
      reconnected: 'Back online',
    },
    pwa: {
      ready: 'App ready to work offline',
      updateAvailable: 'New version available. Update now to reflect the latest race schedule?',
      later: 'Later',
      update: 'Update',
      close: 'Close',
    },
  },
} as const;

export interface DistanceOption {
  label: string;
  category: import('../types/race').DistanceCategory;
  description: string;
}

export const DISTANCE_OPTIONS_BY_LANG: Record<Language, DistanceOption[]> = {
  ja: [
    { label: '短距離', category: 'sprint', description: '1400m以下（スプリント）' },
    { label: 'マイル', category: 'mile', description: '1500〜1700m（マイル）' },
    { label: '中距離', category: 'intermediate', description: '1800〜2200m（中距離）' },
    { label: '長距離', category: 'long', description: '2400m以上（長距離・障害）' },
  ],
  en: [
    { label: 'Sprint', category: 'sprint', description: '~1,400m (Sprint)' },
    { label: 'Mile', category: 'mile', description: '1,401~1,700m (Mile)' },
    { label: 'Intermediate', category: 'intermediate', description: '1,701~2,200m (Intermediate)' },
    { label: 'Long', category: 'long', description: '2,300m~ (Long & Jump)' },
  ],
};

export type CourseRegion = 'jra' | 'nankanto' | 'regional' | 'banei';

export interface CourseGroup {
  region: CourseRegion;
  label: Record<Language, string>;
  courses: {
    name: string; // 照合用キー（日本語名称）
    label: Record<Language, string>;
  }[];
}

export const COURSE_GROUPS: CourseGroup[] = [
  {
    region: 'jra',
    label: { ja: '中央競馬 (JRA)', en: 'JRA (Central)' },
    courses: [
      { name: '札幌', label: { ja: '札幌', en: 'Sapporo' } },
      { name: '函館', label: { ja: '函館', en: 'Hakodate' } },
      { name: '福島', label: { ja: '福島', en: 'Fukushima' } },
      { name: '新潟', label: { ja: '新潟', en: 'Niigata' } },
      { name: '東京', label: { ja: '東京', en: 'Tokyo' } },
      { name: '中山', label: { ja: '中山', en: 'Nakayama' } },
      { name: '中京', label: { ja: '中京', en: 'Chukyo' } },
      { name: '京都', label: { ja: '京都', en: 'Kyoto' } },
      { name: '阪神', label: { ja: '阪神', en: 'Hanshin' } },
      { name: '小倉', label: { ja: '小倉', en: 'Kokura' } },
    ],
  },
  {
    region: 'nankanto',
    label: { ja: '南関東 (NAR)', en: 'Minami Kanto (NAR)' },
    courses: [
      { name: '浦和', label: { ja: '浦和', en: 'Urawa' } },
      { name: '船橋', label: { ja: '船橋', en: 'Funabashi' } },
      { name: '大井', label: { ja: '大井', en: 'Oi' } },
      { name: '川崎', label: { ja: '川崎', en: 'Kawasaki' } },
    ],
  },
  {
    region: 'regional',
    label: { ja: 'その他地方 (NAR)', en: 'Regional (NAR)' },
    courses: [
      { name: '門別', label: { ja: '門別', en: 'Mombetsu' } },
      { name: '盛岡', label: { ja: '盛岡', en: 'Morioka' } },
      { name: '水沢', label: { ja: '水沢', en: 'Mizusawa' } },
      { name: '金沢', label: { ja: '金沢', en: 'Kanazawa' } },
      { name: '笠松', label: { ja: '笠松', en: 'Kasamatsu' } },
      { name: '名古屋', label: { ja: '名古屋', en: 'Nagoya' } },
      { name: '園田', label: { ja: '園田', en: 'Sonoda' } },
      { name: '姫路', label: { ja: '姫路', en: 'Himeji' } },
      { name: '高知', label: { ja: '高知', en: 'Kochi' } },
      { name: '佐賀', label: { ja: '佐賀', en: 'Saga' } },
    ],
  },
  {
    region: 'banei',
    label: { ja: 'ばんえい (NAR)', en: 'Banei (NAR)' },
    courses: [
      { name: '帯広', label: { ja: '帯広', en: 'Obihiro' } },
    ],
  },
];

export interface CourseOption {
  label: string;
  name: string; // 照合用キー（日本語名称）
}

export const COURSE_OPTIONS_BY_LANG: Record<Language, CourseOption[]> = {
  ja: COURSE_GROUPS.flatMap((g) => g.courses.map((c) => ({ label: c.label.ja, name: c.name }))),
  en: COURSE_GROUPS.flatMap((g) => g.courses.map((c) => ({ label: c.label.en, name: c.name }))),
};

/**
 * 競馬場名（日本語または英語）から現在の言語の表示ラベルを取得するヘルパー
 */
export function getLocalizedCourseName(courseName: string, lang: Language): string {
  const found = COURSE_OPTIONS_BY_LANG.ja.findIndex((c) => c.name === courseName || c.label === courseName);
  if (found !== -1) {
    return COURSE_OPTIONS_BY_LANG[lang][found].label;
  }
  const foundEn = COURSE_OPTIONS_BY_LANG.en.findIndex((c) => c.label === courseName);
  if (foundEn !== -1) {
    return COURSE_OPTIONS_BY_LANG[lang][foundEn].label;
  }
  return courseName;
}

export const trackTypeLabels: Record<Language, Record<import('../types/race').TrackType, string>> = {
  ja: {
    turf: '芝',
    dirt: 'ダート',
    obstacle: '障害',
    banei: 'ばんえい',
    aw: 'AW',
  },
  en: {
    turf: 'Turf',
    dirt: 'Dirt',
    obstacle: 'Jump',
    banei: 'Banei',
    aw: 'AW',
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
