import { useLanguageStore, type Language } from '../store/useLanguageStore';

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
      orgSelectModalTitle: '開催国・主催者の選択',
      orgSelectModalDesc: '表示する競馬の開催団体を選択してください（複数選択可）',
      orgSelectTrigger: '開催国・主催者',
      orgTriggerAll: '全主催者',
      regionJapan: '日本',
      regionEurope: 'ヨーロッパ',
      selectAllJapan: '日本全重賞',
      selectAllEurope: '欧州全重賞',
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
      appDocTitle: '重賞カレンダー - JRA & NAR 重賞レーススケジュール',
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
      fanSiteBody: '本サービス（重賞カレンダー）は、個人が開発・運営する非公式のファンサイトです。日本中央競馬会（JRA）、地方競馬全国協会（NAR）、フランスギャロ（France Galop）、英国競馬統轄機構（BHA）、各地方競馬主催者（道営、岩手、南関東4場、金沢、愛知、笠松、兵庫、高知、佐賀、ばんえい帯広）およびその他の関連団体とは一切関係ありません。',
      dataSourceTitle: 'データの出典',
      dataSourceBody: '本アプリで掲載しているレース日程、発走予定時刻、出走条件（コース・距離・出走資格・斤量等）のデータは、JRA（日本中央競馬会）公式サイト、NAR（地方競馬全国協会）公式サイト、France Galop（PMU）公式API、および英国BHA（Sporting Life等）で一般公開されている公式情報（カレンダーファイル、重賞一覧、確定出馬表等）を取得・加工して提供しています。',
      changesTitle: '開催変更・公式発表確認の推奨と免責事項',
      changesP1: 'レースの日程、発走時刻、出走馬、斤量等の情報は、天候悪化・自然災害や主催者の都合等により、予告なく変更・中止・延期（代替開催・続行競馬等）となる場合があります。',
      changesP2: '情報の正確性・網羅性には細心の注意を払っておりますが、リアルタイム性や完全性を保証するものではありません。馬券の購入、現地観戦、遠征等の際は、必ず主催者（JRA・NAR・France Galop・BHA等）公式発表の最新情報をご確認ください。',
      changesP2Strong: '馬券の購入、現地観戦、遠征等の際は、必ず主催者（JRA・NAR・France Galop・BHA等）公式発表の最新情報をご確認ください。',
      changesP3: '本サービスの利用、または利用できなかったことにより生じたあらゆる直接的・間接的な損害・トラブル（馬券投票結果、交通・宿泊費用等を含むがこれらに限定されません）について、本サービスの開発者および運営者は一切の責任を負いません。',
      rightsTitle: '権利・商標の帰属',
      rightsBody: '本サービスに記載されているレース名、競馬場名、主催団体名等の名称、商標およびロゴ等の知的財産権は、各主催者（JRA、NAR、France Galop、BHA、各地方競馬主催者等）ならびに各権利者に帰属します。',
      analyticsTitle: 'アクセス解析ツール（Google Analytics）について',
      analyticsP1: '本サービスでは、利用状況の把握や機能改善・利便性向上のため、Google社が提供するアクセス解析ツール「Google Analytics（GA4）」を利用しています。',
      analyticsP2: 'Google Analyticsはデータの収集のためにCookie（クッキー）を使用しています。このデータは匿名で収集されており、個人を特定する情報は含まれません。',
      analyticsP3: 'データ収集を希望されない場合は、ブラウザの設定でCookieを無効化するか、Google社が提供する「Google アナリティクス オプトアウト アドオン」をご利用いただくことで拒否することが可能です。詳細についてはGoogle社の「ポリシーと規約」をご確認ください。',
    },
    footer: {
      copyright: '© 2026 horse-racing-calendar',
      unofficialNotice: '当サイトは非公式ファンサイトです。レース日程・発走時刻等の最新情報は必ず主催者（JRA・NAR・France Galop・BHA等）公式発表をご確認ください。',
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
      orgSelectModalTitle: 'Select Countries & Organizations',
      orgSelectModalDesc: 'Select racing organizations to display (multiple allowed)',
      orgSelectTrigger: 'Organizations',
      orgTriggerAll: 'All Orgs',
      regionJapan: 'Japan',
      regionEurope: 'Europe',
      selectAllJapan: 'All Japan',
      selectAllEurope: 'All Europe',
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
      appDocTitle: 'Graded Races - JRA, NAR, France Galop & UK Graded Races Calendar',
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
      fanSiteBody: 'This service (Graded Races Calendar) is an unofficial, personal fan project and has no affiliation with JRA (Japan Racing Association), NAR (National Association of Racing), France Galop, British Horseracing Authority (BHA), local racing authorities, or any official racing associations.',
      dataSourceTitle: 'Data Sources',
      dataSourceBody: 'Race schedules, post times, and race conditions (course, distance, eligibility, weight, etc.) published on this app are sourced and processed from publicly accessible official information published by JRA, NAR, France Galop (PMU), and BHA (Sporting Life).',
      changesTitle: 'Schedule Changes & Disclaimer',
      changesP1: 'Race schedules, post times, entries, and weights are subject to change, cancellation, or postponement (e.g. rescheduled races) without notice due to severe weather, contingencies, or organizer reasons.',
      changesP2: 'While every effort is made to ensure accuracy and completeness, real-time validity and completeness are not guaranteed. When purchasing betting tickets or attending races in person, please always verify official announcements from the organizers (e.g., JRA, NAR, France Galop, BHA).',
      changesP2Strong: 'When purchasing betting tickets or attending races in person, please always verify official announcements from the organizers (e.g., JRA, NAR, France Galop, BHA).',
      changesP3: 'The developer and operator assume no liability for any direct or indirect damages, losses, or issues arising from the use or inability to use this service (including but not limited to betting results, transportation, or accommodation costs).',
      rightsTitle: 'Intellectual Property & Trademarks',
      rightsBody: 'Race names, track names, organization names, trademarks, and logos displayed on this service belong to their respective rights holders (JRA, NAR, France Galop, BHA, local authorities, etc.).',
      analyticsTitle: 'Access Analytics (Google Analytics)',
      analyticsP1: 'This service uses Google Analytics (GA4) provided by Google LLC to understand usage patterns and enhance service quality and user experience.',
      analyticsP2: 'Google Analytics uses cookies to collect data. This data is collected anonymously and does not contain personally identifiable information.',
      analyticsP3: 'If you wish to opt out of data collection, you can disable cookies in your browser settings or use the "Google Analytics Opt-out Browser Add-on" provided by Google. For details, please refer to Google\'s Privacy & Terms.',
    },
    footer: {
      copyright: '© 2026 horse-racing-calendar',
      unofficialNotice: 'This is an unofficial fan site. Please always verify the latest race schedules and post times with official organizers (e.g., JRA, NAR, France Galop, BHA).',
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
      orgSelectModalTitle: 'Sélectionner pays et organisateurs',
      orgSelectModalDesc: 'Sélectionnez les organisations à afficher (sélection multiple)',
      orgSelectTrigger: 'Organisations',
      orgTriggerAll: 'Toutes',
      regionJapan: 'Japon',
      regionEurope: 'Europe',
      selectAllJapan: 'Tout le Japon',
      selectAllEurope: 'Toute l\'Europe',
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
      appDocTitle: 'Courses de Groupe - Calendrier JRA, NAR, France Galop & UK',
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
      fanSiteBody: "Ce service (Calendrier des courses de groupe) est un projet personnel non officiel. Il n'est affilié d'aucune manière à la JRA, à la NAR, à France Galop, à la British Horseracing Authority (BHA) ou à tout autre organisme de courses officiel.",
      dataSourceTitle: 'Sources des données',
      dataSourceBody: 'Les calendriers de courses, horaires de départ et conditions de course publiés proviennent des données publiques officielles publiées par la JRA, la NAR, France Galop (PMU) et la BHA (Sporting Life).',
      changesTitle: 'Modifications de calendrier & Avertissement',
      changesP1: 'Les horaires, partants et conditions de course peuvent être modifiés, annulés ou reportés sans préavis en raison des conditions météorologiques ou des décisions des organisateurs.',
      changesP2: "Bien que le plus grand soin soit apporté à l'exactitude des informations, leur temps réel et leur exhaustivité ne sont pas garantis. Veuillez toujours vérifier les annonces officielles des organisateurs (JRA, NAR, France Galop, BHA).",
      changesP2Strong: 'Veuillez toujours vérifier les annonces officielles des organisateurs (JRA, NAR, France Galop, BHA).',
      changesP3: "L'auteur de ce service décline toute responsabilité pour tout dommage direct ou indirect résultant de l'utilisation de ce service (y compris les résultats de paris, frais de transport, etc.).",
      rightsTitle: 'Propriété intellectuelle et marques',
      rightsBody: "Les noms de courses, d'hippodromes et d'organisations, ainsi que les marques et logos affichés, appartiennent à leurs titulaires de droits respectifs (JRA, NAR, France Galop, BHA, etc.).",
      analyticsTitle: "Analyse d'audience (Google Analytics)",
      analyticsP1: 'Ce service utilise Google Analytics (GA4) fourni par Google LLC pour analyser son utilisation et améliorer la qualité du service.',
      analyticsP2: 'Google Analytics utilise des cookies pour collecter des données anonymes ne contenant aucune information personnellement identifiable.',
      analyticsP3: 'Vous pouvez désactiver les cookies dans votre navigateur ou installer le module complémentaire de désactivation de Google Analytics.',
    },
    footer: {
      copyright: '© 2026 horse-racing-calendar',
      unofficialNotice: 'Ce site est un projet de fans non officiel. Veuillez toujours vous référer aux annonces officielles des organisateurs (JRA, NAR, France Galop, BHA) pour les informations les plus récentes.',
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
};

