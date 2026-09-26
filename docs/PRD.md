# 重賞カレンダーサービス プロダクト要求仕様書 (PRD)

| 項目 | 内容 |
| :--- | :--- |
| **プロダクト名** | horse-racing-calendar Web アプリケーション |
| **作成日** | 2026年9月12日 (最終更新: 2026年9月26日) |
| **バージョン** | v1.33.1 (複数国選択時のラベル長超過によるリセットボタンはみ出しおよび画面横揺れ・ヘッダー固定解除の解消) |
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
- **フローティング「今日へ戻る」ボタン**: 画面スクロール時にワンタップで今日へ戻るアクションボタンを提供。
- **カード情報構成**: 開催日、発走時刻（JST自動換算・確定/未確定バッジ）、国コード、グレード、レース名（日英仏中）、競馬場、馬場、距離、出走資格、斤量区分。

### 4.2 月間カレンダービュー (`CalendarView`)
- **デフォルト初期表示**: PC・タブレット画面幅（`>= 768px`）においてデフォルト表示。
- **カレンダーグリッド**: 月曜始まり・土日連続の7列グリッド。各日付セルに重賞チップをコンパクト配置。
- **確定時刻表示**: 公式発表前の未確定レースは日付セル内で時刻を非表示化し省スペース化。

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
  - コントロール行（主催者・詳細トグル・リセット）の最適幅制御および `html, body` / `Layout` への `overflow-x: clip` 適用により、モバイルでの画面横揺れとヘッダー/FilterBarの `position: sticky` 解除を防止。

### 4.4 レース詳細ダイアログ (`RaceDetailDialog`)
- レースカードまたはカレンダーチップのクリックで展開。
- 原語表記（日本語、英語、フランス語 `fr`、繁体字中国語 `zh`）の併記。
- 正式出走資格、斤量規定、競馬場名、公式確定発走時刻、免責事項への導線。

### 4.5 PWA & オフライン対応
- **キャッシュ戦略**: Workbox による静的アセットの完全事前キャッシュおよび `races.json` の `Stale-While-Revalidate`。
- **画面自動反映**: `BroadcastUpdatePlugin` によるバックグラウンド最新データの自動画面反映。
- **インストール促進案内**: Android用インストールバナーおよびiOS Safari用ホーム画面追加ガイド（`PwaInstallPrompt`）。

### 4.6 多言語（i18n）仕様
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

### 現在地: Step 40 (複数国選択時のラベル長超過によるリセットボタンはみ出し・横揺れ・sticky固定解除の解消) [完了]
- 複数主催者・開催国選択時の短縮ラベルキー（`filter.orgSelectShort`）新設と全4言語（ja, en, fr, zh）対応（「地域 (N)」「Regions (N)」等）。
- FilterBar モバイルコントロール行の最適幅制御（`max-w-[85px]`、ラベルテキストの truncate）によるリセットボタン枠外押し出し防止。
- `html, body` および `Layout` への `overflow-x: clip` 適用による横スクロール・横揺れ防止、およびヘッダー/FilterBarの `position: sticky` 解除防止ガード。
- 単体テストの拡充（複数国選択時の表示確認等）および全461件テスト通過確認。

### 次期ロードマップ: フェーズ4 (将来拡張スコープ)
- **Step 41: 海外主要レースのさらなる拡張**:
  - オーストラリア（Racing Australia / IFHA Part I）、UAE/ドバイ（ERA）等の重賞データ統合。
  - 各国公式出馬表フェッチャーの追加による確定発走時刻自動取得。
- **Step 42: リアルタイム馬場状態・天候情報の表示**:
  - レース当日の天候（晴・雨等）および馬場状態（良・稍重・重・不良）のリアルタイム取得とバッジ表示。
- **Step 43: カレンダー連携（iCalendar / Google Calendar 出力）**:
  - お気に入りレースや特定条件レースをワンクリックで外部カレンダーアプリへ登録できる `.ics` エクスポート機能。