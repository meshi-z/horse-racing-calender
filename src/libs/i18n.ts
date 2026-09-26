import { useLanguageStore, type Language } from '../store/useLanguageStore';
import type { Organization } from '../types/race';

/**
 * アプリケーション共通のUI翻訳辞書定義
 */
export const translations = {
  ja: {
    app: {
      title: '重賞カレンダー',
      subtitle: 'Graded Races Calendar',
      appName: '重賞カレンダー',
      appFullName: '重賞カレンダー - JRA・NAR重賞レース',
    },
    nav: {
      timeline: 'タイムライン',
      calendar: 'カレンダー',
      switchLanguageToEn: '英語に切り替え',
      switchLanguageToJa: '日本語に切り替え',
      switchLanguageToFr: 'フランス語に切り替え',
      switchLanguageToZh: '繁体字中国語に切り替え',
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
      orgFrance: 'フランス (France)',
      orgUk: 'イギリス (UK)',
      orgUsa: 'アメリカ (Equibase)',
      orgHk: '香港 (HKJC)',
      orgIreland: 'アイルランド (HRI)',
      orgSelectModalTitle: '開催国・主催者の選択',
      orgSelectModalDesc: '表示する競馬の開催団体を選択してください（複数選択可）',
      orgSelectTrigger: '開催国・主催者',
      orgTriggerAll: '全主催者',
      regionJapan: '日本',
      regionEurope: 'ヨーロッパ',
      regionAmerica: 'アメリカ',
      regionAsia: 'アジア',
      selectAllJapan: '日本全重賞',
      selectAllEurope: '欧州全重賞',
      selectAllAmerica: '米国全重賞',
      selectAllAsia: 'アジア全重賞',
      orgModalDone: '完了',
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
      appDocTitle: '重賞カレンダー - JRA, NAR, France Galop, UK, USA, HK & Ireland 重賞レーススケジュール',
      matchedRaces: '該当レース: {count} 件',
      viewModeLabel: '表示: {mode}',
      viewModeTimeline: 'タイムライン',
      viewModeCalendar: '月間カレンダー',
      expandFilters: 'フィルターを展開',
      collapseFilters: 'フィルターを折りたたむ',
      filterToggle: 'フィルター',
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
      fanSiteBody: '本サービス（重賞カレンダー）は、個人が開発・運営する非公式のファンサイトです。日本中央競馬会（JRA）、地方競馬全国協会（NAR）、フランスギャロ（France Galop）、英国競馬統轄機構（BHA）、全米サラブレッド競馬協会・Equibase（The Jockey Club）、香港賽馬會（HKJC）、アイルランド競馬協会（HRI: Horse Racing Ireland）、各地方競馬主催者（道営、岩手、南関東4場、金沢、愛知、笠松、兵庫、高知、佐賀、ばんえい帯広）およびその他の関連団体とは一切関係ありません。',
      dataSourceTitle: 'データの出典',
      dataSourceBody: '本アプリで掲載しているレース日程、発走予定時刻、出走条件（コース・距離・出走資格・斤量等）のデータは、JRA（日本中央競馬会）公式サイト、NAR（地方競馬全国協会）公式サイト、France Galop（PMU）公式API、英国BHA（Sporting Life等）、米国公式Equibase（The Jockey Club）、香港HKJC（香港賽馬會）、およびアイルランドHRI（Sporting Life等）公式発表で一般公開されている公式情報（カレンダーファイル、重賞一覧、確定出馬表等）を取得・加工して提供しています。',
      changesTitle: '開催変更・公式発表確認の推奨と免責事項',
      changesP1: 'レースの日程、発走時刻、出走馬、斤量等の情報は、天候悪化・自然災害や主催者の都合等により、予告なく変更・中止・延期（代替開催・続行競馬等）となる場合があります。',
      changesP2: '情報の正確性・網羅性には細心の注意を払っておりますが、リアルタイム性や完全性を保証するものではありません。馬券の購入、現地観戦、遠征等の際は、必ず主催者（JRA・NAR・France Galop・BHA・Equibase・HKJC・HRI等）公式発表の最新情報をご確認ください。',
      changesP2Strong: '馬券の購入、現地観戦、遠征等の際は、必ず主催者（JRA・NAR・France Galop・BHA・Equibase・HKJC・HRI等）公式発表の最新情報をご確認ください。',
      changesP3: '本サービスの利用、または利用できなかったことにより生じたあらゆる直接的・間接的な損害・トラブル（馬券投票結果、交通・宿泊費用等を含むがこれらに限定されません）について、本サービスの開発者および運営者は一切の責任を負いません。',
      rightsTitle: '権利・商標の帰属',
      rightsBody: '本サービスに記載されているレース名、競馬場名、主催団体名等の名称、商標およびロゴ等の知的財産権は、各主催者（JRA、NAR、France Galop、BHA、The Jockey Club / Equibase、HKJC、HRI、各地方競馬主催者等）ならびに各権利者に帰属します。',
      analyticsTitle: 'アクセス解析ツール（Google Analytics）について',
      analyticsP1: '本サービスでは、利用状況の把握や機能改善・利便性向上のため、Google社が提供するアクセス解析ツール「Google Analytics（GA4）」を利用しています。',
      analyticsP2: 'Google Analyticsはデータの収集のためにCookie（クッキー）を使用しています。このデータは匿名で収集されており、個人を特定する情報は含まれません。',
      analyticsP3: 'データ収集を希望されない場合は、ブラウザの設定でCookieを無効化するか、Google社が提供する「Google アナリティクス オプトアウト アドオン」をご利用いただくことで拒否することが可能です。詳細についてはGoogle社の「ポリシーと規約」をご確認ください。',
    },
    footer: {
      copyright: '© 2026 horse-racing-calendar',
      unofficialNotice: '当サイトは非公式ファンサイトです。レース日程・発走時刻等の最新情報は必ず主催者（JRA・NAR・France Galop・BHA・Equibase・HKJC・HRI等）公式発表をご確認ください。',
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
    pwaPrompt: {
      title: 'アプリをインストール',
      androidDesc: 'ホーム画面に追加すると、全画面かつオフラインでも快適にレース日程を確認できます。',
      iosTitle: 'ホーム画面に追加',
      iosDesc: 'Safariの共有ボタンをタップし、「ホーム画面に追加」を選択するとアプリとしてご利用いただけます。',
      installButton: 'インストール',
      dismiss: '閉じる',
      dismissAria: 'インストール案内を閉じる',
    },
  },
  en: {
    app: {
      title: 'Graded Races',
      subtitle: 'Graded Races Calendar',
      appName: 'Graded Races',
      appFullName: 'Graded Races Calendar',
    },
    nav: {
      timeline: 'Timeline',
      calendar: 'Calendar',
      switchLanguageToEn: 'Switch to English',
      switchLanguageToJa: 'Switch to Japanese',
      switchLanguageToFr: 'Switch to French',
      switchLanguageToZh: 'Switch to Traditional Chinese',
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
      orgFrance: 'France Galop',
      orgUk: 'UK (BHA)',
      orgUsa: 'USA (Equibase)',
      orgHk: 'Hong Kong (HKJC)',
      orgIreland: 'Ireland (HRI)',
      orgSelectModalTitle: 'Select Countries & Organizations',
      orgSelectModalDesc: 'Select racing organizations to display (multiple allowed)',
      orgSelectTrigger: 'Organizations',
      orgTriggerAll: 'All Orgs',
      regionJapan: 'Japan',
      regionEurope: 'Europe',
      regionAmerica: 'America',
      regionAsia: 'Asia',
      selectAllJapan: 'All Japan',
      selectAllEurope: 'All Europe',
      selectAllAmerica: 'All America',
      selectAllAsia: 'All Asia',
      orgModalDone: 'Done',
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
      appDocTitle: 'Graded Races - JRA, NAR, France Galop, UK, USA, HK & Ireland Graded Races Calendar',
      matchedRaces: 'Matching races: {count}',
      viewModeLabel: 'View: {mode}',
      viewModeTimeline: 'Timeline',
      viewModeCalendar: 'Calendar',
      expandFilters: 'Expand filters',
      collapseFilters: 'Collapse filters',
      filterToggle: 'Filters',
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
      fanSiteBody: 'This service (Graded Races Calendar) is an unofficial, personal fan project and has no affiliation with JRA (Japan Racing Association), NAR (National Association of Racing), France Galop, British Horseracing Authority (BHA), The Jockey Club / Equibase, Hong Kong Jockey Club (HKJC), Horse Racing Ireland (HRI), local racing authorities, or any official racing associations.',
      dataSourceTitle: 'Data Sources',
      dataSourceBody: 'Race schedules, post times, and race conditions (course, distance, eligibility, weight, etc.) published on this app are sourced and processed from publicly accessible official information published by JRA, NAR, France Galop (PMU), BHA (Sporting Life), Equibase (The Jockey Club), HKJC (The Hong Kong Jockey Club), and HRI (Horse Racing Ireland / Sporting Life).',
      changesTitle: 'Schedule Changes & Disclaimer',
      changesP1: 'Race schedules, post times, entries, and weights are subject to change, cancellation, or postponement (e.g. rescheduled races) without notice due to severe weather, contingencies, or organizer reasons.',
      changesP2: 'While every effort is made to maintain information accuracy, real-time availability and completeness are not guaranteed. Always check official announcements from organizers (JRA, NAR, France Galop, BHA, Equibase, HKJC, HRI).',
      changesP2Strong: 'Always check official announcements from organizers (JRA, NAR, France Galop, BHA, Equibase, HKJC, HRI).',
      changesP3: 'The author/operator of this service assumes no responsibility for any direct or indirect damages, issues, or losses (including but not limited to betting outcomes, travel, or accommodation expenses) arising from using or being unable to use this service.',
      rightsTitle: 'Intellectual Property & Trademarks',
      rightsBody: 'All trademarks, logos, race names, racecourse names, and organization names displayed on this service belong to their respective copyright and trademark owners (JRA, NAR, France Galop, BHA, The Jockey Club / Equibase, HKJC, HRI, etc.).',
      analyticsTitle: 'Access Analytics (Google Analytics)',
      analyticsP1: 'This service uses Google Analytics (GA4) provided by Google LLC to understand usage patterns and enhance service quality and user experience.',
      analyticsP2: 'Google Analytics uses cookies to collect data. This data is collected anonymously and does not contain personally identifiable information.',
      analyticsP3: 'If you wish to opt out of data collection, you can disable cookies in your browser settings or use the "Google Analytics Opt-out Browser Add-on" provided by Google. For details, please review Google\'s Policy and Terms.',
    },
    footer: {
      copyright: '© 2026 horse-racing-calendar',
      unofficialNotice: 'This is an unofficial fan site. Please always verify the latest race schedules and post times with official organizers (e.g., JRA, NAR, France Galop, BHA, Equibase, HKJC, HRI).',
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
    pwaPrompt: {
      title: 'Install App',
      androidDesc: 'Add to home screen for full-screen and fast offline access to race schedules.',
      iosTitle: 'Add to Home Screen',
      iosDesc: 'Tap the share button in Safari and select "Add to Home Screen" to install as an app.',
      installButton: 'Install',
      dismiss: 'Close',
      dismissAria: 'Dismiss install prompt',
    },
  },
  fr: {
    app: {
      title: 'Courses de Groupe',
      subtitle: 'Calendrier des Courses de Groupe',
      appName: 'Courses de Groupe',
      appFullName: 'Calendrier des Courses de Groupe',
    },
    nav: {
      timeline: 'Chronologie',
      calendar: 'Calendrier',
      switchLanguageToEn: 'Passer en anglais',
      switchLanguageToJa: 'Passer en japonais',
      switchLanguageToFr: 'Passer en français',
      switchLanguageToZh: 'Passer en chinois traditionnel',
      switchToDark: 'Passer en mode sombre',
      switchToLight: 'Passer en mode clair',
    },
    status: {
      scheduled: 'Prévu',
      today: "Aujourd'hui",
      rescheduled: 'Reporté',
      timeTbd: 'Heure à confirmer',
    },
    action: {
      close: 'Fermer',
      reset: 'Réinitialiser',
      jumpToToday: "Aujourd'hui",
    },
    timeline: {
      ariaLabel: 'Chronologie des courses de groupe',
      todayBadge: "Aujourd'hui",
      rescheduledBadge: 'Reporté',
      racesCount: '{count} courses',
      noRacesTitle: 'Aucune course trouvée',
      noRacesDesc: 'Modifiez vos mots-clés ou réinitialisez les filtres.',
      resetFilters: 'Réinitialiser les filtres',
      jumpToToday: "Aujourd'hui",
      jumpToUpcoming: 'Courses à venir',
      jumpToTodayAria: "Aller aux courses d'aujourd'hui",
      jumpToUpcomingAria: 'Aller aux courses à venir',
    },
    card: {
      postponedFrom: 'Reporté depuis le {date}',
    },
    dialog: {
      course: 'Hippodrome',
      trackAndDistance: 'Piste & Distance',
      eligibilityAndWeight: 'Conditions & Poids',
      weightPrefix: 'Poids: ',
      rescheduledTitle: 'Course reportée (changement de date)',
      rescheduledNoticeWithDate: 'Reporté de la date initialement prévue: {date}.',
      rescheduledNotice: 'La date a été modifiée par rapport au calendrier initial.',
    },
    calendar: {
      prevMonth: 'Mois précédent',
      nextMonth: 'Mois suivant',
      today: "Aujourd'hui",
      todayAria: 'Aller au mois en cours',
      monthRaces: '{count} courses',
      rescheduledShort: 'Reporté',
      daysCount: '{count} courses',
    },
    filter: {
      searchPlaceholder: "Rechercher par nom (ex: Arc de Triomphe, Arima Kinen, Jockey Club)",
      searchAria: 'Rechercher des courses',
      clearSearchAria: 'Effacer la recherche',
      resetFilterAria: 'Réinitialiser les filtres',
      reset: 'Réinitialiser',
      orgLabel: 'Organisateur:',
      orgAll: 'Tous',
      orgJra: 'JRA (Japon Central)',
      orgNar: 'NAR (Japon Régional)',
      orgFrance: 'France Galop',
      orgUk: 'Royaume-Uni (BHA)',
      orgUsa: 'États-Unis (Equibase)',
      orgHk: 'Hong Kong (HKJC)',
      orgIreland: 'Irlande (HRI)',
      orgSelectModalTitle: 'Sélectionner pays et organisateurs',
      orgSelectModalDesc: 'Sélectionnez les organisations à afficher (sélection multiple)',
      orgSelectTrigger: 'Organisations',
      orgTriggerAll: 'Toutes',
      regionJapan: 'Japon',
      regionEurope: 'Europe',
      regionAmerica: 'Amérique',
      regionAsia: 'Asie',
      selectAllJapan: 'Tout le Japon',
      selectAllEurope: 'Toute l\'Europe',
      selectAllAmerica: 'Toute l\'Amérique',
      selectAllAsia: 'Toute l\'Asie',
      orgModalDone: 'Terminé',
      gradeLabel: 'Groupe:',
      gradeGroupJra: 'Groupes JRA',
      gradeGroupDart: 'Groupes Dirt',
      gradeGroupNankanto: 'Minami Kanto',
      gradeGroupRegional: 'Groupes Régionaux',
      selectAll: 'Tout sélectionner',
      clearGroup: 'Effacer',
      trackLabel: 'Piste:',
      distanceLabel: 'Distance:',
      courseLabel: 'Hippodromes',
      courseExpandAria: 'Afficher le filtre des hippodromes',
      selectCourses: 'Sélectionner des hippodromes (choix multiple):',
      clearCourses: 'Effacer les hippodromes sélectionnés',
      selectedCourses: 'Hippodromes sélectionnés:',
      clear: 'Effacer',
      removeCourseAria: 'Supprimer le filtre {course}',
      distanceFilterAria: 'Filtre de distance: {label} ({description})',
      appDocTitle: 'Courses de Groupe - Calendrier JRA, NAR, France Galop, UK, USA, HK & Irlande',
      matchedRaces: 'Courses correspondantes: {count}',
      viewModeLabel: 'Affichage: {mode}',
      viewModeTimeline: 'Chronologie',
      viewModeCalendar: 'Calendrier',
      expandFilters: 'Déplier les filtres',
      collapseFilters: 'Replier les filtres',
      filterToggle: 'Filtres',
      toggleFiltersAria: 'Afficher/masquer les filtres détaillés',
      activeFiltersCount: '{count} actifs',
      loadingRaces: 'Chargement des courses...',
      loadError: 'Échec du chargement des données de courses: ',
    },
    disclaimer: {
      trigger: 'Mentions légales & Sources',
      title: 'Mentions légales & Sources',
      description: "Conditions d'utilisation, traitement des données et clause de non-responsabilité.",
      fanSiteTitle: 'Site non officiel de fans',
      fanSiteBody: "Ce service (Calendrier des courses de groupe) est un projet personnel non officiel. Il n'est affilié d'aucune manière à la JRA, à la NAR, à France Galop, à la British Horseracing Authority (BHA), à The Jockey Club / Equibase, au Hong Kong Jockey Club (HKJC), à Horse Racing Ireland (HRI) ou à tout autre organisme de courses officiel.",
      dataSourceTitle: 'Sources des données',
      dataSourceBody: 'Les calendriers de courses, horaires de départ et conditions de course publiés proviennent des données publiques officielles publiées par la JRA, la NAR, France Galop (PMU), la BHA (Sporting Life), Equibase (The Jockey Club), le HKJC (The Hong Kong Jockey Club) et HRI (Horse Racing Ireland / Sporting Life).',
      changesTitle: 'Modifications de calendrier & Avertissement',
      changesP1: 'Les horaires, partants et conditions de course peuvent être modifiés, annulés ou reportés sans préavis en raison des conditions météorologiques ou des décisions des organisateurs.',
      changesP2: "Bien que le plus grand soin soit apporté à l'exactitude des informations, leur temps réel et leur exhaustivité ne sont pas garantis. Veuillez toujours vérifier les annonces officielles des organisateurs (JRA, NAR, France Galop, BHA, Equibase, HKJC, HRI).",
      changesP2Strong: 'Veuillez toujours vérifier les annonces officielles des organisateurs (JRA, NAR, France Galop, BHA, Equibase, HKJC, HRI).',
      changesP3: "L'auteur de ce service décline toute responsabilité pour tout dommage direct ou indirect résultant de l'utilisation de ce service (y compris les résultats de paris, frais de transport, etc.).",
      rightsTitle: 'Propriété intellectuelle et marques',
      rightsBody: "Les noms de courses, d'hippodromes et d'organisations, ainsi que les marques et logos affichés, appartiennent à leurs titulaires de droits respectifs (JRA, NAR, France Galop, BHA, The Jockey Club / Equibase, HKJC, HRI, etc.).",
      analyticsTitle: "Analyse d'audience (Google Analytics)",
      analyticsP1: 'Ce service utilise Google Analytics (GA4) fourni par Google LLC pour analyser son utilisation et améliorer la qualité du service.',
      analyticsP2: 'Google Analytics utilise des cookies pour collecter des données anonymes ne contenant aucune information personnellement identifiable.',
      analyticsP3: 'Vous pouvez désactiver les cookies dans votre navigateur ou installer le module complémentaire de désactivation de Google Analytics.',
    },
    footer: {
      copyright: '© 2026 horse-racing-calendar',
      unofficialNotice: 'Ce site est un projet de fans non officiel. Veuillez toujours vous référer aux annonces officielles des organisateurs (JRA, NAR, France Galop, BHA, Equibase, HKJC, HRI) pour les informations les plus récentes.',
    },
    offline: {
      status: 'Mode hors ligne (affichage des données en cache)',
      reconnected: 'De nouveau en ligne',
    },
    pwa: {
      ready: "L'application est prête pour une utilisation hors ligne",
      updateAvailable: 'Une nouvelle version est disponible. Mettre à jour ?',
      later: 'Plus tard',
      update: 'Mettre à jour',
      close: 'Fermer',
    },
    pwaPrompt: {
      title: "Installer l'application",
      androidDesc: "Ajoutez à l'écran d'accueil pour un accès plein écran et hors ligne rapide aux courses.",
      iosTitle: "Ajouter à l'écran d'accueil",
      iosDesc: "Appuyez sur le bouton Partager dans Safari et sélectionnez « Sur l'écran d'accueil ».",
      installButton: 'Installer',
      dismiss: 'Fermer',
      dismissAria: "Fermer l'invitation d'installation",
    },
  },
  zh: {
    app: {
      title: '分級賽行事曆',
      subtitle: 'Graded Races Calendar',
      appName: '分級賽行事曆',
      appFullName: '分級賽行事曆 - 香港、日本、歐美重賞賽程',
    },
    nav: {
      timeline: '時間軸',
      calendar: '行事曆',
      switchLanguageToEn: '切換至英文',
      switchLanguageToJa: '切換至日文',
      switchLanguageToFr: '切換至法文',
      switchLanguageToZh: '切換至繁體中文',
      switchToDark: '切換至深色模式',
      switchToLight: '切換至淺色模式',
    },
    status: {
      scheduled: '預計開跑',
      today: '今日',
      rescheduled: '補賽',
      timeTbd: '時間待定',
    },
    action: {
      close: '關閉',
      reset: '重設',
      jumpToToday: '回到今日',
    },
    timeline: {
      ariaLabel: '分級賽賽事時間軸',
      todayBadge: '本日賽事',
      rescheduledBadge: '補賽',
      racesCount: '{count} 場賽事',
      noRacesTitle: '沒有符合條件的賽事',
      noRacesDesc: '請嘗試變更搜尋關鍵字或篩選條件，或重設所有條件。',
      resetFilters: '重設篩選條件',
      jumpToToday: '回到今日',
      jumpToUpcoming: '前往即將開跑賽事',
      jumpToTodayAria: '跳轉至今日舉辦的賽事',
      jumpToUpcomingAria: '跳轉至即將開跑的賽事',
    },
    card: {
      postponedFrom: '原定日期: {date} 順延',
    },
    dialog: {
      course: '舉辦場地',
      trackAndDistance: '場地・途程',
      eligibilityAndWeight: '參賽資格・負磅',
      weightPrefix: '負磅: ',
      rescheduledTitle: '因惡劣天氣等因素之補賽（賽期變更）',
      rescheduledNoticeWithDate: '已由原定舉辦日期 {date} 變更。',
      rescheduledNotice: '已由原定賽期變更。',
    },
    calendar: {
      prevMonth: '上個月',
      nextMonth: '下個月',
      today: '本月',
      todayAria: '跳轉至本月',
      monthRaces: '{count} 場賽事',
      rescheduledShort: '補',
      daysCount: '{count} 件',
    },
    filter: {
      searchPlaceholder: '搜尋賽事名稱（例: 有馬記念、香港盃、東京大賞典、February、Tokyo Derby）',
      searchAria: '搜尋賽事名稱',
      clearSearchAria: '清除搜尋關鍵字',
      resetFilterAria: '重設篩選條件',
      reset: '重設',
      orgLabel: '賽馬機構:',
      orgAll: '全部',
      orgJra: 'JRA (日本中央)',
      orgNar: 'NAR (日本地方)',
      orgFrance: '法國 (France Galop)',
      orgUk: '英國 (BHA)',
      orgUsa: '美國 (Equibase)',
      orgHk: '香港 (HKJC)',
      orgIreland: '愛爾蘭 (HRI)',
      orgSelectModalTitle: '選擇舉辦國家・賽馬機構',
      orgSelectModalDesc: '請選擇要顯示的賽馬機構（可多選）',
      orgSelectTrigger: '賽馬機構',
      orgTriggerAll: '全部機構',
      regionJapan: '日本',
      regionEurope: '歐洲',
      regionAmerica: '美國',
      regionAsia: '亞洲',
      selectAllJapan: '全日本重賞',
      selectAllEurope: '全歐洲重賞',
      selectAllAmerica: '全美重賞',
      selectAllAsia: '全亞洲重賞',
      orgModalDone: '完成',
      gradeLabel: '級別:',
      gradeGroupJra: 'JRA重賞',
      gradeGroupDart: '泥地分級賽',
      gradeGroupNankanto: '南關東重賞',
      gradeGroupRegional: '地方重賞',
      selectAll: '全選',
      clearGroup: '清除',
      trackLabel: '場地:',
      distanceLabel: '途程:',
      courseLabel: '馬場',
      courseExpandAria: '展開馬場篩選',
      selectCourses: '選擇馬場（可多選）:',
      clearCourses: '清除已選馬場',
      selectedCourses: '已選馬場:',
      clear: '清除',
      removeCourseAria: '解除 {course} 篩選',
      distanceFilterAria: '途程篩選: {label}（{description}）',
      appDocTitle: '分級賽行事曆 - 香港、JRA、NAR、法國、英國、美國、愛爾蘭重賞賽程',
      matchedRaces: '符合賽事: {count} 場',
      viewModeLabel: '顯示: {mode}',
      viewModeTimeline: '時間軸',
      viewModeCalendar: '月曆',
      expandFilters: '展開篩選',
      collapseFilters: '收起篩選',
      filterToggle: '篩選',
      toggleFiltersAria: '切換詳細篩選顯示',
      activeFiltersCount: '{count} 項套用中',
      loadingRaces: '正在載入賽事日程...',
      loadError: '載入場次資料失敗: ',
    },
    disclaimer: {
      trigger: '免責聲明・資料來源',
      title: '免責聲明・資料來源',
      description: '本應用程式之使用條款、資料處理規範及免責聲明。',
      fanSiteTitle: '關於非官方愛好者網站',
      fanSiteBody: '本服務（分級賽行事曆）為個人開發與營運之非官方愛好者網站。與香港賽馬會（HKJC）、日本中央競馬會（JRA）、地方競馬全國協會（NAR）、法國賽馬會（France Galop）、英國賽馬協會（BHA）、全美純種馬賽馬協會／Equibase（The Jockey Club）、愛爾蘭賽馬協會（Horse Racing Ireland: HRI）及各地方賽馬機構無任何關聯。',
      dataSourceTitle: '資料來源',
      dataSourceBody: '本應用程式刊載之賽事日程、預計開跑時間、參賽條件（場地、途程、參賽資格、負磅等）資料，係取得並整理自 HKJC（香港賽馬會）、JRA（日本中央競馬會）、NAR（地方競馬全國協會）、France Galop（PMU）、英國 BHA（Sporting Life 等）、美國官方 Equibase（The Jockey Club）及愛爾蘭 HRI（Sporting Life 等）公開之官方資訊。',
      changesTitle: '賽程變更・建議確認官方公告及免責聲明',
      changesP1: '賽事日程、開跑時間、出賽馬匹、負磅等資訊，可能因惡劣天氣、不可抗力或主辦機構之決定，在未經預告之情況下變更、取消或延期（補賽等）。',
      changesP2: '我們極力維護資訊之準確性與完整性，惟不保證其即時性與絕對完整。投注、現場觀賽或海外遠征前，請務必參閱主辦機構（HKJC、JRA、NAR、France Galop、BHA、Equibase、HRI 等）發布之最新官方公告。',
      changesP2Strong: '投注、現場觀賽或海外遠征前，請務必參閱主辦機構（HKJC、JRA、NAR、France Galop、BHA、Equibase、HRI 等）發布之最新官方公告。',
      changesP3: '對於因使用或無法使用本服務而產生之任何直接或間接損害或紛爭（包括但不限於投注結果、交通及住宿費用等），本服務之開發者及營運者概不承擔任何責任。',
      rightsTitle: '智慧財產權與商標歸屬',
      rightsBody: '本服務記載之賽事名稱、馬場名稱、主辦機構名稱等智慧財產權與商標，均歸各主辦機構（HKJC、JRA、NAR、France Galop、BHA、The Jockey Club / Equibase、HRI 等）及各權利人所有。',
      analyticsTitle: '關於網站流量分析工具（Google Analytics）',
      analyticsP1: '本服務為掌握使用狀況並改進服務體驗，使用由 Google 提供的分析工具「Google Analytics（GA4）」。',
      analyticsP2: 'Google Analytics 透過 Cookie 收集資料。該等資料係匿名收集，不包含可識別個人身分之資訊。',
      analyticsP3: '若您不希望被收集資料，可透過瀏覽器設定停用 Cookie，或使用 Google 提供的「Google Analytics 退出瀏覽器外掛程式」進行拒絕。詳情請參閱 Google 隱私權政策與服務條款。',
    },
    footer: {
      copyright: '© 2026 horse-racing-calendar',
      unofficialNotice: '本網站為非官方愛好者網站。最新賽事日程及開跑時間，請務必以各主辦機構（HKJC、JRA、NAR、France Galop、BHA、Equibase、HRI 等）官方公告為準。',
    },
    offline: {
      status: '離線顯示中（正在顯示快取的賽事資料）',
      reconnected: '已重新恢復連線',
    },
    pwa: {
      ready: '應用程式已可離線使用',
      updateAvailable: '有新版本可供更新。是否立即更新以載入最新賽事日程？',
      later: '稍後',
      update: '立即更新',
      close: '關閉',
    },
    pwaPrompt: {
      title: '安裝應用程式',
      androidDesc: '加入主畫面即可全螢幕快速瀏覽並支援離線查看賽事日程。',
      iosTitle: '加入主畫面',
      iosDesc: '在 Safari 中點擊分享按鈕，然後選擇「加入主畫面」即可安裝為應用程式。',
      installButton: '安裝',
      dismiss: '關閉',
      dismissAria: '關閉安裝提示',
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
  fr: [
    { label: 'Sprint', category: 'sprint', description: '≤ 1 400 m (Sprint)' },
    { label: 'Mile', category: 'mile', description: '1 401 à 1 700 m (Mile)' },
    { label: 'Intermédiaire', category: 'intermediate', description: '1 701 à 2 200 m (Intermédiaire)' },
    { label: 'Classique / Long', category: 'long', description: '≥ 2 300 m (Long & Obstacle)' },
  ],
  zh: [
    { label: '短途', category: 'sprint', description: '1400米以下（短途）' },
    { label: '一哩', category: 'mile', description: '1500〜1700米（一哩）' },
    { label: '中距離', category: 'intermediate', description: '1800〜2200米（中距離）' },
    { label: '長途', category: 'long', description: '2400米以上（長途・跳欄）' },
  ],
};

export type CourseRegion = 'jra' | 'nankanto' | 'regional' | 'banei' | 'france' | 'uk' | 'ireland' | 'usa' | 'hong_kong';
export type RegionCategory = 'japan' | 'europe' | 'america' | 'asia';

export interface CourseGroup {
  region: CourseRegion;
  organization: Organization;
  category: RegionCategory;
  label: Record<Language, string>;
  courses: {
    name: string; // 照合用キー（日本語名称）
    label: Record<Language, string>;
  }[];
}

export const COURSE_GROUPS: CourseGroup[] = [
  {
    region: 'jra',
    organization: 'jra',
    category: 'japan',
    label: { ja: '中央競馬 (JRA)', en: 'JRA (Central)', fr: 'JRA (Japon Central)', zh: '日本中央競馬 (JRA)' },
    courses: [
      { name: '札幌', label: { ja: '札幌', en: 'Sapporo', fr: 'Sapporo', zh: '札幌' } },
      { name: '函館', label: { ja: '函館', en: 'Hakodate', fr: 'Hakodate', zh: '函館' } },
      { name: '福島', label: { ja: '福島', en: 'Fukushima', fr: 'Fukushima', zh: '福島' } },
      { name: '新潟', label: { ja: '新潟', en: 'Niigata', fr: 'Niigata', zh: '新潟' } },
      { name: '東京', label: { ja: '東京', en: 'Tokyo', fr: 'Tokyo', zh: '東京' } },
      { name: '中山', label: { ja: '中山', en: 'Nakayama', fr: 'Nakayama', zh: '中山' } },
      { name: '中京', label: { ja: '中京', en: 'Chukyo', fr: 'Chukyo', zh: '中京' } },
      { name: '京都', label: { ja: '京都', en: 'Kyoto', fr: 'Kyoto', zh: '京都' } },
      { name: '阪神', label: { ja: '阪神', en: 'Hanshin', fr: 'Hanshin', zh: '阪神' } },
      { name: '小倉', label: { ja: '小倉', en: 'Kokura', fr: 'Kokura', zh: '小倉' } },
    ],
  },
  {
    region: 'nankanto',
    organization: 'nar',
    category: 'japan',
    label: { ja: '南関東 (NAR)', en: 'Minami Kanto (NAR)', fr: 'Minami Kanto (NAR)', zh: '南關東 (NAR)' },
    courses: [
      { name: '浦和', label: { ja: '浦和', en: 'Urawa', fr: 'Urawa', zh: '浦和' } },
      { name: '船橋', label: { ja: '船橋', en: 'Funabashi', fr: 'Funabashi', zh: '船橋' } },
      { name: '大井', label: { ja: '大井', en: 'Oi', fr: 'Oi', zh: '大井' } },
      { name: '川崎', label: { ja: '川崎', en: 'Kawasaki', fr: 'Kawasaki', zh: '川崎' } },
    ],
  },
  {
    region: 'regional',
    organization: 'nar',
    category: 'japan',
    label: { ja: 'その他地方 (NAR)', en: 'Regional (NAR)', fr: 'Régional (NAR)', zh: '其他地方 (NAR)' },
    courses: [
      { name: '門別', label: { ja: '門別', en: 'Mombetsu', fr: 'Mombetsu', zh: '門別' } },
      { name: '盛岡', label: { ja: '盛岡', en: 'Morioka', fr: 'Morioka', zh: '盛岡' } },
      { name: '水沢', label: { ja: '水沢', en: 'Mizusawa', fr: 'Mizusawa', zh: '水澤' } },
      { name: '金沢', label: { ja: '金沢', en: 'Kanazawa', fr: 'Kanazawa', zh: '金澤' } },
      { name: '笠松', label: { ja: '笠松', en: 'Kasamatsu', fr: 'Kasamatsu', zh: '笠松' } },
      { name: '名古屋', label: { ja: '名古屋', en: 'Nagoya', fr: 'Nagoya', zh: '名古屋' } },
      { name: '園田', label: { ja: '園田', en: 'Sonoda', fr: 'Sonoda', zh: '園田' } },
      { name: '姫路', label: { ja: '姫路', en: 'Himeji', fr: 'Himeji', zh: '姬路' } },
      { name: '高知', label: { ja: '高知', en: 'Kochi', fr: 'Kochi', zh: '高知' } },
      { name: '佐賀', label: { ja: '佐賀', en: 'Saga', fr: 'Saga', zh: '佐賀' } },
    ],
  },
  {
    region: 'banei',
    organization: 'nar',
    category: 'japan',
    label: { ja: 'ばんえい (NAR)', en: 'Banei (NAR)', fr: 'Banei (NAR)', zh: '輓曳 (NAR)' },
    courses: [
      { name: '帯広', label: { ja: '帯広', en: 'Obihiro', fr: 'Obihiro', zh: '帶廣' } },
    ],
  },
  {
    region: 'france',
    organization: 'france_galop',
    category: 'europe',
    label: { ja: 'フランス (France)', en: 'France', fr: 'France Galop', zh: '法國 (France Galop)' },
    courses: [
      { name: 'パリロンシャン', label: { ja: 'パリロンシャン', en: 'ParisLongchamp', fr: 'ParisLongchamp', zh: '巴黎隆尚' } },
      { name: 'シャンティイ', label: { ja: 'シャンティイ', en: 'Chantilly', fr: 'Chantilly', zh: '尚蒂伊' } },
      { name: 'ドーヴィル', label: { ja: 'ドーヴィル', en: 'Deauville', fr: 'Deauville', zh: '多維爾' } },
      { name: 'サンクルー', label: { ja: 'サンクルー', en: 'Saint-Cloud', fr: 'Saint-Cloud', zh: '聖格盧' } },
      { name: 'フォンテーヌブロー', label: { ja: 'フォンテーヌブロー', en: 'Fontainebleau', fr: 'Fontainebleau', zh: '楓丹白露' } },
      { name: 'トゥールーズ', label: { ja: 'トゥールーズ', en: 'Toulouse', fr: 'Toulouse', zh: '圖盧茲' } },
      { name: 'ヴィシー', label: { ja: 'ヴィシー', en: 'Vichy', fr: 'Vichy', zh: '維希' } },
      { name: 'ボルドー', label: { ja: 'ボルドー', en: 'Bordeaux', fr: 'Bordeaux', zh: '波爾多' } },
      { name: 'マルセイユボレリー', label: { ja: 'マルセイユボレリー', en: 'Marseille-Borely', fr: 'Marseille-Borély', zh: '馬賽鮑雷利' } },
      { name: 'リヨン', label: { ja: 'リヨン', en: 'Lyon', fr: 'Lyon', zh: '里昂' } },
      { name: 'クラオン', label: { ja: 'クラオン', en: 'Craon', fr: 'Craon', zh: '克拉昂' } },
      { name: 'クレールフォンテーヌ', label: { ja: 'クレールフォンテーヌ', en: 'Clairefontaine', fr: 'Clairefontaine', zh: '克萊楓丹' } },
      { name: 'コンピエーニュ', label: { ja: 'コンピエーニュ', en: 'Compiegne', fr: 'Compiègne', zh: '貢比涅' } },
      { name: 'ラテスト', label: { ja: 'ラテスト', en: 'La Teste', fr: 'La Teste', zh: '拉泰斯特' } },
      { name: 'ナント', label: { ja: 'ナント', en: 'Nantes', fr: 'Nantes', zh: '南特' } },
      { name: 'カーニュ・シュル・メール', label: { ja: 'カーニュ・シュル・メール', en: 'Cagnes-sur-Mer', fr: 'Cagnes-sur-Mer', zh: '卡涅' } },
    ],
  },
  {
    region: 'uk',
    organization: 'bha',
    category: 'europe',
    label: { ja: 'イギリス (UK)', en: 'UK (BHA)', fr: 'Royaume-Uni (BHA)', zh: '英國 (BHA)' },
    courses: [
      { name: 'アスコット', label: { ja: 'アスコット', en: 'Ascot', fr: 'Ascot', zh: '雅士谷' } },
      { name: 'エアー', label: { ja: 'エアー', en: 'Ayr', fr: 'Ayr', zh: '艾亞' } },
      { name: 'チェスター', label: { ja: 'チェスター', en: 'Chester', fr: 'Chester', zh: '車士達' } },
      { name: 'ドンカスター', label: { ja: 'ドンカスター', en: 'Doncaster', fr: 'Doncaster', zh: '唐加士達' } },
      { name: 'エプソム', label: { ja: 'エプソム', en: 'Epsom', fr: 'Epsom', zh: '葉森' } },
      { name: 'グッドウッド', label: { ja: 'グッドウッド', en: 'Goodwood', fr: 'Goodwood', zh: '古活' } },
      { name: 'ヘイドック', label: { ja: 'ヘイドック', en: 'Haydock', fr: 'Haydock', zh: '禧鐸' } },
      { name: 'ケンプトン', label: { ja: 'ケンプトン', en: 'Kempton', fr: 'Kempton', zh: '錦駿騰' } },
      { name: 'リングフィールド', label: { ja: 'リングフィールド', en: 'Lingfield', fr: 'Lingfield', zh: '靈飛' } },
      { name: 'ニューベリー', label: { ja: 'ニューベリー', en: 'Newbury', fr: 'Newbury', zh: '紐伯利' } },
      { name: 'ニューカッスル', label: { ja: 'ニューカッスル', en: 'Newcastle', fr: 'Newcastle', zh: '紐卡素' } },
      { name: 'ニューマーケット', label: { ja: 'ニューマーケット', en: 'Newmarket', fr: 'Newmarket', zh: '新市場' } },
      { name: 'ソールズベリー', label: { ja: 'ソールズベリー', en: 'Salisbury', fr: 'Salisbury', zh: '梳士巴利' } },
      { name: 'サンダウン', label: { ja: 'サンダウン', en: 'Sandown', fr: 'Sandown', zh: '仙當' } },
      { name: 'ウィンザー', label: { ja: 'ウィンザー', en: 'Windsor', fr: 'Windsor', zh: '溫莎' } },
      { name: 'ヨーク', label: { ja: 'ヨーク', en: 'York', fr: 'York', zh: '約克' } },
    ],
  },
  {
    region: 'ireland',
    organization: 'hri',
    category: 'europe',
    label: { ja: 'アイルランド (Ireland)', en: 'Ireland (HRI)', fr: 'Irlande (HRI)', zh: '愛爾蘭 (HRI)' },
    courses: [
      { name: 'カラ', label: { ja: 'カラ', en: 'Curragh', fr: 'Curragh', zh: '卻拉' } },
      { name: 'レパーズタウン', label: { ja: 'レパーズタウン', en: 'Leopardstown', fr: 'Leopardstown', zh: '李奧帕斯敦' } },
      { name: 'ネース', label: { ja: 'ネース', en: 'Naas', fr: 'Naas', zh: '奈斯' } },
      { name: 'コーク', label: { ja: 'コーク', en: 'Cork', fr: 'Cork', zh: '科克' } },
      { name: 'ティペラリー', label: { ja: 'ティペラリー', en: 'Tipperary', fr: 'Tipperary', zh: '蒂珀雷里' } },
      { name: 'ダンドーク', label: { ja: 'ダンドーク', en: 'Dundalk', fr: 'Dundalk', zh: '鄧多克' } },
      { name: 'ガウランパーク', label: { ja: 'ガウランパーク', en: 'Gowran Park', fr: 'Gowran Park', zh: '高蘭公園' } },
      { name: 'フェアリーハウス', label: { ja: 'フェアリーハウス', en: 'Fairyhouse', fr: 'Fairyhouse', zh: '費利豪斯' } },
      { name: 'ナヴァン', label: { ja: 'ナヴァン', en: 'Navan', fr: 'Navan', zh: '納文' } },
    ],
  },
  {
    region: 'usa',
    organization: 'equibase',
    category: 'america',
    label: { ja: 'アメリカ (USA)', en: 'USA (Equibase)', fr: 'États-Unis (Equibase)', zh: '美國 (Equibase)' },
    courses: [
      { name: 'チャーチルダウンズ', label: { ja: 'チャーチルダウンズ', en: 'Churchill Downs', fr: 'Churchill Downs', zh: '邱吉爾園' } },
      { name: 'サラトガ', label: { ja: 'サラトガ', en: 'Saratoga', fr: 'Saratoga', zh: '薩拉托加' } },
      { name: 'ベルモントパーク', label: { ja: 'ベルモントパーク', en: 'Belmont Park', fr: 'Belmont Park', zh: '貝蒙園' } },
      { name: 'アケダクト', label: { ja: 'アケダクト', en: 'Aqueduct', fr: 'Aqueduct', zh: '雅佳特' } },
      { name: 'デルマー', label: { ja: 'デルマー', en: 'Del Mar', fr: 'Del Mar', zh: '德爾馬' } },
      { name: 'サンタアニタ', label: { ja: 'サンタアニタ', en: 'Santa Anita Park', fr: 'Santa Anita Park', zh: '聖雅尼塔' } },
      { name: 'キーンランド', label: { ja: 'キーンランド', en: 'Keeneland', fr: 'Keeneland', zh: '堅蘭' } },
      { name: 'ガルフストリームパーク', label: { ja: 'ガルフストリームパーク', en: 'Gulfstream Park', fr: 'Gulfstream Park', zh: '灣流園' } },
      { name: 'ピムリコ', label: { ja: 'ピムリコ', en: 'Pimlico', fr: 'Pimlico', zh: '賓利高' } },
      { name: 'ローレルパーク', label: { ja: 'ローレルパーク', en: 'Laurel Park', fr: 'Laurel Park', zh: '羅利爾園' } },
      { name: 'モンマスパーク', label: { ja: 'モンマスパーク', en: 'Monmouth Park', fr: 'Monmouth Park', zh: '萬滿園' } },
      { name: 'オークローンパーク', label: { ja: 'オークローンパーク', en: 'Oaklawn Park', fr: 'Oaklawn Park', zh: '奧克朗園' } },
      { name: 'ケンタッキーダウンズ', label: { ja: 'ケンタッキーダウンズ', en: 'Kentucky Downs', fr: 'Kentucky Downs', zh: '肯塔基園' } },
      { name: 'フェアグラウンズ', label: { ja: 'フェアグラウンズ', en: 'Fair Grounds', fr: 'Fair Grounds', zh: '費爾園' } },
      { name: 'タンパベイダウンズ', label: { ja: 'タンパベイダウンズ', en: 'Tampa Bay Downs', fr: 'Tampa Bay Downs', zh: '坦帕灣園' } },
      { name: 'ロスアラミトス', label: { ja: 'ロスアラミトス', en: 'Los Alamitos', fr: 'Los Alamitos', zh: '洛斯拉米托斯' } },
    ],
  },
  {
    region: 'hong_kong',
    organization: 'hkjc',
    category: 'asia',
    label: { ja: '香港 (Hong Kong)', en: 'Hong Kong (HKJC)', fr: 'Hong Kong (HKJC)', zh: '香港 (HKJC)' },
    courses: [
      { name: 'シャティン', label: { ja: 'シャティン', en: 'Sha Tin', fr: 'Sha Tin', zh: '沙田' } },
      { name: 'ハッピーバレー', label: { ja: 'ハッピーバレー', en: 'Happy Valley', fr: 'Happy Valley', zh: '跑馬地' } },
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
  fr: COURSE_GROUPS.flatMap((g) => g.courses.map((c) => ({ label: c.label.fr, name: c.name }))),
  zh: COURSE_GROUPS.flatMap((g) => g.courses.map((c) => ({ label: c.label.zh, name: c.name }))),
};

/**
 * 競馬場名（日本語、英語、フランス語、または繁体字中国語）から現在の言語の表示ラベルを取得するヘルパー
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
  const foundFr = COURSE_OPTIONS_BY_LANG.fr.findIndex((c) => c.label === courseName);
  if (foundFr !== -1) {
    return COURSE_OPTIONS_BY_LANG[lang][foundFr].label;
  }
  const foundZh = COURSE_OPTIONS_BY_LANG.zh.findIndex((c) => c.label === courseName);
  if (foundZh !== -1) {
    return COURSE_OPTIONS_BY_LANG[lang][foundZh].label;
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
  fr: {
    turf: 'Gazon',
    dirt: 'Dirt',
    obstacle: 'Obstacle',
    banei: 'Banei',
    aw: 'PSF (AW)',
  },
  zh: {
    turf: '草地',
    dirt: '泥地',
    obstacle: '跳欄',
    banei: '輓曳',
    aw: '全天候 (AW)',
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
  fr: {
    filly_and_mare: { short: 'Femelles', full: 'Femelles uniquement' },
    colt_and_filly: { short: 'Mâles/Fem.', full: 'Mâles et Femelles' },
    none: { short: null, full: 'Tous chevaux' },
  },
  zh: {
    filly_and_mare: { short: '雌', full: '雌馬限定' },
    colt_and_filly: { short: '雄・雌', full: '雄馬及雌馬' },
    none: { short: null, full: '不限性別' },
  },
};

export const ageConstraintLabels: Record<
  Language,
  Record<'2yo' | '3yo' | '3yo_and_up' | '4yo_and_up' | '4yo', { short: string; full: string }>
> = {
  ja: {
    '2yo': { short: '2歳', full: '2歳' },
    '3yo': { short: '3歳', full: '3歳' },
    '3yo_and_up': { short: '3歳上', full: '3歳以上' },
    '4yo_and_up': { short: '4歳上', full: '4歳以上' },
    '4yo': { short: '4歳', full: '4歳' },
  },
  en: {
    '2yo': { short: '2yo', full: '2yo' },
    '3yo': { short: '3yo', full: '3yo' },
    '3yo_and_up': { short: '3yo+', full: '3yo & Up' },
    '4yo_and_up': { short: '4yo+', full: '4yo & Up' },
    '4yo': { short: '4yo', full: '4yo' },
  },
  fr: {
    '2yo': { short: '2 ans', full: '2 ans' },
    '3yo': { short: '3 ans', full: '3 ans' },
    '3yo_and_up': { short: '3 ans+', full: '3 ans et plus' },
    '4yo_and_up': { short: '4 ans+', full: '4 ans et plus' },
    '4yo': { short: '4 ans', full: '4 ans' },
  },
  zh: {
    '2yo': { short: '2歲', full: '2歲' },
    '3yo': { short: '3歲', full: '3歲' },
    '3yo_and_up': { short: '3歲+', full: '3歲及以上' },
    '4yo_and_up': { short: '4歲+', full: '4歲及以上' },
    '4yo': { short: '4歲', full: '4歲' },
  },
};

export const CALENDAR_WEEKDAYS_BY_LANG: Record<Language, readonly string[]> = {
  ja: ['月', '火', '水', '木', '金', '土', '日'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  zh: ['一', '二', '三', '四', '五', '六', '日'],
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
