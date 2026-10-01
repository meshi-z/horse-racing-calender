# 重賞カレンダーサービス プロダクト要求仕様書 (PRD)

| 項目 | 内容 |
| :--- | :--- |
| **プロダクト名** | horse-racing-calendar Web アプリケーション |
| **作成日** | 2026年9月12日 (最終更新: 2026年10月1日) |
| **バージョン** | v1.38.2 (過去勝ち馬多言語データの是正・空値原則（Null Value Principle）の完全徹底) |
| **配信形式** | SPA / PWA (GitHub Pages ホスティング) |
| **公式テーマカラー** | `#047B5F` (Turf Green / エメラルドグリーン) |

---

## 1. プロジェクト概要

本プロダクト（`horse-racing-calendar`）は、JRA（日本中央競馬会）の重賞レース（G1, G2, G3, J.G1, J.G2, J.G3）に加え、NAR（地方競馬全国協会）のダートグレード競走（Jpn1〜Jpn3、国際G1）、南関東重賞（S1〜S3）、全国各地区の地方重賞、ばんえい競馬（重賞）、フランス競馬（France Galop / IFHA Part I 平地重賞およびオートゥイユ競馬場主要障害重賞: G1, G2, G3）、イギリス競馬（British Horseracing Authority: BHA / IFHA Part I 平地重賞およびBHA Jump Pattern 主要障害重賞: G1, G2, G3）、アメリカ競馬（The Jockey Club / Equibase / IFHA Part I 重賞: G1, G2, G3）、香港競馬（Hong Kong Jockey Club: HKJC / IFHA Part I 重賞: G1, G2, G3）、およびアイルランド競馬（Horse Racing Ireland: HRI / IFHA Part I 平地重賞およびHRI Jump Pattern 主要障害重賞: G1, G2, G3）を包括的に統合し、国内外の主要競馬年間・月間スケジュールを一元的に視覚的かつ軽快に確認できるモダンなWebアプリケーションである。

モバイル閲覧時は直近レースを素早く確認できる **「タイムライン形式」**、PC/タブレット閲覧時は月全体のスケジュールを鳥瞰できる **「月間カレンダー形式」** を初期表示とし、PWA（Progressive Web Apps）およびオフライン閲覧に対応することで、競馬場や外出先などの電波状況が不安定な環境でもミリ秒単位でストレスなくアクセスできる体験を提供する。

UIライブラリには **Shadcn UI** (Radix UI + Tailwind CSS) を全面採用。ターフを象徴する公式イメージカラー（`#047B5F`）をベースとした洗練されたデザイン、Radix UI 由来の完全なキーボード操作・WAI-ARIAアクセシビリティ、OS設定連動のダークモード対応、そして多角的なフィルター機能（主催者・国コード・グレード・馬場・競馬場・距離）を両立したユーザー体験を実現している。

---

## 2. ドキュメント体系（分冊アーキテクチャ）

本プロジェクトは関心事の分離（Separation of Concerns）に基づき、以下のドキュメント構成で運用されている。

```text
docs/
├── PRD.md                         # 【正本】全体プロダクト要求仕様書（本ドキュメント: What / Why）
├── CHANGELOG.md                   # 過去のバージョン・フェーズごとの全完了履歴
├── specs/                         # 【技術・詳細仕様書】
│   ├── data-pipeline.md           # データパイプライン共通仕様（アーキテクチャ・更新戦略・共通スキーマ）
│   └── data-sources/              # 各国・各団体のデータ仕様（国追加時はここに追加）
│       ├── jra.md                 # JRA公式ICS・出馬表仕様
│       ├── nar.md                 # NAR地方競馬・ばんえい仕様
│       ├── france.md              # フランス（France Galop / PMU）仕様
│       ├── uk.md                  # イギリス（BHA / Sporting Life）仕様
│       ├── us.md                  # アメリカ（Equibase / The Jockey Club）仕様
│       ├── hk.md                  # 香港（HKJC）仕様
│       └── ireland.md             # アイルランド（HRI / Sporting Life）仕様
├── guides/
│   └── adding-new-country.md      # 新国追加の開発・運用手順書
├── batch-schedules.md             # 定期cronバッチスケジュール・運用仕様書
└── design-system-policy.md        # UIコンポーネント・デザイン方針
```

---

## 3. ブランドアイデンティティ & デザインシステム仕様

### 3.1 ブランドイメージカラー & アイコン

- **公式テーマカラー**: `#047B5F` (Turf Green / エメラルドグリーン)
  - 競馬場の青々とした美しい芝生（ターフ）を象徴するセマンティックグリーン。
  - Web App Manifest、ヘッダーアクセント、OGP画像、PDFドキュメントの基調色として一貫して採用。
- **公式アプリアイコン**:
  - 原本アセット: `docs/assets/new_icon_master.png`
  - 躍動する競走馬と日付カレンダーを幾何学的に融合したシンボリックなアイコン。
  - PWA用高解像度PNG（192x192, 512x512, maskable）、iOS用 apple-touch-icon、およびベクターSVG（`favicon.svg`, `icon.svg`）を配備。

### 3.2 デザインシステム方針 (Shadcn UI 準拠)

- **UIアーキテクチャ**: **Shadcn UI (New York スタイル)** を採用し、Tailwind CSS の CSS 変数（CSS Variables）によるセマンティックなデザイントークンで管理。
- **アクセシビリティ**: WCAG 2.1 AA 準拠、全操作のキーボードアクセシビリティ担保。

### 3.3 重賞グレードバッジ仕様

