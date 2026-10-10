# 重賞カレンダーサービス プロダクト要求仕様書 (PRD)

| 項目 | 内容 |
| :--- | :--- |
| **プロダクト名** | horse-racing-calendar Web アプリケーション |
| **作成日** | 2026年9月12日 (最終更新: 2026年10月6日) |
| **バージョン** | v1.44.8 (postcss-selector-parser 脆弱性解消 & Dependabot 破壊的更新抑止) |
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

本プロダクトは、段階的なアプローチで国内外の主要競馬データの統合、ユーザー体験の向上、および高信頼なデータ運用基盤の構築を進めている。過去の詳細な実装変更記録（各Step・バージョンの差分詳細）は [docs/CHANGELOG.md](file:///c:/Users/meshi/git/horse-racing-calender/docs/CHANGELOG.md) を参照。

### 7.1 開発フェーズの変遷と現在ステータス

- **フェーズ1: 国内競馬基盤 & PWA基礎 (v1.0.0 〜 v1.20.0) [完了]**:
  - JRA（中央競馬）および NAR（地方競馬・ばんえい競馬）の全重賞データ基盤を構築。
  - タイムライン形式および月間カレンダー形式のハイブリッドUI、PWAオフライン対応、確定発走時刻自動更新バッチを稼働。
- **フェーズ2: 海外主要競馬の統合 (v1.21.0 〜 v1.44.3) [完了]**:
  - 世界主要6カ国・7競馬統括団体（フランス・イギリス・アメリカ・香港・アイルランド・オーストラリア）の重賞スケジュールを順次統合。
  - 全1,680+レースの年間スケジュールを一元化し、各国タイムゾーン・夏時間・馬場・距離・条件の完全正規化を達成。
- **フェーズ3: パフォーマンス・自動化・多言語・運用基盤 (v1.35.0 〜 v1.44.8) [完了 / 現在地]**:
  - 各国公式一次ソースに基づく勝ち馬（優勝馬）自動抽出パイプラインおよび二重永続化（`race_winners.json` / `races.json`）を確立。
  - IntersectionObserver によるタイムライン仮想スクロール（DOMノード数97.9%削減）および年度別データ分割（Sharding）によるオンデマンド読み込みを導入。
  - 日・英・仏・繁体字中の4言語完全ローカライズ、言語別URLパス・OGP、定期バッチからの本番GitHub Pages自動デプロイ連動（`workflow_call`）、モバイルヘッダー最適化を達成。
- **フェーズ4: 将来拡張スコープ (次期ロードマップ) [計画中]**:
  - 中東主要重賞（UAE、サウジアラビア）の追加、2027年以降の番組自動移行、リアルタイム馬場・天候情報、カレンダー連携（.ics出力）。

### 7.2 主要マイルストーン達成実績

| マイルストーン | 対象バージョン | 主な達成内容・機能 |
| :--- | :--- | :--- |
| **M1: 国内重賞基盤 & PWA UI** | v1.0.0 〜 v1.20.0 | JRA全重賞（平地・障害）、NARダートグレード・南関・地方・ばんえい全重賞の統合。タイムライン／カレンダー両形式、PWAオフライン対応、確定発走時刻更新バッチ稼働。 |
| **M2: 国際競馬の包括統合** | v1.21.0 〜 v1.44.3 | フランス（France Galop）、イギリス（BHA）、アメリカ（Equibase）、香港（HKJC）、アイルランド（HRI）、オーストラリア（Racing Australia）の重賞・主要競走を網羅。7主催者・1,680+レースの一元化。 |
| **M3: 4言語完全ローカライズ & SEO** | v1.16.0 〜 v1.42.0 | 日本語、英語、フランス語、繁体字中国語の完全多言語対応。レース名・競馬場名・出走条件の対訳辞書、言語別URLパス（`/ja/`, `/en/`, `/fr/`, `/zh/`）、言語別静的OGP出力。 |
| **M4: 公式リザルト自動更新パイプライン** | v1.35.0 〜 v1.44.4 | 各国公式一次ソース（JRAデータベース、NAR当日メニュー、PMU、Sporting Life、HKJC等）に基づく勝ち馬自動パース、二重永続化、確定時刻・勝者の定期巡回バッチとGitHub Pages自動デプロイ連動。 |
| **M5: 超高速化 & データ最適化 (NFR)** | v1.40.0 〜 v1.43.0 | 非機能要件仕様書（NFR）策定。タイムライン仮想スクロール導入（同時展開DOM数を6万から1,200へ97.9%削減、INP大幅改善）。年度別データ分割（Sharding）による初期転送量・メモリ最適化。 |
| **M6: モバイルUX & 運用基盤堅牢化** | v1.44.5 〜 v1.44.13 | 狭小モバイル画面（360px〜）でのヘッダーレイアウト最適化（タイトル改行防止、タブアイコン化、幅収容）。AIエージェント一時ファイル管理規約の確立・ワークスペース外統一。PRDロードマップの適正化。postcss-selector-parser 脆弱性解消（overrides）および Dependabot 破壊的メジャー更新抑止設定（Tailwind CSS v4、Node 22 ランタイム整合性維持のための @types/node、エコシステム互換性維持のための TypeScript 7）。依存関係の一括安定更新（vite, @radix-ui/react-tabs, lucide-react, tsx）。定期バッチ連動時の Reusable Workflow（`workflow_call`）入力パラメータ（`inputs.checkout_latest`）による最新HEADチェックアウト保証と自動デプロイ整合性の確立。TypeScript 6.0+/7.0 に向けた `tsconfig.json` 非推奨オプション `baseUrl` 削除とモダンなパスエイリアス設定移行。 |

### 7.3 次期ロードマップ: フェーズ4 (将来拡張計画)

- **Step 71: 海外主要レースのさらなる拡張**:
  - UAE/ドバイ（Emirates Racing Authority: ERA）主要重賞（ドバイワールドカップデー等）。
  - サウジアラビア（Jockey Club of Saudi Arabia: JCSA）主要重賞（サウジカップデー等）。
  - 各国公式出馬表フェッチャーの追加による確定発走時刻自動取得。
- **Step 72: リアルタイム馬場状態・天候情報の表示**:
  - レース当日の天候（晴・雨等）および馬場状態（良・稍重・重・不良 / Firm, Good, Soft, Heavy）のリアルタイム取得とバッジ表示。
- **Step 73: カレンダー連携（iCalendar / Google Calendar 出力）**:
  - お気に入りレースや特定条件レースをワンクリックで外部カレンダーアプリへ登録できる `.ics` エクスポート機能。
- **Step 74: 2027年以降の番組スケジュール追加・自動移行**:
  - 2027年以降の公式番組発表に伴う年度別 shard（`races-2027.json`）の自動生成とクライアント側オンデマンド切り替えの検証。