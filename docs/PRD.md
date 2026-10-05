# 重賞カレンダーサービス プロダクト要求仕様書 (PRD)

| 項目 | 内容 |
| :--- | :--- |
| **プロダクト名** | horse-racing-calendar Web アプリケーション |
| **作成日** | 2026年9月12日 (最終更新: 2026年10月4日) |
| **バージョン** | v1.43.0 (年度別データ分割Shardingアーキテクチャ・オンデマンド読み込み・2027年以降および新国拡張対応) |
| **配信形式** | SPA / PWA (GitHub Pages ホスティング) |
| **公式テーマカラー** | `#047B5F` (Turf Green / エメラルドグリーン) |

---

## 1. プロジェクト概要

本プロダクト（`horse-racing-calendar`）は、JRA（日本中央競馬会）の重賞レース（G1, G2, G3, J.G1, J.G2, J.G3）に加え、NAR（地方競馬全国協会）のダートグレード競走（Jpn1〜Jpn3、国際G1）、南関東重賞（S1〜S3）、全国各地区の地方重賞、ばんえい競馬（重賞）、フランス競馬（France Galop / IFHA Part I 平地重賞およびオートゥイユ競馬場主要障害重賞: G1, G2, G3）、イギリス競馬（British Horseracing Authority: BHA / IFHA Part I 平地重賞およびBHA Jump Pattern 主要障害重賞: G1, G2, G3）、アメリカ競馬（The Jockey Club / Equibase / IFHA Part I 重賞: G1, G2, G3）、香港競馬（Hong Kong Jockey Club: HKJC / IFHA Part I 重賞: G1, G2, G3）、アイルランド競馬（Horse Racing Ireland: HRI / IFHA Part I 平地重賞およびHRI Jump Pattern 主要障害重賞: G1, G2, G3）、およびオーストラリア競馬（Racing Australia / IFHA Part I 重賞および主要競走: G1, G2, G3, ジ・エベレスト、メルボルンカップ等）を包括的に統合し、国内外の主要競馬年間・月間スケジュールを一元的に視覚的かつ軽快に確認できるモダンなWebアプリケーションである。

モバイル閲覧時は直近レースを素早く確認できる **「タイムライン形式」**、PC/タブレット閲覧時は月全体のスケジュールを鳥瞰できる **「月間カレンダー形式」** を初期表示とし、PWA（Progressive Web Apps）およびオフライン閲覧に対応することで、競馬場や外出先などの電波状況が不安定な環境でもミリ秒単位でストレスなくアクセスできる体験を提供する。

UIライブラリには **Shadcn UI** (Radix UI + Tailwind CSS) を全面採用。ターフを象徴する公式イメージカラー（`#047B5F`）をベースとした洗練されたデザイン、Radix UI 由来の完全なキーボード操作・WAI-ARIAアクセシビリティ、OS設定連動のダークモード対応、そして多角的なフィルター機能（主催者・国コード・グレード・馬場・競馬場・距離）を両立したユーザー体験を実現している。

---

## 2. ドキュメント体系（分冊アーキテクチャ）

本プロジェクトは関心事の分離（Separation of Concerns）に基づき、以下のドキュメント構成で運用されている。

```text
docs/
├── PRD.md                         # 【正本】全体プロダクト要求仕様書（本ドキュメント: What / Why）
├── CHANGELOG.md                   # 過去のバージョン・フェーズごとの全完了履歴
├── non-functional-requirements.md # 【正本】非機能要件仕様書（NFR: 性能指標・計測運用ガイドライン）
├── specs/                         # 【技術・詳細仕様書】
│   ├── data-pipeline.md           # データパイプライン共通仕様（アーキテクチャ・更新戦略・共通スキーマ）
│   └── data-sources/              # 各国・各団体のデータ仕様（国追加時はここに追加）
│       ├── jra.md                 # JRA公式ICS・出馬表仕様
│       ├── nar.md                 # NAR地方競馬・ばんえい仕様
│       ├── france.md              # フランス（France Galop / PMU）仕様
│       ├── uk.md                  # イギリス（BHA / Sporting Life）仕様
│       ├── us.md                  # アメリカ（Equibase / The Jockey Club）仕様
│       ├── hk.md                  # 香港（HKJC）仕様
│       ├── ireland.md             # アイルランド（HRI / Sporting Life）仕様
│       └── australia.md           # オーストラリア（Racing Australia）仕様
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
| **AU** | `AU` | オーストラリアンゴールド (`#d97706`) | Racing Australia |

---

## 4. UI/UX コンポーネント仕様

### 4.1 タイムラインビュー (`TimelineView`)
- **デフォルト初期表示**: モバイル画面幅（`< 768px`）においてデフォルト表示。
- **今日・直近自動スクロール**: アクセス時に「今日」または直近の未来レース開催日へ自動スクロール。
- **フローティング「今日へ戻る」ボタン**: 画面スクロール時にワンタップで今日へ戻るアクションボタンを提供。下部固定フッターバーとの重なりを防止するため、ボトム配置を `bottom-14 sm:bottom-16 right-4 sm:right-6` に最適化。
- **カード情報構成**: 開催日、発走時刻（JST自動換算・確定/未確定バッジ）、国コード、グレード、レース名（日英仏中）、競馬場、馬場、距離、出走資格、斤量区分。
- **レース終了後の勝ち馬表示**: レース終了後、かつ勝ち馬データ（`winner`）が存在する場合に「🏆 {馬名}」のコンパクトなアンバー調バッジを表示。4言語での馬名切り替えに対応。
- **仮想スクロール・遅延マウント (Windowing)**: 日付セクション単位での遅延レンダリング（`TimelineDateSection`）により、画面外のレースカードをアンマウントして推定・実測高さを保持したプレースホルダーを展開。全1,336レース展開時でも同時DOMノード数を常時1,500個以下（約1,230個、97.9%削減）に抑制し、フィルター切り替えおよびスクロール応答性を大幅に向上（NFR 2.2 準拠）。

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

### 現在地: Step 70 (公式リンクのJRA G1特化に伴う不要な動的推測URL処理撤廃および秋G1マスタ事前整備) (Issue #190) [完了]
- **動的推測コード（デッドコード）の完全撤廃 (`src/libs/officialUrl.ts`)**:
  - かつて出馬表や結果URLを競馬場名や日付から推測組み立てしていた関数群（`resolveNarOfficialUrl`, `resolveHkjcOfficialUrl`, `NAR_BABA_CODES` 等）を完全削除。
  - 実在検証済みの `official_url`（JRA G1確定結果）のみを返却し、未検証レースは一律 `null`（UI非表示）とする堅牢な実装へ純化。
- **結果更新バッチの未使用URL処理整理 (`scripts/update-race-results.ts`)**:
  - 各プロバイダー（NAR, PMU, Sporting Life, HKJC, US）から未使用の `resultUrl` 組み立て処理を撤廃し、責務を勝ち馬抽出に純化。
  - `JRA_G1_RESULT_URLS` に2026年秋のJRA G1/J.G1（全12レース）の公式実在スラッグを事前定義し、レース終了後の自動バッチで手動登録忘れやスラッグ誤認なく確実に公式結果URLが反映される仕組みを確立。