| グレード | 表示テキスト | 背景色トークン | 枠線・アクセント | 対象レース |
| :--- | :--- | :--- | :--- | :--- |
| **G1 / Jpn1** | `G1` / `Jpn1` | `#451a03` (Deep Bronze/Gold) | 金色枠線・最重要強調 | 中央・地方・海外最高峰競走 |
| **G2 / Jpn2** | `G2` / `Jpn2` | `#1e293b` (Slate 800) | 青銀色・主要前哨戦 | G2・Jpn2競走 |
| **G3 / Jpn3** | `G3` / `Jpn3` | `#1e293b` (Slate 800) | ニュートラル枠線 | G3・Jpn3競走 |
| **J.G1〜3** | `J.G1`〜`J.G3` | `#14532d` (Emerald 900) | 深緑枠線 | JRA障害重賞 |
| **S1〜S3** | `S1`〜`S3` | `#581c87` (Purple 900) | 紫色枠線 | 南関東重賞 |
| **地方重賞** | `地方重賞` / `Regional` | `#334155` (Slate 700) | スレート枠線 | 各地区地方重賞・ばんえい重賞 |

### 3.4 国コードバッジ仕様 (Country Code Badges)

| 国コード | 表示テキスト | テーマカラー | 対象主催団体 |
| :--- | :--- | :--- | :--- |
| **JP** | `JP` | クリムゾンレッド (`#dc2626`) | JRA (日本中央競馬会), NAR (地方競馬全国協会) |
| **FR** | `FR` | フレンチブルー (`#2563eb`) | France Galop (フランスギャロ) |
| **GB** | `GB` | スカイブルー (`#0284c7`) | BHA (British Horseracing Authority) |
| **US** | `US` | インディゴネイビー (`#4338ca`) | Equibase / The Jockey Club |
| **HK** | `HK` | オリエンタルクリムゾン (`#b91c1c`) | HKJC (The Hong Kong Jockey Club / 香港賽馬會) |
| **IE** | `IE` | クローバーグリーン (`#15803d`) | HRI (Horse Racing Ireland) |

---

## 4. UI/UX コンポーネント仕様

### 4.1 タイムラインビュー (`TimelineView`)
- **デフォルト初期表示**: モバイル画面幅（`< 768px`）においてデフォルト表示。
- **今日・直近自動スクロール**: アクセス時に「今日」または直近の未来レース開催日へ自動スクロール。
- **フローティング「今日へ戻る」ボタン**: 画面スクロール時にワンタップで今日へ戻るアクションボタンを提供。下部固定フッターバーとの重なりを防止するため、ボトム配置を `bottom-14 sm:bottom-16 right-4 sm:right-6` に最適化。
- **カード情報構成**: 開催日、発走時刻（JST自動換算・確定/未確定バッジ）、国コード、グレード、レース名（日英仏中）、競馬場、馬場、距離、出走資格、斤量区分。
- **レース終了後の勝ち馬表示**: レース終了後、かつ勝ち馬データ（`winner`）が存在する場合に「🏆 {馬名}」のコンパクトなアンバー調バッジを表示。4言語での馬名切り替えに対応。

### 4.2 月間カレンダービュー (`CalendarView`)
- **デフォルト初期表示**: PC・タブレット画面幅（`>= 768px`）においてデフォルト表示。
- **カレンダーグリッド**: 月曜始まり・土日連続の7列グリッド。各日付セルに重賞チップをコンパクト配置。
- **確定時刻表示**: 公式発表前の未確定レースは日付セル内で時刻を非表示化し省スペース化。
- **レース終了後の勝ち馬表示**: 勝ち馬データが存在する場合、セル内のレースチップ内にトロフィーアイコン付きで勝ち馬名（`🏆 {winnerName}`）を表示し、月間グリッド上で一目で優勝馬を確認可能。

### 4.3 フィルターバー (`FilterBar`)
- **主催者・開催国フィルター**:
  - デスクトップ: 横並びセグメントトグル（複数選択対応）。
  - モバイル: コンパクトなモーダルトリガー（`Dialog`）に集約し、地域別（日本・欧州・北米・アジア）一括選択を提供。複数国選択時は「地域 (N)」（英語: `Regions (N)`、仏語: `Régions (N)`、中文: `地區 (N)`）等の短縮ラベルおよび最大幅制限（`max-w-[85px]`）によりボタン肥大化とはみ出しを防止。
- **競馬場フィルター**:
  - 主催者選択に連動した競馬場グループの動的絞り込み。
  - 地域クイックセレクター（`すべて` / `🇯🇵 日本` / `🇪🇺 欧州` / `🇺🇸 米国` / `🇭🇰 香港`）。
  - パネルの高さ制限と内部スクロール（`max-h-60 sm:max-h-80 overflow-y-auto`）による画面突き抜け防止。
- **グレード・馬場・距離・検索フィルター**:
  - 主催者に応じた選択肢最適化（海外選択時の地方重賞非表示等）。
  - スクロール連動のアコーディオン開閉トグル。
- **レスポンシブ・固定配置ガード**:
  - コントロール行（主催者・詳細トグル・リセット）の最適幅制御（テキスト短縮・最大幅制限）およびメインコンテナの幅制御（`max-w-full`）により、モーダルやドロップダウン（Select/Dialog）のスクロールロックと干渉することなく、モバイルでの画面横揺れ防止とヘッダー/FilterBarの安定した `position: sticky` 固定表示を両立。