export type CourseRegion = 'jra' | 'nankanto' | 'regional' | 'banei' | 'france' | 'uk';

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
    label: { ja: '中央競馬 (JRA)', en: 'JRA (Central)', fr: 'JRA (Japon Central)' },
    courses: [
      { name: '札幌', label: { ja: '札幌', en: 'Sapporo', fr: 'Sapporo' } },
      { name: '函館', label: { ja: '函館', en: 'Hakodate', fr: 'Hakodate' } },
      { name: '福島', label: { ja: '福島', en: 'Fukushima', fr: 'Fukushima' } },
      { name: '新潟', label: { ja: '新潟', en: 'Niigata', fr: 'Niigata' } },
      { name: '東京', label: { ja: '東京', en: 'Tokyo', fr: 'Tokyo' } },
      { name: '中山', label: { ja: '中山', en: 'Nakayama', fr: 'Nakayama' } },
      { name: '中京', label: { ja: '中京', en: 'Chukyo', fr: 'Chukyo' } },
      { name: '京都', label: { ja: '京都', en: 'Kyoto', fr: 'Kyoto' } },
      { name: '阪神', label: { ja: '阪神', en: 'Hanshin', fr: 'Hanshin' } },
      { name: '小倉', label: { ja: '小倉', en: 'Kokura', fr: 'Kokura' } },
    ],
  },
  {
    region: 'nankanto',
    label: { ja: '南関東 (NAR)', en: 'Minami Kanto (NAR)', fr: 'Minami Kanto (NAR)' },
    courses: [
      { name: '浦和', label: { ja: '浦和', en: 'Urawa', fr: 'Urawa' } },
      { name: '船橋', label: { ja: '船橋', en: 'Funabashi', fr: 'Funabashi' } },
      { name: '大井', label: { ja: '大井', en: 'Oi', fr: 'Oi' } },
      { name: '川崎', label: { ja: '川崎', en: 'Kawasaki', fr: 'Kawasaki' } },
    ],
  },
  {
    region: 'regional',
    label: { ja: 'その他地方 (NAR)', en: 'Regional (NAR)', fr: 'Régional (NAR)' },
    courses: [
      { name: '門別', label: { ja: '門別', en: 'Mombetsu', fr: 'Mombetsu' } },
      { name: '盛岡', label: { ja: '盛岡', en: 'Morioka', fr: 'Morioka' } },
      { name: '水沢', label: { ja: '水沢', en: 'Mizusawa', fr: 'Mizusawa' } },
      { name: '金沢', label: { ja: '金沢', en: 'Kanazawa', fr: 'Kanazawa' } },
      { name: '笠松', label: { ja: '笠松', en: 'Kasamatsu', fr: 'Kasamatsu' } },
      { name: '名古屋', label: { ja: '名古屋', en: 'Nagoya', fr: 'Nagoya' } },
      { name: '園田', label: { ja: '園田', en: 'Sonoda', fr: 'Sonoda' } },
      { name: '姫路', label: { ja: '姫路', en: 'Himeji', fr: 'Himeji' } },
      { name: '高知', label: { ja: '高知', en: 'Kochi', fr: 'Kochi' } },
      { name: '佐賀', label: { ja: '佐賀', en: 'Saga', fr: 'Saga' } },
    ],
  },
  {
    region: 'banei',
    label: { ja: 'ばんえい (NAR)', en: 'Banei (NAR)', fr: 'Banei (NAR)' },
    courses: [
      { name: '帯広', label: { ja: '帯広', en: 'Obihiro', fr: 'Obihiro' } },
    ],
  },
  {
    region: 'france',
    label: { ja: 'フランス (France)', en: 'France', fr: 'France Galop' },
    courses: [
      { name: 'パリロンシャン', label: { ja: 'パリロンシャン', en: 'ParisLongchamp', fr: 'ParisLongchamp' } },
      { name: 'シャンティイ', label: { ja: 'シャンティイ', en: 'Chantilly', fr: 'Chantilly' } },
      { name: 'ドーヴィル', label: { ja: 'ドーヴィル', en: 'Deauville', fr: 'Deauville' } },
      { name: 'サンクルー', label: { ja: 'サンクルー', en: 'Saint-Cloud', fr: 'Saint-Cloud' } },
      { name: 'フォンテーヌブロー', label: { ja: 'フォンテーヌブロー', en: 'Fontainebleau', fr: 'Fontainebleau' } },
      { name: 'トゥールーズ', label: { ja: 'トゥールーズ', en: 'Toulouse', fr: 'Toulouse' } },
      { name: 'ヴィシー', label: { ja: 'ヴィシー', en: 'Vichy', fr: 'Vichy' } },
      { name: 'ボルドー', label: { ja: 'ボルドー', en: 'Bordeaux', fr: 'Bordeaux' } },
      { name: 'マルセイユボレリー', label: { ja: 'マルセイユボレリー', en: 'Marseille-Borely', fr: 'Marseille-Borély' } },
      { name: 'リヨン', label: { ja: 'リヨン', en: 'Lyon', fr: 'Lyon' } },
      { name: 'クラオン', label: { ja: 'クラオン', en: 'Craon', fr: 'Craon' } },
      { name: 'クレールフォンテーヌ', label: { ja: 'クレールフォンテーヌ', en: 'Clairefontaine', fr: 'Clairefontaine' } },
      { name: 'コンピエーニュ', label: { ja: 'コンピエーニュ', en: 'Compiegne', fr: 'Compiègne' } },
      { name: 'ラテスト', label: { ja: 'ラテスト', en: 'La Teste', fr: 'La Teste' } },
      { name: 'ナント', label: { ja: 'ナント', en: 'Nantes', fr: 'Nantes' } },
      { name: 'カーニュ・シュル・メール', label: { ja: 'カーニュ・シュル・メール', en: 'Cagnes-sur-Mer', fr: 'Cagnes-sur-Mer' } },
    ],
  },
  {
    region: 'uk',
    label: { ja: 'イギリス (UK)', en: 'UK (BHA)', fr: 'Royaume-Uni (BHA)' },
    courses: [
      { name: 'アスコット', label: { ja: 'アスコット', en: 'Ascot', fr: 'Ascot' } },
      { name: 'エアー', label: { ja: 'エアー', en: 'Ayr', fr: 'Ayr' } },
      { name: 'チェスター', label: { ja: 'チェスター', en: 'Chester', fr: 'Chester' } },
      { name: 'ドンカスター', label: { ja: 'ドンカスター', en: 'Doncaster', fr: 'Doncaster' } },
      { name: 'エプソム', label: { ja: 'エプソム', en: 'Epsom', fr: 'Epsom' } },
      { name: 'グッドウッド', label: { ja: 'グッドウッド', en: 'Goodwood', fr: 'Goodwood' } },
      { name: 'ヘイドック', label: { ja: 'ヘイドック', en: 'Haydock', fr: 'Haydock' } },
      { name: 'ケンプトン', label: { ja: 'ケンプトン', en: 'Kempton', fr: 'Kempton' } },
      { name: 'リングフィールド', label: { ja: 'リングフィールド', en: 'Lingfield', fr: 'Lingfield' } },
      { name: 'ニューベリー', label: { ja: 'ニューベリー', en: 'Newbury', fr: 'Newbury' } },
      { name: 'ニューカッスル', label: { ja: 'ニューカッスル', en: 'Newcastle', fr: 'Newcastle' } },
      { name: 'ニューマーケット', label: { ja: 'ニューマーケット', en: 'Newmarket', fr: 'Newmarket' } },
      { name: 'ソールズベリー', label: { ja: 'ソールズベリー', en: 'Salisbury', fr: 'Salisbury' } },
      { name: 'サンダウン', label: { ja: 'サンダウン', en: 'Sandown', fr: 'Sandown' } },
      { name: 'ウィンザー', label: { ja: 'ウィンザー', en: 'Windsor', fr: 'Windsor' } },
      { name: 'ヨーク', label: { ja: 'ヨーク', en: 'York', fr: 'York' } },
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
};

/**
 * 競馬場名（日本語、英語、またはフランス語）から現在の言語の表示ラベルを取得するヘルパー
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
  fr: {
    '2yo': { short: '2 ans', full: '2 ans' },
    '3yo': { short: '3 ans', full: '3 ans' },
    '3yo_and_up': { short: '3 ans+', full: '3 ans et plus' },
    '4yo_and_up': { short: '4 ans+', full: '4 ans et plus' },
  },
};

export const CALENDAR_WEEKDAYS_BY_LANG: Record<Language, readonly string[]> = {
  ja: ['月', '火', '水', '木', '金', '土', '日'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
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