- **テスト・品質検証 (`tests/unit/officialUrl.test.ts`, `tests/unit/backfillOfficialResultUrls.test.ts`)**:
  - 不要関数のテストを削除し、JRA G1確定結果のみのURL返却および他レースの一律非表示を保証するテストへ刷新。
  - 年間全26レースのJRA G1スラッグ網羅性を自動検証するテストを配備。全63テストファイル・592テスト全件パス、プロダクションビルド成功。

### 過去のステップ: Step 69 (年度別データ分割（Sharding）アーキテクチャの導入・オンデマンド読み込み) (Issue #181) [完了]

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

### 過去のステップ: Step 54 (アメリカ競馬の未登録勝ち馬データ即効性是正・正規化強化・空値原則徹底) (v1.38.3 / Issue #164) [完了]
- **アメリカ競馬（Equibase / Sporting Life）勝ち馬データの即効性是正 (Issue #164)**:
  - 勝ち馬未登録だった米国重賞レース群に対し、公式一次ソース（Equibase, BloodHorse, Sporting Life）と徹底的な突合・照合を実施。
  - 実在確認が取れた18レースの勝ち馬（The Puma, Bodacious Bay, Tam Tam, Survie, Nafisa, Rabeeba, Neat, Kathynmarissa等）および騎手・タイム・着順データを `public/data/races.json` および `src/data/race_winners.json` へ正式反映。
- **タイムゾーン差およびレース名名寄せの強化**:
  - 米国西海岸（PT/MT）夜間発走レースがSporting Life等のUTC基準APIで翌日（+1日）日付に登録される仕様に配慮したクロス検索・照合の確立。
  - `tokenizeEnglish` の強化: Unicode正規化（NFD分解によるアクセント記号 `ñ` 等のストリップ処理）、括弧書き注記（競馬場名等）の除去、アポストロフィ除去、スポンサー冠名除外（`PRESENTED`, `BY`, `SPONSORED`）を実装。
- **空値原則（Null Value Principle）の厳格遵守と未開催レースの保護**:
  - NYRA日程変更により秋・冬へ移動したレース（`2026-us-g2-46` Man o' War S: 2026-11-28, `2026-us-g2-59` Brooklyn S: 2026-12-05）および発走直前延期レース（`2026-us-g3-138` Delaware H）、2026年中止レース（`2026-us-g3-113` Cougar II S）について、勝者を推測補完せず「未設定（undefined/空欄）」として厳格に保護。
- **テストおよび品質検証**:
  - `tests/unit/dataIntegrity.test.ts` に米国実在勝ち馬登録および未開催レースの空値保護に関する検証ケースを追加。
  - `tests/unit/usRaces.test.ts` における Flower Bowl Stakes の実施行日（2026-10-01）アサーションを更新。
  - 全55テストファイル・521テスト全件パス、プロダクションビルド成功を達成。

### 過去のステップ: Step 55 (全主催者レース結果ライブフェッチ完全対応・GitHub Actions自動更新バッチ配備・日本テレビ盃確定) (v1.38.4 / Issue #167) [完了]
- **NAR（地方競馬・ばんえい）レース結果ライブフェッチの実装 (`NarRaceResultFetcher`)**:
  - `keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList`（当日メニュー出馬表）から競馬場コード（`NAR_BABA_CODES`）を用いて対象レースの `k_raceNo` を自動特定し、確定着順表（`RaceMarkTable`）を動的取得するライブフェッチパイプラインを確立。
  - レース名および騎手名パースの堅牢化（`<section class="raceTitle"><h3>...</h3>` 優先抽出によるサイトロゴ誤検出防止、所属タグ `<span>（JRA）</span>` や空白のクレンジング、騎手略記の正規化）。
  - 公式に英名が存在しないため、空値原則（Null Value Principle）に基づき推測英名は一切付与せず日本語のみを登録。
- **アメリカ・香港競馬を含む全主催者ライブフェッチの完全稼働**:
  - **アメリカ競馬 (`UsRaceResultFetcher`)**: Sporting Life Results API（北米主要トラック対応）へのライブフェッチを実装（西海岸等のUTC翌日クロス照合対応）。
  - **香港競馬 (`HkjcRaceResultFetcher`)**: HKJC公式ローカルリザルトページへのライブフェッチを実装し、繁体字（`zh`）および英語（`en`）の双方を動的解決。
  - **JRA・欧州（仏・英・愛）**: JRA特別レース結果、PMU REST API（`/programme` & `/participants`）、Sporting Life Results API とのライブ連携を維持・担保。
- **日本テレビ盃（Jpn2）および直近地方重賞の公式確定データ反映**:
  - 2026-09-30 船橋・第11R 日本テレビ盃（ミッキーファイト / 戸崎圭太 / 7番 / 1:52.1）および門別・サンライズカップ（イケメンモンスター / 石川倭 / 7番 / 1:56.4）を公式確定リザルトから取得し、`public/data/races.json` と `src/data/race_winners.json` に二重永続化。
- **GitHub Actions 自動結果更新ワークフローの新設 (`.github/workflows/update-race-results.yml`)**:
  - `docs/batch-schedules.md` の仕様に準拠し、毎日昼〜夕方（15:00, 15:45, 16:15, 17:00 JST: JRA祝日/変則/代替開催や金杯等・NAR昼間重賞・香港重賞対応）および毎日夜間（20:30, 21:30, 22:30, 23:30, 24:00 JST: NARナイター重賞、欧州主要重賞の夜間確定取り込み・遅延バックアップ対応）、毎日朝（07:30 JST: 米国・海外重賞）の自動更新パイプラインを配備。未確定対象がない場合は早期終了ガードによりCI負荷を最小化。
  - 差分発生時に `public/data/races.json` と `src/data/race_winners.json` を二重コミット＆プッシュし、GitHub Pages への自動デプロイと連動。
- **テスト・品質検証**:
  - 全主催者のプロバイダー統合テストおよび日本テレビ盃のデータ整合性テストを追加。全55テストファイル・525テスト全件パス、プロダクションビルド成功。

### 過去のステップ: Step 56 (9/26〜10/02終了レース結果一括反映・パイプライン堅牢化・空値原則遵守) (v1.38.5) [完了]
- **9/26〜10/02終了全10レースの公式確定結果一括反映**:
  - **NAR**: 姫山菊花賞（オマツリオトコ/吉原寛人/10番/1:51.4）、マリーンカップ（ロンギングフォユー/荻野極/1番/1:53.1）、ネクストスター門別（クラプロスパー/山本聡哉/5番/1:13.3）
  - **フランス**: コンデ賞（Just Yet/C.SOUMILLON/6番/2:13.35、10/02代替開催）
  - **アイルランド**: ルネサンスステークス（Soul Love/1:14.09、09/27代替開催）、ウェルドパークステークス（Curracloe/1:28.3）
  - **香港**: ナショナルデーカップ（COLOURFUL KING/顏色之皇/Z Purton/潘頓/4番/0:55.72）
  - **アメリカ**: アルシバイアディーズステークス（Emphatic/1:43.4）、Jessamineステークス（Serenas Ghost/1:45.57）、Phoenixステークス（Nakatomi/1:09.93）
- **結果更新パイプラインの恒久的な堅牢化**:
  - `scripts/update-race-results.ts`: `--days <N>` 引数による遡及更新に対応。
  - `HkjcRaceResultFetcher`: レース名から RaceNo を動的検出し、繁体字（`zh`）および英語（`en`）を公式から完全取得。
  - `UsRaceResultFetcher`: Sporting Life API 404 時の HTML `__NEXT_DATA__` フォールバックを配備。
  - `FranceRaceResultFetcher`: PMU URL を `online.turfinfo.api.pmu.fr` に統一し、`frenchRaceMatches` を導入。
  - `NarRaceResultFetcher`: 騎手名略記辞書の拡充（山本聡哉、吉原寛人）および着順表の枠番・馬番分離の適正化。
- **空値原則（Null Value Principle）と日程変更の適正保護**:
  - フランスギャロ秋季番組再編により11月へ移動した「トマ・ブリョン賞」、および10/03夜間発走予定の米国3重賞（Matron S, Futurity S, Pilgrim S）について、勝者を推測補完せず未確定のまま保護し、日程変更フラグを更新。
- **テスト・品質検証**:
  - `tests/unit/dataIntegrity.test.ts` に香港25重賞の全件中文検証およびナショナルデーカップのピンポイント検証を追加。全55テストファイル・全525テスト全件パス、プロダクションビルド成功。

### 過去のステップ: Step 57 (ページ強制再読込機能・ヘッダーリロード＆軽量アクセシブルトースト通知) (v1.39.0 / Issue #166) [完了]
- **ページ強制再読込（SPAリフレッシュ）機能の実装**:
  - PWAスタンドアロン表示時、ブラウザの更新ボタンやアドレスバーがないため、最新データ確認にトップまでスクロールしてpull-to-refreshするか再起動が必要だった操作課題を解消。
  - 常時画面最上部に固定（`sticky top-0 z-40`）されているヘッダー（`src/components/shared/Header.tsx`）右上にリロードボタン（`RotateCw` アイコン）を配備。言語切替セレクターとテーマ切替ボタンの間に配置。
  - 白画面のブラウザハードリロードを避け、`races.json?t=${Date.now()}`（`cache: 'reload'`）をネットワーク直行でフェッチし、`useRaceStore` の状態を即時更新。スクロール位置や適用中のフィルター状態を完全に維持。
  - バックグラウンドで `navigator.serviceWorker.getRegistration().then(reg => reg?.update())` も呼び出し、PWA Service Worker の更新チェックも連動。
- **軽量・セマンティックなアクセシブルトースト通知 (`src/components/ui/toast.tsx` & `src/store/useToastStore.ts`)**:
  - 外部の肥大化したnpmパッケージを追加せず、Shadcn UI / Tailwind CSS セマンティックトークン（`bg-card`, `text-card-foreground`, `border`, `shadow-lg`）に準拠した通知基盤を構築。
  - `role="status"` および `aria-live="polite"` に準拠し、スクリーンリーダー対応および手動「閉じる」操作、3秒後の自動フェードアウトをサポート。
  - 画面下部中央（固定フッターやスマホ操作を阻害しない位置）に控えめにポップアップ表示。
- **4言語多言語対応 (`src/libs/i18n.ts`)**:
  - 日・英・仏・中の全4言語でリロードボタンのツールチップ・ARIAラベル、および完了・失敗トースト通知文言を完全定義。
- **テスト・品質検証**:
  - `tests/unit/useRaces.test.ts` に `forceRefreshRaces` および hook `refreshRaces` のフェッチ・Store更新・SW更新・エラー処理テストを追加。
  - `tests/unit/toast.test.tsx` にトースト通知の表示・自動消去・手動消去テストを追加。
  - `tests/unit/Header.test.tsx` にリロードボタンの表示・クリック・ローディング中スピンアニメーション・`disabled` 制御・多言語ARIAラベルテストを追加。
  - 全56テストファイル・535テスト全件パス、型チェック・プロダクションビルド成功。

### 過去のステップ: Step 58 (PWAマニフェスト英語デフォルト化＆端末言語連動・日英仏中多言語ローカライズ) (v1.39.1 / Issue #172) [完了]
- **Web App Manifest（`manifest.webmanifest`）のデフォルト英語化 & 多言語ローカライズ**:
  - グローバル標準仕様に準拠し、`vite.config.ts` のマニフェスト基底言語を英語（`lang: 'en'`, `name: 'Graded Races - Horse Racing Calendar'`, `short_name: 'Graded Races'`）に刷新。
  - W3C標準の `translations`（`ja`, `fr`, `zh`）および互換用 `short_name_localized`, `name_localized`, `description_localized` を配備。日本語端末では「重賞カレンダー」、フランス語端末では「Courses de Groupe」、中国語端末では「分級賽行事曆」としてインストール可能に整備。
- **初期HTML（`index.html`）の端末言語連動インラインスクリプト配備**:
  - iOS Safari等でReact起動前に「ホーム画面に追加」を実行した場合でも端末言語に応じたアプリアイコン名となるよう、`<head>` 内に端末言語判定スクリプトを配備。
  - `navigator.language` および `localStorage.getItem('language')` に基づき、`apple-mobile-web-app-title` および `application-name` を即時設定。
- **アプリ内メタ同期（`src/libs/pwaMetadata.ts`）との完全整合**:
  - 手動言語切替（JA/EN/FR/ZH）時にも、`updatePwaMetadata(language)` により各メタタグが完全に同期されることを維持。
- **テスト・品質検証**:
  - `tests/unit/manifest.test.ts` を新設し、基底言語および多言語ローカライズ設定、生成マニフェストの構造を自動検証。
  - `tests/unit/pwaMetadata.test.ts` に初期言語判定スクリプトのシミュレーションテストを追加。
  - 全57テストファイル・542テスト全件パス、型チェック・プロダクションビルド成功。

### 過去のステップ: Step 59 (公式サイトリンク改善 Phase 1: 未定時非表示制御の導入とNAR/HKJC動的URL先行解決) (Issue #157) [完了]
- **未定時非表示制御の導入 (`src/libs/officialUrl.ts`)**:
  - 主催者トップポータルへの一律フォールバック（`DEFAULT_OFFICIAL_URLS`）を全廃。
  - レース予定も結果も未確定で `official_url` が存在しないレースでは `getOfficialRaceUrl` が `null` を返却し、UI上でリンクアイコン・ボタンを安全に非表示化。
- **NAR（地方競馬）および HKJC（香港競馬）の動的URL先行解決**:
  - URL構造が規則的な主催者について、レースデータ（日付・競馬場・レース番号）から公式出馬表・結果URLを動的に解決するヘルパーを実装。
  - **NAR**:
    - 全国15場馬場コード（帯広 `3`, 門別 `36`, 大井 `20`, 川崎 `21` 等）を特定。
    - レース確定時（`winner` 保持）は確定着順表（`RaceMarkTable`）、未確定時は出馬表（`DebaTable`）を動的生成。
  - **HKJC**:
    - 競馬場コード（沙田 `ST`, ハッピーバレー `HV`）を特定。
    - レース確定時は公式レース結果（`LocalResults.aspx`）、未確定時は公式排位表（`RaceCard.aspx`）を動的生成。中文（`zh` / `Chinese`）および英・日・仏（`English`）に対応。
- **UI導線の再有効化 (`ENABLE_OFFICIAL_LINKS = true`)**:
  - `RaceCard.tsx`（ヘッダー右上の外部リンクアイコン）および `RaceDetailDialog.tsx`（「公式出馬表・レース情報を見る ↗」ボタン）を再有効化。
  - URLが存在するレースのみ表示され、未定レースでは完全に非表示となることを保証。
- **テスト自動化**:
  - `tests/unit/officialUrl.test.ts` および `tests/unit/officialUrl.test.tsx` を刷新。
  - 未定レースでの非表示制御、NAR/HKJCでの状態別動的URL解決、カードクリックとの共存を検証。全57テストファイル・553テスト全件パス、プロダクションビルド成功。

### 過去のステップ: Step 60 (公式サイトリンク改善 Phase 2: 出馬表・発走確定時刻取得パイプライン連動による予定URL自動付与) (Issue #158) [完了]
- **発走確定時刻取得スクリプト連動による予定URL自動設定 (`scripts/update-race-times.ts`)**:
  - 各競馬主催者（JRA, Sporting Life / BHA, PMU / France Galop, Equibase, HRI 等）の発走確定時刻フェッチャーが返却する公式出馬表・レース詳細URL（`ConfirmedRaceTime.sourceUrl`）を、未確定レースの発走予定時刻確定時に `race.official_url` へ自動保存・反映。
  - PMU（フランス競馬）において、Reunion番号・Course番号に基づいた個別レース出馬表URL（`https://www.pmu.fr/turf/{DDMMYYYY}/R{reunion}/C{course}`）の動的構築を導入。
  - HKJC（香港競馬）において、競馬場コード（`Racecourse=ST|HV`）およびレース番号（`RaceNo=R`）を付与した公式排位表URLの動的構築を導入。
- **結果確定済み過去レースのURL巻き戻り防止（保護ロジック）**:
  - すでにレースが終了し着順・勝ち馬（`race.winner`）が確定している過去レースに対し、時刻更新バッチが出馬表URLで上書き（ロールバック）しないガード条件を実装。
  - 既に時刻確定済みだが `official_url` が未設定の開催予定レースに対しても、時刻変動の有無にかかわらず公式出馬表URLを安全に新規付与。
- **パイプラインログ出力の強化**:
  - 出馬表URLの新規付与、更新、および結果確定済みレースにおける巻き戻しスキップ（`preserved (already finished with winner)`）状況をパイプライン実行ログへ明示的に出力。
- **テスト自動化**:
  - `tests/unit/updateRaceTimesUrl.test.ts` を新設。
  - 時刻確定時の公式出馬表URL自動付与、確定済み過去レースの巻き戻り防止ガード、および時刻同一時のURL新規付与を検証。全58テストファイル・556テスト全件パス、プロダクションビルド成功。

### 過去のステップ: Step 61 (公式サイトリンク改善 Phase 3: レース結果確定パイプライン連動によるリザルトURL上書きおよび過去実績バックフィル) (Issue #159) [完了]
- **レース結果確定パイプライン連動 (`scripts/update-race-results.ts`)**:
  - 各競馬主催者結果フェッチャー（JRA, NAR, France Galop / PMU, Sporting Life / BHA, HRI, HKJC, Equibase / US）に `RaceResultRecord`（`winner` と `resultUrl`）を導入。
  - レース終了・着順確定時に、出馬表URLを確定公式結果URL（`resultUrl`）で自動上書き更新するパイプラインを構築。
  - `src/data/official_results_urls.json` を新設し、公式結果URLの永続化マスタとして連携。
- **確定済み過去実績バックフィル (`scripts/backfill-official-result-urls.ts`)**:
  - 一次ソース原則・空値原則（Null Value Principle, Issue #153）に基づき、公式一次ソースで実在確認（HTTP 200 OK）された公式結果URL（2026年JRA G1全13レース）を `public/data/races.json` へ安全にバックフィル。
  - 一次ソースで直接確認できないレースデータは、架空URLによる推測補完を行わず未設定（undefined）のまま保持することを徹底。
- **テスト自動化**:
  - `tests/unit/backfillOfficialResultUrls.test.ts` を新設し、実在検証済み公式URLのバックフィル、未検証レースの空値維持、dry-run、および冪等性を自動検証。
  - `tests/unit/updateRaceResults.test.ts` にレース結果確定時の `official_url` 自動付与およびマスタ同期テストを追加。
  - 全59テストファイル・560テスト全件パス、型チェック・プロダクションビルド成功。

### 過去のステップ: Step 62 (アメリカ重賞7レースの勝ち馬名誤登録是正・空値原則徹底・バリデーションテスト新設) (v1.39.2 / Issue #174) [完了]
- **アメリカ重賞7レースの勝ち馬名誤登録是正 (`src/data/race_winners.json`, `public/data/races.json`)**:
  - ウィンターMemoriesステークスにおいて勝ち馬バッジに誤ってレース名（ウィンターメモリーズステークス）が表示されていた不具合を調査。全933件の登録済みレースを網羅的に点検し、アメリカ競馬の合計7レースで `name.ja` にレース名が代入されていたことを特定・是正。
  - 空値原則（Null Value Principle / Issue #153）に基づき、公認カタカナ表記のない海外馬について推測カタカナやレース名を排除し、原語（英語）馬名をそのまま設定。
    - `2026-us-g3-09`: `Nafisa`（ラCañadaステークス）
    - `2026-us-g3-77`: `Heroic Move`（SteveSextonマイルステークス）
    - `2026-us-g3-99`: `Closethegame Sugar`（Kelly'sLandingステークス）
    - `2026-us-g3-102`: `Neat`（Manilaステークス）
    - `2026-us-g3-124`: `Rabeeba`（Torreyパインズステークス）
    - `2026-us-g2-101`: `Super Corredora`（Zenyattaステークス）
    - `2026-us-g3-137`: `Shelzawa`（ウィンターMemoriesステークス）
  - `src/data/race_winners.json` と `public/data/races.json` の双方を更新し、二重永続化と完全同期を担保。
- **データ完全性バリデーションテスト新設 (`tests/unit/dataIntegrity.test.ts`)**:
  - 全レースの勝ち馬名（`name.ja`, `name.en`）に対し、「ステークス」「記念」「トロフィー」「大賞典」等のレース名接尾辞が誤混入していないことを網羅的に検証する自動テストを追加。
  - 該当7レースの勝ち馬名が正確に設定されていることのピンポイント検証を追加。
  - 全59テストファイル・562テスト全件パス、型チェック・プロダクションビルド成功。

### 過去のステップ: Step 63 (公式サイトリンクのデッドリンク・誤リンク是正と確度の高いデータ（JRA G1等）への限定・未検証URL空欄化) (Issue #176) [完了]
- **確度の高い公式データへの厳格限定と未検証URLの空欄化 (`src/libs/officialUrl.ts`, `public/data/races.json`)**:
  - デッドリンクや別レース・別日付を指す誤リンクを完全に解消するため、NARおよびHKJCの動的パラメータ組み立てによる推測生成ロジックを撤廃。
  - 実在性・恒久性が一次ソースで完全に検証された公式アーカイブURL（2026年JRA G1全13レースの確定競走成績）のみを `official_url` として保持し、それ以外の不確実な一時的URLを一括クリーンアップ（`undefined`）。
  - URLが存在しないレースは、UI（`RaceCard`, `RaceDetailDialog`）上でリンクアイコン・ボタンを安全に非表示化。
- **データ更新バッチからのデッドリンク混入防止**:
  - `scripts/update-race-times.ts`: 一時的な出馬表・週次一覧ページ（開催終了後に404となるページ等）を `official_url` に自動保存する処理を撤廃し、確定発走時刻の更新に責務を限定。
  - `scripts/update-race-results.ts`: 動的推測URLの自動保存を停止し、実在検証済み公式マスタ（`src/data/official_results_urls.json` 等）に基づく安全な付与に限定。
  - `scripts/backfill-official-result-urls.ts`: 未検証URLの自動クリーンアップ・空値化ロジックを追加。
- **テスト自動化**:
  - 単体・統合・UIテスト（`officialUrl.test.ts`, `officialUrl.test.tsx`, `updateRaceTimesUrl.test.ts`, `backfillOfficialResultUrls.test.ts`, `updateRaceResults.test.ts`）を是正仕様に刷新。全59テストファイル・564テスト全件パス、プロダクションビルド成功。
- **今後の展望・運用方針**:
  - 国内外のG1競走をはじめ、恒久的に壊れない公式一次ソースの個別レース結果URLが確認できたものから、順次検証済みマスタへ慎重に追加・拡充する方針を確立。

### 過去のステップ: Step 64 (JRA G1公式結果URLのデッドリンク是正・公式リプレイ一覧スラッグ整合化) (Issue #182) [完了]
- **JRA G1公式結果URLのデッドリンク是正 (`src/data/official_results_urls.json`, `scripts/update-race-results.ts`, `public/data/races.json`)**:
  - JRA公式G1一覧ディレクトリ（`https://www.jra.go.jp/datafile/seiseki/replay/g1.html`）と突合調査を実施。
  - スラッグ名の相違によりHTTP 403/404となっていた4件のURLを、JRA公式の実在URLへ是正：
    - NHKマイルカップ: `nhk` -> **`nmc`** (`https://www.jra.go.jp/datafile/seiseki/g1/nmc/result/nmc2026.html`)
    - ヴィクトリアマイル: `vm` -> **`victoria`** (`https://www.jra.go.jp/datafile/seiseki/g1/victoria/result/victoria2026.html`)
    - 宝塚記念: `takarazuka` -> **`takara`** (`https://www.jra.go.jp/datafile/seiseki/g1/takara/result/takara2026.html`)
    - スプリンターズステークス: `sprinters` -> **`sprint`** (`https://www.jra.go.jp/datafile/seiseki/g1/sprint/result/sprint2026.html`)
  - 中山グランドジャンプ（J.G1）の公式結果URL（**`ngj`**）を追加。
  - `scripts/backfill-official-result-urls.ts` を実行し、`public/data/races.json` の該当レースURLをHTTP 200 OKの正式URLへバックフィル。
- **データ完全性テスト新設 (`tests/unit/backfillOfficialResultUrls.test.ts`)**:
  - 実本番マスタ `src/data/official_results_urls.json` の登録スラッグがJRA公式仕様に準拠し、旧スラッグ（`nhk`, `vm`, `takarazuka`, `sprinters`）を一切含まないことを自動検証するテストを追加。
  - 全59テストファイル・565テスト全件パス、プロダクションビルド成功。

### 過去のステップ: Step 65 (非機能要件仕様書（NFR）の策定および性能指標（INP/DOMノード数/バンドルサイズ目標）の明確化) (Issue #179) [完了]
- **非機能要件仕様書（NFR）の新設 (`docs/non-functional-requirements.md`)**:
  - 開催国拡充（日・英・仏・米・香・愛）および今後の2027年番組追加、年末年始の新国（UAE、サウジアラビア、豪等）追加に伴うレース数拡大を見据え、非機能要件・性能仕様書の正本（SSOT）を策定。
  - 定量的かつ測定可能な性能指標（SLO / KPI）を明確化：
    - **操作応答性 (INP)**: フィルター切り替え応答 100ms 未満（目標 16ms〜50ms / 60fps）、表示モード切り替え 150ms 未満、詳細ダイアログ表示遅延 100ms 未満。
    - **クライアント描画負荷 (DOM / メモリ)**: 同時展開DOMノード数常時 1,500 ノード以下、JSヒープ消費 50MB 以下（モバイル基準）。
    - **ロード性能 (Core Web Vitals)**: LCP 2.5秒 未満 (Fast 3G/Slow 4G)、INP 200ms 未満、CLS 0.1 未満、初期データ転送量 gzip 100KB 未満。
    - **バンドルサイズ**: メインJSチャンク 350KB 未満 (gzip 100KB 未満)、カレンダー等の `React.lazy` 動的インポート適用基準策定。
- **計測・運用ガイドラインおよび将来受入基準の確立**:
  - Chrome DevTools (CPU 4x slowdown / ネットワークスロットリング)、Lighthouse CLI、Viteバンドル解析の標準測定プロファイルと手順を明記。
  - 今後予定されている「タイムライン仮想スクロール」および「データSharding（年度別分割）」の受入基準として定義。
- **プロジェクト規約・ドキュメント体系との整合**:
  - `.agents/rules/30-performance.md` の正本参照先として完全整合。
  - `AGENTS.md`、`docs/PRD.md`、`docs/CHANGELOG.md` を更新。

### 過去のステップ: Step 66 (タイムラインビューの仮想スクロール（遅延描画）導入によるDOM数削減とフィルタ切り替え高速化) (Issue #180) [完了]
- **タイムラインビューの遅延マウント・Windowing機構の実装 (`src/features/timeline/TimelineView.tsx`)**:
  - 全1,336件・約150開催日のレースカード一括マウントによる描画負荷（約33,000〜60,000 DOMノード）を抜本解消するため、日付セクション単位の遅延描画コンポーネント（`TimelineDateSection`）を新設。
  - 外部依存パッケージを追加せず（バンドルサイズ増加ゼロ）、ブラウザ標準の `IntersectionObserver`（前後800pxバッファ）を活用して画面内および周辺のセクションのみを動的にマウント。
  - 画面外のセクションはカード本体をアンマウントし、正確な実測高さ（または推定高さ）を保持したプレースホルダーに切り替えることで、スクロールバーのガタつき（レイアウトシフト）を完全防止。
  - 直近・今日のターゲット日付セクション（`isTargetDate`）は初回から即時マウントし、Issue #6（自動スクロール）およびIssue #9（「今日へ戻る」ジャンプボタン）、スティッキー日付ヘッダーの動作と100%の互換性を維持。
- **大幅な性能改善・NFR目標の達成**:
  - **同時展開DOMノード数**: 59,857個 → **1,231個**（**97.9%削減**、NFR 2.2 の「常時 1,500個以下」目標をクリア）。
  - **フィルタ切り替え応答性**: 数万ノードの再計算から可視セクションのみ（十数件）へ縮小され、瞬時（< 30ms / 60fps）に完了。
- **テスト・ベンチマークの拡充 (`tests/unit/TimelineVirtualScroll.test.tsx`, `tests/setup.ts`)**:
  - 大規模データセット時のプレースホルダー化、IntersectionObserver による画面進入時のマウント・離脱時のアンマウント動作を自動検証。
  - 全1,336レース実データを用いたDOMノード数ベンチマークテストを配備。全60テストファイル・568テスト全件パス、プロダクションビルド成功。

### 過去のステップ: Step 67 (アイルランド競馬の未登録勝ち馬データ即効性是正・実開催日・移転・別名照合エンジン強化) (Issue #165) [完了]
- **アイルランド重賞34レースの勝者データ100%同期 (`src/data/race_winners.json`, `public/data/races.json`)**:
  - 2026年アイルランド（HRI）過去開催（<= 2026-10-03）の全86レース中、未登録だった34レースの勝者名および勝ちタイムをSporting Life / HRI公式実績から100%特定し反映。
  - 公式カタカナが存在する競走馬（トゥルーラヴ、スカンジナビア、サングッデス等）は既存マスターと統一し、JRA-VAN等公式カナが存在しない馬は空値原則（Null Value Principle）に従い英字名を維持。
- **天候順延・カレンダー変更・競馬場移転のマスター是正 (`src/data/ireland_race_master.json`, `public/data/races.json`)**:
  - ダブリンレーシングフェスティバル等の悪天候順延（01-31 -> 02-02）、カラ競馬場の復活祭前後の開催日変更等、計23レースの実際の日程乖離を是正し、`is_rescheduled: true`, `original_date` を設定。
  - ティペラリー競馬場の改修に伴う移転（Fairy Bridge Stakes: ティペラリー -> コーク）、スタネラS（レパーズタウン -> フェアリーハウス）、ブラウンズタウンS（フェアリーハウス -> レパーズタウン）の会場入れ替えを反映。
- **Sporting Life 名寄せ照合エンジンの拡充 (`scripts/lib/uk-syutsuba.ts`)**:
  - `UK_STOP_WORDS` に `EBF`, `IRISH`, `EUROPEAN`, `BREEDERS`, `FUND`, `STALLION`, `FARMS` 等の共通協賛団体語句を追加。
  - `UK_RACE_ALIASES` に冠スポンサー名変更・別名マッピング（`Lanwades Stud S` = `Ridgewood Pearl S`、`Jannah Rose S` = `Blue Wind S`、`Golden Fleece S` = `Champions Juvenile S`、`Priory Belle S` = `1,000 Guineas Trial`、`Red Rocks S` = `2,000 Guineas Trial`、`Boodles Champion Hurdle` = `Punchestown Champion Hurdle` 等）を拡充。
- **データ整合性テストの拡充 (`tests/unit/foreignResultsOfficial.test.ts`, `tests/unit/ukSyutsuba.test.ts`)**:
  - アイルランド過去全86重賞の勝者登録100%保証、順延・移転レースの属性保証、名寄せエンジンのエイリアスマッチングテストを追加。全60テストファイル・570テスト全件パス。

### 過去のステップ: Step 68 (言語別URLパス導入・ルート英語デフォルトOGP・言語切替URL同期) (Issue #187) [完了]
- **静的HTML・OGPタグの多言語出力 (`vite.config.ts`, `index.html`)**:
  - ルート（`/`）の静的HTMLを英語デフォルト（`<html lang="en">`、`Graded Races Calendar | Schedule of World Graded Races`、`og:locale="en_US"`）に設定し、Issue #172（PWA英語デフォルト化）と整合。
  - Viteビルド時（`generateLocalizedHtmlPlugin`）に、各言語専用の静的HTML（`dist/ja/index.html`、`dist/en/index.html`、`dist/fr/index.html`、`dist/zh/index.html`、`dist/404.html`）を自動生成。
  - 日本語（`/ja/`）、英語（`/en/`）、フランス語（`/fr/`）、繁体字中国語（`/zh/`）の各専用OGP/Twitterカードタグ・言語属性・canonicalタグを静的出力。
- **アクセス時の言語判定優先順位ルールの確立 (`src/store/useLanguageStore.ts`)**:
  - 第1優先（最優先）: URLパス（`/ja/`, `/en/`, `/fr/`, `/zh/`）。SNS共有や外部リンク経由の言語指定を100%尊重。
  - 第2優先: 手動選択履歴（`localStorage`）。ルートアクセス時に過去の手動選択を復元。
  - 第3優先: 端末ブラウザ設定（`navigator.language`）。ルートへの初回訪問時に端末言語で自動判定。
  - 第4優先: 英語デフォルト（`en`）。
- **言語切り替え時のURL同期 (`history.replaceState`)**:
  - アプリ内の言語セレクター（JA/EN/FR/ZH）で言語を切り替えた際、画面のリロードなしでアドレスバーのURLパス（`/ja/` 等）を即座に同期（クエリ・ハッシュ保持）。
  - ブラウザの「戻る」「進む」（`popstate` イベント）をリスンし、履歴遷移時もストアの言語を自動追従。
- **シェア用URL生成ユーティリティ (`src/libs/share.ts`)**:
  - 現在の言語パス（`/ja/`, `/en/` 等）を付与した共有用URLを取得する共通関数を配備。
- **テスト・品質検証**:
  - `tests/unit/useLanguageStore.test.ts`、`tests/unit/share.test.ts`、`tests/unit/localizedHtml.test.ts`、`tests/unit/seo.test.ts` を配備・更新。全62テストファイル・587テスト全件パス。

### 過去のステップ: Step 69 (年度別データ分割（Sharding）アーキテクチャの導入・オンデマンド読み込み) (Issue #181) [完了]
- **年度別データ分割（Sharding）パイプラインの導入 (`scripts/lib/race-sharding.ts`, `scripts/parse-races.ts`, `scripts/update-race-times.ts`, `scripts/update-race-results.ts`)**:
  - レースデータを西暦年度ごとに分割出力する `syncShardedRaceFiles` を配備。
  - 出力ファイル群: `public/data/races-YYYY.json`（年度別データ）、`public/data/index.json`（提供年度・総件数等のメタデータ）、および完全な後方互換性を担保する結合版 `public/data/races.json`。
  - データ生成（`data:build`）、発走時刻更新（`data:update-times`）、結果更新（`data:update-results`）の全パイプラインで自動同期実行。
- **クライアント側オンデマンド読み込み & キャッシュ最適化 (`src/hooks/useRaces.ts`, `src/store/useRaceStore.ts`, `vite.config.ts`)**:
  - 初回アクセス時は現在表示年度（例: 2026年）の shard のみを読み込むことで初期転送量とパース負荷を最小化（将来の2027年以降番組追加や新国追加時も初期転送量100KB前後を維持）。
  - カレンダーやタイムラインの年送り操作で未取得年度（`loadedYears` 外）に遷移した際、バックグラウンドで該当年度 shard を非同期取得し、`addRacesForYear` で重複排除・日付時刻順ソートを行ってシームレスにマージ。
  - 該当年度 shard が存在しない場合の結合版 `races.json` への安全なフォールバックを実装。
  - Service Worker（Workbox）ランタイムキャッシュパターンを `/\/data\/(races(-[0-9]{4})?|index)\.json$/` に拡張し、BroadcastChannel によるバックグラウンド自動同期をサポート。
- **テスト・品質検証 (`tests/unit/raceSharding.test.ts`, `tests/unit/useRaces.test.ts`, `tests/unit/useRaceStore.test.ts`)**:
  - 分割・インデックス出力・ソート順整合性の単体テスト、オンデマンドフェッチ・フォールバック・ストアマージテストを配備。
  - 全63テストファイル・594テスト全件パス、TypeScript型チェック（tsc --noEmit）パス、プロダクションビルド成功。

### 過去のステップ: Step 70 (オーストラリア競馬（Racing Australia）の包括的統合) (Issue #192〜#197) [完了]
- **Step 70-1 (データ仕様策定・PRD改訂・スキーマ拡張) (Issue #192) [完了]**:
  - 一次データソース選定（IFHA Part I Australia 2026 リスト、Racing Australia 公式カレンダー）。
  - オーストラリア競馬データ仕様書（`docs/specs/data-sources/australia.md`）の作成（AEST/AEDT 南半球夏時間規則、競馬場一覧、出馬表・リザルト仕様）。
  - 新国追加ガイド（`docs/guides/adding-new-country.md`）の更新（RaceResultFetcher / リザルト自動化手順の明記、Issue #190準拠の公式URL方針明記、候補国表の更新）。
  - TypeScript 型定義（`src/types/race.ts`）の拡張（`Organization` に `'racing_australia'` を追加）。
  - 公式リンク方針の確定: Issue #190 に準拠し、オーストラリア競馬の各レースには推測URLを付与せず未設定（`undefined`）を保持。
- **Step 70-2 (オーストラリア重賞データ抽出・マスタ作成およびパイプライン統合) (Issue #193) [完了]**:
  - 2026年オーストラリアの全G1および主要重要競走（ジ・エベレスト、メルボルンカップ、コックスプレート、コーフィールドカップ、ゴールデンスリッパー等計74レース）をIFHA Part Iリストおよび公式スケジュールから構造化。
  - 日英仏中4言語レース名および主要競馬場（フレミントン、ランドウィック、コーフィールド、ローズヒル、ムーニーバレー、イーグルファーム、ドゥームベン、モーフェットビル、アスコット）の日英仏中辞書を定義した `src/data/australia_race_master.json` を配備。
  - 南半球タイムゾーン（AEST: UTC+10 / AEDT: UTC+11）の夏時間切替に対応したデータ変換モジュール `scripts/lib/australia-races.ts` を実装。
  - `scripts/parse-races.ts`（`npm run data:build`）に統合マージし、全74レースを `public/data/races.json` および年度別 shard へ正常出力。
  - 単体テスト `tests/unit/australiaRaces.test.ts` およびデータ整合性テスト `tests/unit/racesData.test.ts` を配備・全件パス。
- **Step 70-3 (発走予定時刻自動更新バッチ実装および過去発走時刻バックフィル) (Issue #194) [完了]**:
  - オーストラリア専用出馬表パーサーおよび確定時刻取得モジュール `scripts/lib/australia-syutsuba.ts` を実装。
  - 南半球夏時間（AEDT: UTC+11 / AEST: UTC+10）の正確な動的オフセット判定（`isAedt`）および州別タイムゾーン（NSW/VIC: AEDT/AEST, QLD: AEST, WA: AWST, SA: ACDT/ACST）に対応。
  - イギリス・アイルランド用ストップワードとの競合（Cup や Guineas の欠落による誤照合）を回避するオーストラリア専用トークナイザー `tokenizeAustralia` を構築。
  - `scripts/update-race-times.ts` に `AustraliaRaceTimeFetcher` を組み込み、デフォルトフェッチャーとして統合。
  - `package.json` に `"data:update-times:au"` スクリプトを追加し、個別実行および `--dry-run` に対応。
  - `.github/workflows/update-race-times.yml` にオーストラリア開催枠（毎週土曜 00:30 UTC = 09:30 JST）を追加。
  - `src/data/australia_race_master.json` の開催済み過去全レース（2026-10-03以前の全45レース）の発走確定時刻（現地時間およびUTC）をバックフィルし、`is_time_confirmed: true` を設定。
  - 公式リンク方針（Issue #190）を遵守し、出馬表URLの一時的な推測付与を排除し空値（`undefined`）を保持。
  - 単体・統合テスト `tests/unit/australiaSyutsuba.test.ts` を配備し、全65テストファイル・604テスト全件パスを達成。
- **Step 70-4 (レース結果・勝ち馬自動取得バッチ実装および過去勝ち馬バックフィル) (Issue #195) [完了]**:
  - オーストラリア専用レース結果パーサー `scripts/lib/australia-results.ts`（`parseAustraliaResultsJson`）を実装。
  - `scripts/update-race-results.ts` に `AustraliaRaceResultFetcher` を追加し、`DEFAULT_RESULT_FETCHERS` に統合（`racing_australia`, `au`, `australia`）。
  - `package.json` に `"data:update-results:au"` スクリプトを追加し、個別更新および `--dry-run` に対応。
  - `.github/workflows/update-race-results.yml` にオーストラリア開催直後取り込み枠（毎週土曜 05:30 UTC = 14:30 JST）を追加。
  - 2026年開催済みのオーストラリア主要G1全53レースの公式実在勝ち馬データ（ゴールデンスリッパー: Guest House / Zac Lloyd、ドンカスターマイル: Sheza Alibi / Jamie Kah、クイーンエリザベスS: Sir Delius / Craig Williams、オーストラリアンダービー: Green Spaces / Rachel King、エプソムH: God's Window / Siena Grima、ターンブルS: Cosmic Crusader / William Pike等）を一次ソースより特定し、`src/data/race_winners.json` および `public/data/races.json` にバックフィル。
  - 空値原則（Null Value Principle）の徹底: 11月へ日程変更された未開催の `2026-au-g1-01`（CF Orr Stakes）および未来レースは勝者を推測補完せず未設定（`undefined`）として厳格に保護。
  - 公式リンク方針（Issue #190）を遵守し、`official_url` は付与せず未設定（`undefined`）を保持。
  - 単体・統合・データ整合性テスト `tests/unit/australiaResults.test.ts` を配備し、全66テストファイル・613テスト全件パスを達成。
- **Step 70-5 (オーストラリア競馬UI対応) (Issue #196) [完了]**:
  - 主催者フィルターモーダル（`FilterBar`）に「オセアニア（🇦🇺 Oceania）」地域グループおよび「オーストラリア (Racing Australia)」チェック項目を追加。
  - デスクトップ用主催者セグメントコントロール（`orgOptions`）に「オーストラリア (Racing Australia)」を追加。
  - 競馬場フィルターパネルに「🇦🇺 オセアニア」クイック切替タブを追加し、豪州9競馬場（フレミントン、ランドウィック、コーフィールド、ローズヒル、ムーニーバレー、イーグルファーム、ドゥームベン、モーフェットビル、アスコット (豪)）の選択・一括操作に対応。
  - レースカード（`RaceCard`）および詳細モーダル（`RaceDetailDialog`）に「AU」国コードバッジ（アンバー色系）および「RACING AUSTRALIA」主催者バッジ・表記を配備。
  - カレンダーグリッド（`CalendarView`）のレースチップに「AU」国コードバッジおよび「AUS」主催者ラベルを統合。
  - 発走時刻確定ガイドダイアログ（`ConfirmedTimeHelpDialog`）にオーストラリア（Racing Australia）の公式発表・反映目安スケジュールを追加。
  - 免責事項ダイアログ（`DisclaimerDialog`）および静的フッターに Racing Australia の出典表記・権利表記を追加。
  - 地域判定・初期主催者選定ユーティリティ（`src/libs/geolocation.ts`）にオーストラリア（AU、`Australia/*`、`en-AU`）自動判定を追加。
  - レース原語判定（`src/libs/raceLanguage.ts`）に `AU` / `racing_australia`（英語原語）を追加。
  - 単体・統合・UIテスト（`tests/unit/FilterBar.test.tsx`, `tests/unit/RaceCard.test.tsx`, `tests/unit/RaceDetailDialog.test.tsx`, `tests/unit/ConfirmedTimeHelpDialog.test.tsx`, `tests/unit/geolocation.test.ts`, `tests/unit/DisclaimerDialog.test.tsx`, `tests/unit/Layout.test.tsx` 等）を配備・更新し、全66テストファイル・616テスト全件パス。
- **Step 70-6 (多言語辞書（日英仏中）対応およびローカライズ整備) (Issue #197) [完了]**:
  - `src/libs/i18n.ts` にオーストラリア主催者（`filter.orgAustralia`）、地域（`filter.regionOceania`、`filter.selectAllOceania`）、発走確定スケジュール、免責事項・フッター文言の日英仏中4言語完全対訳を配備。
  - 競馬場名変換ヘルパー（`getLocalizedCourseName`）に豪州9競馬場（フレミントン、ランドウィック、コーフィールド、ローズヒル、ムーニーバレー、イーグルファーム、ドゥームベン、モーフェットビル、アスコット (豪)）の4言語相互変換ロジックを統合。
  - `src/store/useRaceStore.ts` の `filterRaces` において、日本語名・英語名・フランス語名・繁体字中国語名（例: "The Everest" / "ジ・エベレスト" / "珠穆朗瑪峰錦標"）のいずれの入力に対しても即座にヒットする多言語検索処理を強化。
  - 英語圏レースの表示ルール（英語UI時は原語である英語名をメイン表示しサブ表記なしでスマートに表示）の動作を検証。
  - 辞書パリティテスト（`tests/unit/i18n.test.ts`）、検索フィルタテスト（`tests/unit/useRaceStore.test.ts`）、UI多言語レンダリングテスト（`tests/unit/RaceCard.test.tsx`）を配備・更新し、全66テストファイル・622テスト全件パス。
- **Step 70-7 (オーストラリア競馬G2・G3重賞データ欠落の是正) (Issue #199) [完了]**:
  - IFHA Part I Australia 2026 リストおよび Racing Australia 公式カレンダーより、登録漏れとなっていたG2競走（97レース）およびG3競走（174レース）の計271競走を抽出・構造化。
  - G2・G3で施行される新規17競馬場（サンダウン、ニューカッスル、ゴールドコースト、ケンブラグランジ、ホークスベリー、ベルモント (豪)、ホバート、ローンセストン、ジーロング、ベンディゴ、ゴスフォード、スコーン、サンシャインコースト、キャンベラ、パケナム、ワイロング、ノーザム）をマスタおよび `src/libs/i18n.ts`（日英仏中4言語辞書・コース変換）に追加（オーストラリア競馬場登録数を9場から全26場へ拡充）。
  - `src/data/australia_race_master.json` にG2（`2026-au-g2-01`〜`97`）およびG3（`2026-au-g3-01`〜`174`）を追加統合し、オーストラリア重賞総数を74レースから345レース（G1: 74, G2: 97, G3: 174）へ拡張。
  - `scripts/parse-races.ts` によるビルドで `public/data/races.json`（総レース数1,681件）および年度別 shard に同期。
  - 単体テスト `tests/unit/australiaRaces.test.ts`、データ整合性テスト `tests/unit/racesData.test.ts`、多言語テスト `tests/unit/i18n.test.ts` を拡充・更新し、全66テストファイル・622テスト全件パス、型検査・ビルド成功。
- **Step 70-8 (オーストラリア競馬G2・G3開催済みレースの勝ち馬バックフィル) (Issue #203) [完了]**:
  - 2026年開催済みのオーストラリアG2（73レース）・G3（123レース）の計196レースについて、公式一次ソース・準公式アーカイブ（Racing Australia、各州競馬統括団体、Racing Post、Wikipedia）に基づく確定勝ち馬データを特定し、`src/data/race_winners.json` に追加統合（勝者マスタ登録件数: 1,071件 -> 1,267件）。
  - `scripts/parse-races.ts`（`npm run data:build`）を実行し、`public/data/races.json` および年度別 shard に勝者データを完全同期。
  - 空値原則（Null Value Principle）の遵守: 2026年11月28日施行予定の `2026-au-g3-121`（Sandown Stakes）および10月6日以降の未来レースは勝者を推測補完せず未設定（`undefined`）として厳格に保持。
  - 公式リンク方針（Issue #190）の遵守: オーストラリア競馬には推測URLを付与せず `official_url: undefined` を厳格保持。
  - 単体・統合・データ整合性テスト `tests/unit/australiaResults.test.ts` を拡充し、全66テストファイル・623テスト全件パス、型検査・プロダクションビルド成功。

### 次期ロードマップ: フェーズ4 (将来拡張スコープ)
- **Step 71: 海外主要レースのさらなる拡張**:
  - UAE/ドバイ（ERA）、サウジアラビア（JCSA）等の重賞データ統合。
  - 各国公式出馬表フェッチャーの追加による確定発走時刻自動取得。
- **Step 72: リアルタイム馬場状態・天候情報の表示**:
  - レース当日の天候（晴・雨等）および馬場状態（良・稍重・重・不良）のリアルタイム取得とバッジ表示。
- **Step 73: カレンダー連携（iCalendar / Google Calendar 出力）**:
  - お気に入りレースや特定条件レースをワンクリックで外部カレンダーアプリへ登録できる `.ics` エクスポート機能。