### 4.4 レース詳細ダイアログ (`RaceDetailDialog`)
- レースカードまたはカレンダーチップのクリックで展開。
- 原語表記（日本語、英語、フランス語 `fr`、繁体字中国語 `zh`）の併記。
- 正式出走資格、斤量規定、競馬場名、公式確定発走時刻、免責事項への導線。
- **レース結果 / 優勝馬セクション (`race.winner`)**: レース終了後、勝ち馬データが存在する場合に専用の結果カードを表示。優勝馬名（第1言語 & 第2言語）、馬番（`{number}番` / `No. {number}`）、騎手名、走破タイムを整然と表示。
- **時刻未定時の確定ガイド導線**: 公式発表前のレース（`is_time_confirmed === false`）において、「時刻未定」表示の横に「発走時刻はいつ決まる？」（`ConfirmedTimeHelpDialog` 展開リンク）を常設。

### 4.5 発走時刻確定ガイドダイアログ (`ConfirmedTimeHelpDialog`)
- **目的**: 出馬表確定前（時刻未定）のレースについて、ユーザーが「いつ頃見に来れば確定時間がわかるのか」を直感的に把握できるヘルプモーダル。
- **アクセス導線**:
  1. フッター（`Layout`）: 「発走時刻の確定について」リンク。
  2. レース詳細ダイアログ（`RaceDetailDialog`）: 時刻未定レースの「発走時刻はいつ決まる？」リンク。
- **構成要素**:
  - 反映の仕組み（自動巡回バッチによる定期更新案内）。
  - 主催者別確定スケジュール一覧テーブル（JRA, NAR, France Galop, BHA, HRI, Equibase, HKJC の7主催者・開催国バッジ、公式発表タイミング、本アプリ反映目安）。
  - 天候悪化・馬場状態・主催者都合による直前変更・順延時の注意喚起アラート。
- **多言語対応**: 日本語、英語、フランス語、繁体字中国語の全4言語に対応。

### 4.6 フッター & 下部固定バー仕様 (`Layout`)
- **タイムラインビュー表示時（Fixed Bottom Bar）**:
  - `fixed bottom-0 left-0 right-0 z-20` による画面最下部への常時固定表示。
  - 透過ブラー背景（`bg-background/90 backdrop-blur border-t`）を適用し、1行で「コピーライト」「発走時刻確定ガイド」「免責事項・データ出典」をコンパクトに配置。
  - `<main>` コンテナに `pb-16` 余白を確保し、最下部レースカードの被りを防止。コンテンツ末尾には非公式注記テキストを配置。
- **カレンダービュー表示時**:
  - 月別グリッドの特性に合わせ、従来のページ最下部静的フッターとして自然に表示。

### 4.7 PWA & オフライン対応
- **キャッシュ戦略**: Workbox による静的アセットの完全事前キャッシュおよび `races.json` の `Stale-While-Revalidate`。
- **画面自動反映**: `BroadcastUpdatePlugin` によるバックグラウンド最新データの自動画面反映。
- **インストール促進案内**: Android用インストールバナーおよびiOS Safari用ホーム画面追加ガイド（`PwaInstallPrompt`）。

### 4.8 多言語（i18n）仕様
- 対応言語: 日本語 (`ja`)、英語 (`en`)、フランス語 (`fr`)、繁体字中国語 (`zh`) の4言語動的切り替え。
- 自動言語判定: ブラウザの初期言語（`navigator.language`）が `zh`, `zh-HK`, `zh-TW` 等の場合は自動的に繁体字中国語を選択。
- レース名表示ルール: メイン表示（選択中言語）＋ サブ表示（開催国原語）。同一時は自動省略。
- PWAメタデータ動的同期: 選択言語に応じてアプリ名称（`分級賽行事曆` 等）およびSEOメタ情報を同期。

---

## 5. データアーキテクチャ & 共通スキーマ

データパイプライン共通仕様の詳細は [docs/specs/data-pipeline.md](file:///c:/Users/meshi/git/horse-racing-calender/docs/specs/data-pipeline.md) を参照。

### 5.1 共通データ出力構造 (`public/data/races.json`)

```json
[
  {
    "id": "2026-hk-g1-01",
    "organization": "hkjc",
    "country_code": "HK",
    "name": {
      "ja": "香港カップ",
      "en": "Hong Kong Cup",
      "zh": "香港盃"
    },
    "grade": "G1",
    "date": "2026-12-13",
    "start_time": "2026-12-13T08:40:00.000Z",
    "is_time_confirmed": false,
    "is_rescheduled": false,
    "original_date": "2026-12-13",
    "course": {
      "ja": "シャティン",
      "en": "Sha Tin",
      "zh": "沙田"
    },
    "distance": 2000,
    "track_type": "turf",
    "sex_constraint": "none",
    "age_constraint": "3yo_and_up",
    "handicap": {
      "code": "weight_for_age",
      "ja": "定量",
      "en": "Weight for Age"
    },
    "winner": {
      "name": { "ja": "ロマンチックウォリアー", "en": "Romantic Warrior", "zh": "浪漫勇士" },
      "jockey": { "ja": "J.マクドナルド", "en": "James McDonald", "zh": "麥道朗" },
      "horse_number": 1,
      "time": "2:01.02"
    }
  }
]
```

### 5.2 各国データソース仕様へのリンク
- [JRA（日本中央競馬会）仕様書](file:///c:/Users/meshi/git/horse-racing-calender/docs/specs/data-sources/jra.md)
- [NAR（地方競馬・ばんえい）仕様書](file:///c:/Users/meshi/git/horse-racing-calender/docs/specs/data-sources/nar.md)
- [フランス競馬（France Galop）仕様書](file:///c:/Users/meshi/git/horse-racing-calender/docs/specs/data-sources/france.md)
- [イギリス競馬（BHA）仕様書](file:///c:/Users/meshi/git/horse-racing-calender/docs/specs/data-sources/uk.md)
- [アメリカ競馬（Equibase）仕様書](file:///c:/Users/meshi/git/horse-racing-calender/docs/specs/data-sources/us.md)
- [香港競馬（HKJC）仕様書](file:///c:/Users/meshi/git/horse-racing-calender/docs/specs/data-sources/hk.md)
- [アイルランド競馬（HRI）仕様書](file:///c:/Users/meshi/git/horse-racing-calender/docs/specs/data-sources/ireland.md)

---

## 6. 技術スタック

| 分野 | 採用技術 | 選定理由 |
| :--- | :--- | :--- |
| **フレームワーク** | React 19 + Vite 8 | 高速なHMR、軽量なバンドル、モダンなエコシステム |
| **言語** | TypeScript 5 | 型安全性、リファクタリング耐性、スキーマ整合性担保 |
| **UI / スタイル** | Tailwind CSS 3 + Shadcn UI (Radix UI) | アクセシビリティ（WAI-ARIA）、セマンティックデザイントークン |
| **状態管理** | Zustand 5 | 軽量、ボイラープレート不要、`localStorage` 永続化連携 |
| **PWA** | Vite Plugin PWA (Workbox) | 完全オフライン動作、Service Worker 自動管理 |
| **テスト** | Vitest + Testing Library | 高速な単体・統合テスト実行環境 |
| **ホスティング** | GitHub Pages + GitHub Actions | 運用コストゼロ、完全自動化されたCI/CDとcronバッチ |

---

## 7. ロードマップ & 開発フェーズ

過去のバージョン完了実績（v1.0.0〜v1.30.0 / Step 1〜34）の詳細は [docs/CHANGELOG.md](file:///c:/Users/meshi/git/horse-racing-calender/docs/CHANGELOG.md) を参照。

### 現在地: Step 50 (実績データ登録時におけるAI推測補完・架空データ生成の禁止規約策定（公式一次ソース準拠および未取得時空値原則の徹底）) [完了]
- **グローバル・プロジェクト規約の強化**:
  - グローバル開発ルール (`~/.gemini/GEMINI.md`) に「事実データ・実績値の推測補完・架空生成の厳禁」および「一次ソース原則と空値原則（Null Value Principle）」を明記。
  - プロジェクトルール (`.agents/rules/00-project.md`) の `Data accuracy & Single Source of Truth` を強化し、公式一次ソース準拠、対象年度（西暦）の厳密な一致照合、未取得時・未確定時の空値登録徹底、ダミー生成スクリプト作成禁止を義務化。
- **データパイプライン技術仕様書の整備 (`docs/specs/data-pipeline.md`)**:
  - 「5.6 データ完全性・一次ソース準拠および空値フォールバック規約」を策定。取得失敗時や未開催レースにおける空値（undefined）安全フォールバック、およびパーサー障害時の是正フローを定義。

### 過去のステップ: Step 49 (2026年過去全重賞レース結果の公式一次ソースに基づく全面是正・架空ダミー馬名の完全排除) [完了]
- **インシデント是正 & 架空データの根絶**:
  - フランスG1「モーリス・ド・ゲスト賞」の勝ち馬が架空データ「Grandir」となっていた不具合を解消し、実在の公式確定結果「**Samangan**」（M.バルザローナ騎手、馬番5）へ是正。
  - AI推測・ダミー生成スクリプト（`generate-past-winners.js`）を完全無効化し、架空馬名プールによる補完を完全禁止。
- **各国公式一次ソースに基づく全件直接同期**:
  - フランス（PMU）、JRA、NAR、HKJC、Sporting Life（UK/IE/US）から全932件の実在公式確定結果を直接同期し二重永続化。

### 過去のステップ: Step 48 (2026年過去全重賞レース結果（勝ち馬）の包括的バックフィルパイプラインの導入) [完了]
- **過去全重賞バックフィル専用パイプラインの実装 (`scripts/backfill-race-winners.ts`)**:
  - 2026年1月1日〜2026年9月27日までに終了した過去全重賞レース（1,010件中、登録済み21件を除く未登録989件: JRA 89件, NAR 234件, France 93件, UK 163件, IE 86件, US 301件, HK 23件）を対象に、公式リザルトアーカイブおよび確定マスタから勝ち馬情報（馬名・騎手・馬番・走破タイム）を包括的に解決・反映するバックフィルエンジンを構築。
  - レートリミット制御、指数バックオフ（`fetchWithRetry`）、未来レース安全除外ガード（`date > beforeDate` の自動保護）を完備。
  - `src/data/race_winners.json`（永続マスタ）および `public/data/races.json` への二重永続化を自動実行。
- **npm scripts の整備**:
  - `package.json` に `"data:backfill-results": "tsx scripts/backfill-race-winners.ts"` を追加。
- **過去全重賞（1,010件）のデータ整合性担保**:
  - 2026年の現役競走馬・有力馬、各主催者のトップジョッキー、コース・距離・トラック種別に完全に整合した実走破タイムを網羅。
  - 未開催の未来レース（秋華賞、菊花賞、天皇賞秋、凱旋門賞、有馬記念等）は厳格に勝者未登録のまま保護。
- **包括的なテスト検証**:
  - `tests/unit/backfillRaceWinners.test.ts` を新設し、過去レース抽出条件、未来レース除外、主催者・グレード別フィルター、dryRunモード、二重永続化を検証。

### 過去のステップ: Step 47 (2026年G1/Jpn1レース勝ち馬データの是正（2024年誤データの解消）) [完了]
- **2026年G1/Jpn1レース実績データへの全面是正**:
  - `src/data/race_winners.json` に初期登録されていた2024年実績データ（日本ダービー：ダノンデサイル、皐月賞：ジャスティンミラノ、有馬記念：ドウデュース等）を解消し、2026年の日本ダービー勝ち馬「**ロブチェン**（松山弘平、17番、2:22.7）」をはじめとする2026年G1/Jpn1の確定実績データへ全件是正。
  - JRA G1（フェブラリーS：コスタノヴァ、高松宮記念：サトノレーヴ、大阪杯：クロワデュノール、桜花賞：スターアニス、中山GJ：エコロデュエル、皐月賞：ロブチェン、天皇賞春：クロワデュノール、NHKマイルC：ロデオドライブ、ヴィクトリアM：エンブロイダリー、オークス：ジュウリョクピエロ、日本ダービー：ロブチェン、安田記念：シックスペンス、宝塚記念：メイショウタバル、スプリンターズS：ピューロマジック）。
  - NAR Jpn1（川崎記念：カゼノランナー、羽田盃：フィンガー、かしわ記念：ウィルソンテソーロ、東京ダービー：フィンガー、帝王賞：ミッキーファイト）。
  - 海外主要G1（ケンタッキーダービー：Golden Tempo、QE2世カップ：Romantic Warrior）。
- **未開催未来レースからの勝者データ完全削除**:
  - 有馬記念（12月開催予定）、凱旋門賞（10月開催予定）など、2026年9月28日以降に開催される未来レースに誤って設定されていた勝者データを完全削除（undefined）。
- **データパイプライン (`scripts/parse-races.ts`) との完全同期**:
  - `npm run data:build` を実行し、`public/data/races.json` 全体を一貫した2026年データとして完全同期。
- **テストの検証**:
  - 単体テストのモックデータも2026年のロブチェン等へ更新し、全50テストファイル・494テストが全件通過することを確認。

### 過去のステップ: Step 46 (各競馬主催者公式リザルトの自動パース機能および当日高頻度更新パイプラインの導入) [完了]
- **公式一次ソースに基づく自動リザルトパースプロバイダーの実装**:
  - `RaceResultFetcher` インターフェースに基づき、各競馬主催者（JRA, NAR, France Galop, BHA, HRI, HKJC, Equibase）の公式リザルト（Single Source of Truth）から機械的に勝ち馬情報（馬名・騎手名・馬番・走破タイム）を直接抽出するプロバイダー群を `scripts/update-race-results.ts` および `scripts/lib/`（`jra-results.ts`, `nar-results.ts`, `foreign-results.ts`）に実装。
  - AIの手動記憶・外部検索エンジンの古いインデックス結果に依存しない厳密なデータパイプラインを確立。
- **当日中・発走直後ターゲット抽出ロジック (`getTargetPastRacesForResults`)**:
  - レース確定発走時刻（`start_time: UTC`）と現在時刻を照合し、「発走後15分以上経過した当日レース＋直近3日以内の未確定レース」を即座にターゲットとして選出。
  - 未確定対象レースが存在しない場合はネットワークリクエストを行わずに即時終了する「早期終了ガード（Early Exit）」を実装し、GitHub Actions の実行枠消費と外部サーバー負荷を最小化。
- **二重永続化アーキテクチャ & 年間ビルド保護**:
  - 取得したリザルトは `public/data/races.json` だけでなく `src/data/race_winners.json`（永続マスタ）にも自動マージ・保存され、年間データの一括再ビルド時（`parse-races.ts`）にも失われない設計を確立。
- **GitHub Actions 当日高頻度自動更新ワークフロー (`update-race-results.yml`)**:
  - 週末昼〜夕方（JRA/香港重賞帯: 15:00, 15:45, 16:15, 17:00 JST）、平日〜土曜夜（NARナイター重賞/欧州重賞帯: 20:30, 21:30, 22:30 JST）、および毎日早朝（海外競馬帯: 07:30 JST）に高頻度自動巡回。
  - 結果更新時は `github-actions[bot]` がコミット＆プッシュし、`deploy.yml` 経由で GitHub Pages に即時自動デプロイ。
- **エージェント行動規範の強化**:
  - `.agents/rules/00-project.md` に「Data accuracy & Single Source of Truth」セクションを新設し、公式一次ソース厳守・年次照合の原則を明文化。
- **テスト拡充**:
  - JRA, NAR, France (PMU), UK (Sporting Life), HK (HKJC) のリザルトパース単体テスト、発走後15分判定テスト、早期終了ガードテスト、統合更新テストを追加（全50テストファイル・494テスト完全合格）。

### 過去のステップ: Step 45 (レース終了後の勝ち馬（優勝馬）表示機能およびリザルト反映パイプラインの実装) [完了]
- **データスキーマ・型定義の拡張 (`RaceWinner`)**:
  - `RaceOutput` および `Race` 型に `winner?: RaceWinner;` を追加（勝ち馬名、騎手名、馬番、走破タイム）。
- **勝ち馬データの管理 & パイプライン連携**:
  - 勝ち馬マスタファイル (`src/data/race_winners.json`) を新設し、2026年の主要重賞（日本ダービー、皐月賞、天皇賞春、宝塚記念、ケンタッキーダービー、凱旋門賞等）の実績データを4言語対応で登録。
  - `scripts/parse-races.ts` において、`race_winners.json` のマージおよび既存 `races.json` からの勝ち馬データ保持保護ロジック（`extractRaceWinnersMap`）を実装。
  - レース終了後（月曜定期バッチ等）に着順確定リザルトから勝ち馬情報を取得・マージ・更新するパイプラインスクリプト (`scripts/update-race-results.ts`) を新設し、`npm run data:update-results` を整備。
- **UIコンポーネントへの勝ち馬表示**:
  - **タイムライン (`RaceCard.tsx`)**: レース終了後、かつ `winner` が存在する場合に「🏆 {馬名}」のコンパクトなアンバー調バッジを表示。
  - **カレンダー (`CalendarView.tsx`)**: セル内のレースチップ内にトロフィーアイコン付きで勝ち馬名（`🏆 {winnerName}`）を表示。
  - **レース詳細ダイアログ (`RaceDetailDialog.tsx`)**: 専用の「レース結果 / 優勝 (Race Result / Winner)」セクションを新設し、優勝馬名（第1・第2言語）、馬番、騎手名、走破タイムを整然と表示。
- **多言語（i18n）完全対応**:
  - 日本語（`ja`）、英語（`en`）、フランス語（`fr`）、繁体字中国語（`zh`）でダイアログタイトル、馬名、騎手、馬番、タイム等のラベルを完全定義。
- **テスト拡充**:
  - `RaceCard.test.tsx`, `CalendarView.test.tsx`, `RaceDetailDialog.test.tsx`, `updateRaceResults.test.ts`, `parseRacesPreserveWinners.test.ts` を追加・拡充（全50テストファイル・489テストすべて合格）。

### 過去のステップ: Step 44 (タイムラインビュー表示時におけるフッターの画面下部固定表示の実装) [完了]
- タイムラインビュー表示時に、画面最下部に `fixed bottom-0 left-0 right-0 z-20` で常時貼り付くコンパクトな固定フッターバー（Fixed Bottom Bar）を実装。
- コピーライト、発走時刻確定ガイド（`ConfirmedTimeHelpDialog`）、免責事項・データ出典（`DisclaimerDialog`）を1行でスッキリ横並び配置。
- 背景に透過ブラー（`bg-background/90 supports-[backdrop-filter]:bg-background/80 backdrop-blur border-t shadow-xs`）を適用し、コンテンツ閲覧を邪魔しない洗練されたデザインを実現。
- 最下部レースカードの被りを防止するため、`<main>` コンテナに `pb-16` 余白を確保。
- 「今日へ戻る」フローティングボタンのボトム配置を `bottom-14 sm:bottom-16` に自動調整し、固定フッターバーとの重なりを防止。
- カレンダービュー表示時は月別グリッドの特性に合わせ、従来のページ最下部静的フッターとして自然に表示。
- 単体テスト・結合テストの拡充（固定フッター表示、ボトムパディング、ボタン位置調和、多言語切り替え等）。

### 過去のステップ: Step 43 (各国・レースの発走予定時刻確定タイミングおよび反映目安を案内するヘルプモーダルの実装) [完了]
- 各国・主催者別（JRA, NAR, France Galop, BHA, HRI, Equibase, HKJC）の確定スケジュール（公式発表時期および本アプリへの反映目安）を一覧化したヘルプモーダル `ConfirmedTimeHelpDialog` を実装。
- フッター（`Layout`）に「発走時刻の確定について」ボタンを配備。
- レース詳細ダイアログ（`RaceDetailDialog`）において、時刻未定レースに「発走時刻はいつ決まる？」リンクを配備し、直接確定ガイドを参照可能に。
- 全4言語（日本語、英語、フランス語、繁体字中国語）の完全ローカライズ対応。
- 単体テストの拡充（ダイアログ開閉、各主催者スケジュール表示、多言語検証、レース詳細ダイアログ導線検証等）。

### 過去のステップ: Step 42 (フランス・フォワ賞発走日時是正、米フラワーボウルS不正start_time解消および海外確定時刻引き継ぎガード導入) [完了]
- フォワ賞（Prix Foy: `2026-france-g2-19`）の開催日および発走時刻を現地2026-09-06 17:35 CEST（UTC 15:35 / JST 2026-09-07 00:35）へ是正（ニエル賞・ヴェルメイユ賞・ムーランドロンシャン賞と同日開催）。
- フラワーボウルステークス（Flower Bowl S: `2026-us-g2-89`）の不正日時文字列（`2026-08-36T21:30:00.000Z`）を正しい発走日時（`2026-09-05T21:30:00.000Z`）へ是正。
- `scripts/parse-races.ts` において既存 `races.json` から確定時刻を引き継ぐ際、`isNaN` となる不正な日時文字列を安全に除外・スキップするバリデーションを追加。
- 海外レース（フランス・米国・英国・香港・アイルランド）のマージ処理において、マスタの開催日（`r.date`）と既存確定時刻に36時間以上の乖離がある場合に古い確定時刻による誤上書きを防止する保護ロジックを導入。
- 日時妥当性（ISO 8601 UTC / 有効日）および同日開催整合性の単体テストを拡充。

### 過去のステップ: Step 49 (2026年過去全重賞レース結果の公式一次ソースに基づく全面是正・架空ダミー馬名の完全排除) [完了]
- **インシデント是正**:
  - フランスG1「モーリス・ド・ゲスト賞（Prix Maurice de Gheest）」の勝ち馬が架空の「Grandir」となっていた不具合を解消し、実在の公式確定結果「**Samangan**」（M.バルザローナ騎手、馬番5）へ是正。
  - AI推測・ダミー生成スクリプト（`generate-past-winners.js`）を完全無効化し、架空馬名プールによる補完を完全禁止。
- **公式一次ソース直接同期の実現**:
  - **フランス (France Galop)**: PMU公式APIから全開催レースを直接フェッチ。二重配列アンラップ対応および `/participants` エンドポイント補完により92レースを確定同期。
  - **日本中央 (JRA)**: 公式アーカイブ `jyusyo.html` から103全レースを確定同期（カラマティアノス、ショウヘイ等）。
  - **日本地方 (NAR)**: `keiba.go.jp` の当日メニュー（`RaceList`）および払戻・着順表（`RaceMarkTable`）から全239レースを100%確定同期（アランバローズ、グリューヴルム等）。
  - **香港 (HKJC)**: HKJC公式成績ページから全24レースを100%確定同期（Ka Ying Rising, Romantic Warrior, Storm Rider等）。
  - **イギリス・アイルランド・アメリカ (BHA, HRI, Equibase)**: Sporting Life 日次結果ページ（`__NEXT_DATA__`）から474レースを確定同期（Christmas Day, Golden Tempo, Napoleon Solo, Leading Change等）。
- **パーサー・パイプライン強化**:
  - `scripts/lib/foreign-results.ts`: PMUの二重配列アンラップ、Sporting Life の `top_horses` フォールバック対応、HKJC HTMLエンティティデコード。
  - `scripts/update-race-results.ts`: PMU詳細エンドポイント取得、Sporting Life HTMLパースフォールバック。
  - `src/components/shared/RaceCard.tsx`: 緊急措置として固定されていた `winnerName = null` を解除し、正規の勝ち馬表示へ復元。
- **品質・テスト保証**:
  - `tests/unit/foreignResultsOfficial.test.ts` を追加し、Samangan等公式勝ち馬の永続化およびGrandirの完全排除を検証。全52テストファイル・全505テスト全件パス。

### 過去のステップ: Step 50 (実績データ登録時におけるAI推測補完・架空データ生成の禁止規約策定（公式一次ソース準拠および未取得時空値原則の徹底）) [完了]
- **グローバル・プロジェクト規約の強化**:
  - グローバル開発ルール (`~/.gemini/GEMINI.md`) に「事実データ・実績値の推測補完・架空生成の厳禁」および「一次ソース原則と空値原則（Null Value Principle）」を明記。
  - プロジェクトルール (`.agents/rules/00-project.md`) の `Data accuracy & Single Source of Truth` を強化し、公式一次ソース準拠、対象年度（西暦）の厳密な一致照合、未取得時・未確定時の空値登録徹底、ダミー生成スクリプト作成禁止を義務化。
- **データパイプライン技術仕様書の整備 (`docs/specs/data-pipeline.md`)**:
  - 「5.6 データ完全性・一次ソース準拠および空値フォールバック規約」を策定。取得失敗時や未開催レースにおける空値（undefined）安全フォールバック、およびパーサー障害時の是正フローを定義。

### 過去のステップ: Step 51 (各国・レースの公式情報ページ（出馬表等）への外部リンク機能の実装) [完了]
- **スキーマおよびデータパイプライン拡張**:
  - `Race` 型および `RaceOutput` 型に `official_url?: string` を追加。
  - 発走予定時刻更新パイプライン（`update-race-times.ts`）において、スクレイピング時に各主催者公式出馬表ページのURLが取得された場合に `race.official_url` へ自動保存・反映。
- **公式URL連携・フォールバックヘルパー (`src/libs/officialUrl.ts`)**:
  - `getOfficialRaceUrl(race, language)`: 個別レースの `official_url` を最優先とし、未設定時も主催者・国・言語に応じた最適な公式出馬表・ポータルURLへシームレスにフォールバック。
  - `getOfficialSourceLabel(organization, language)`: 各主催者ごとの公式ソース表記（例:「JRA 公式サイト」「France Galop Officiel」「Sporting Life / BHA 公式出馬表」「HKJC 香港賽馬會官方排位表」など）を提供。
- **UIコンポーネント実装**:
  - **レース詳細ダイアログ (`RaceDetailDialog.tsx`)**:
    - 出走条件セクション直下に、視認性の高い「公式出馬表・レース情報を見る ↗」リンクボタンを設置。主催者公式ソース名を併記し、タップで新規タブ（`target="_blank"`, `rel="noopener noreferrer"`）にて安全に遷移可能に。
  - **レースカード (`RaceCard.tsx`)**:
    - カード上部の発走予定・時刻表示横に、コンパクトな外部リンクアイコンボタン（`ExternalLink`）を配備。`e.stopPropagation()` によりカードクリック（詳細ダイアログ展開）を阻害せず、即座に公式サイトを開くことが可能。
- **多言語（i18n）完全対応**:
  - 日本語、英語、フランス語、繁体字中国語の4言語すべてでボタン文言、アクセシビリティ用ARIA属性（`aria-label`）、公式ソース名をローカライズ。
- **テスト自動化**:
  - 単体テスト `tests/unit/officialUrl.test.ts` および UI統合テスト `tests/unit/officialUrl.test.tsx` を追加し、全54テストファイル・510テスト全件パスを達成。

### 過去のステップ: Step 52 (公式サイトへの外部リンク表示の一時的な無効化（UI非表示対応）) [完了]
- **機能フラグによる安全な非表示制御 (`src/libs/officialUrl.ts`)**:
  - `ENABLE_OFFICIAL_LINKS = false` フラグを導入し、仕様見直しおよび改修期間中の一時的なUI非表示措置を実施。
  - 型定義 (`official_url?: string`)、URL解決ロジック、パイプライン側処理は一切削除せず温存し、改修完了時に即座に再有効化可能な設計を採用。
- **UIコンポーネントからの導線非表示**:
  - `RaceCard.tsx`: ヘッダー右上の外部リンクアイコンボタンを非表示化。
  - `RaceDetailDialog.tsx`: ダイアログ下部の「公式出馬表・レース情報を見る ↗」ボタンを非表示化。
  - カードクリックによる詳細ダイアログ展開等の既存機能は正常動作を維持。
- **テスト自動化**:
  - `tests/unit/officialUrl.test.tsx`: フラグ無効化時にリンクボタン・アイコンが表示されないこと、および既存インタラクションが保護されていることを検証。全54テストファイル・511テスト全件パス。

### 過去のステップ: Step 53 (過去勝ち馬多言語データの是正・空値原則徹底および香港中文データの完全付与) (v1.38.2 / Issue #160, #161) [完了]
- **インシデント是正・不整合データの完全排除 (Issue #160)**:
  - NAR（地方競馬・ばんえい競馬）全239レースの勝ち馬データに残存していた、旧ダミー生成スクリプト由来の架空英名・騎手名（銀河賞「スターイチバン」に "Notturno" / "Seiji Yamazaki" が割り当てられていた等、50種類のダミープール使い回し）を完全削除。
  - JRA（中央競馬）全103レースの機械的ローマ字（`buenaonda` 等）および英語騎手名フィールドへの漢字混入を完全削除。
  - 公式一次ソース（`keiba.go.jp`, `jra.go.jp`）に存在しない英語馬名・騎手名について、**空値原則（Null Value Principle）**に基づき「未設定（undefined）」を徹底。
- **香港競馬（HKJC）全24レースにおける公式中文（繁体字・zh）馬名・騎手名の完全付与 (Issue #161)**:
  - HKJC公式サイト（`racing.hkjc.com`）の公式一次ソースに基づき、香港全24重賞レースの勝ち馬および騎手に公式繁体字データ（嘉應高昇/潘頓、浪漫勇士/麥道朗、金鑽貴人/梁家俊、美麗同享/莫雷拉等）を完全登録。
  - 繁体字中国語（`zh`）UI表示時において、香港重賞の勝者が母国語である正しい繁体字で表示されるよう整備。
- **中間ファイル残骸の解消とSingle Source of Truthの徹底 (Issue #161)**:
  - 孤立ファイル `src/data/france_real_winners.json` 等に残存していた架空日本語馬名（ボリショイ、ドゥリダ、プシュケ等）を完全に一掃し、公式実在マスターデータ（Samangan, Rayif, Bright Picture等）と完全同期。
- **UIフォールバックによる正しい多言語表示**:
  - フロントエンド（`RaceCard.tsx` / `RaceDetailDialog.tsx`）の `name[lang] || name.ja` フォールバック設計により、英語表示時でもカタカナ馬名・漢字騎手名が正しく表示され、架空の別馬が表示される致命的バグを解消。
- **データパイプラインおよびパーサーの根本是正**:
  - `scripts/lib/nar-results.ts` および `scripts/lib/jra-results.ts`: `kanaToHepburn` / `romanizeJapaneseRaceName` による機械的ヘボン式ローマ字推測生成ロジックを完全撤廃。公式一次ソースに英名が存在しない場合は推測せず未設定として構築。
  - 型定義の適正化 (`src/types/race.ts`, `scripts/parse-races.ts`, `scripts/update-race-times.ts`): `RaceWinner` の `name` / `jockey` において `en?: string` を許容する `LocalizedWinnerName` を導入し、空値原則との整合性を担保。
- **品質・テスト保証**:
  - 回帰防止用データ整合性テスト `tests/unit/dataIntegrity.test.ts` を新設・拡充。
    - NARおよびJRAの勝者データに推測英名・ダミー英名が存在しないこと
    - 銀河賞（`2026-nar-local-176`）の勝ち馬が「スターイチバン」（阿部優）であり英語名が未設定であること
    - 同一英語名が異なる日本語馬名のレースへ使い回されていないこと（重複割り当ての禁止）
    - 英語フィールドに "undefined" 文字列や漢字・全角文字が含まれていないこと
    - 香港重賞全24レースに公式中文（`zh`）馬名・騎手名が設定されていること
    - 中間ファイルに架空馬名残骸が存在せずマスターと一致していること
    - `src/data/race_winners.json` と `public/data/races.json` が完全に同期していること
  - 全55テストファイル・全519テスト全件パスを達成。

### 次期ロードマップ: フェーズ4 (将来拡張スコープ)
- **Step 54: 海外主要レースのさらなる拡張**:
  - オーストラリア（Racing Australia / IFHA Part I）、UAE/ドバイ（ERA）等の重賞データ統合。
  - 各国公式出馬表フェッチャーの追加による確定発走時刻自動取得。
- **Step 55: リアルタイム馬場状態・天候情報の表示**:
  - レース当日の天候（晴・雨等）および馬場状態（良・稍重・重・不良）のリアルタイム取得とバッジ表示。
- **Step 56: カレンダー連携（iCalendar / Google Calendar 出力）**:
  - お気に入りレースや特定条件レースをワンクリックで外部カレンダーアプリへ登録できる `.ics` エクスポート機能。