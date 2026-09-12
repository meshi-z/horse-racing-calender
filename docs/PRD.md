# 重賞カレンダーサービス プロダクト要求仕様書 (PRD)

| 項目 | 内容 |
| :--- | :--- |
| **プロダクト名** | horse-racing-calendar Web アプリケーション (MVP) |
| **作成日** | 2026年9月12日 |
| **バージョン** | v1.5.0 |
| **配信形式** | SPA / PWA (GitHub Pages ホスティング) |

---

## 1. プロジェクト概要

本プロダクト（`horse-racing-calendar`）は、JRA（日本中央競馬会）の重賞レース（G1, G2, G3等）を中心に、年間・月間の開催スケジュールを視覚的かつ軽快に確認できるWebアプリケーションである。

モバイル閲覧時はタイムライン形式、PC/タブレット閲覧時は月間カレンダー形式を初期表示とし、PWAおよびオフライン閲覧に対応することで、競馬場や外出先などの電波状況が不安定な環境でもストレスなくアクセスできる体験を提供する。

UIライブラリには **Shadcn UI** (Radix UI + Tailwind CSS) を全面採用し、モダンで洗練されたデザインと、Radix UI 由来の高いアクセシビリティ（キーボード操作・WAI-ARIA準拠）を両立したユーザー体験を実現する。

---

## 2. コア要件およびビジョン

### フェーズ1 (MVP / 現在のスコープ)

- JRA重賞一覧ページ（`jyusyo.html`）からデータ補完マスターを作成
- 公式 `.ics`（iCalendar）からの当年のデータ取得、データ補完マスターとマージして当年のレース情報を作成
- ユーザー登録不要のオープン型SPA
- GitHub Pages による完全静的ホスティング（コスト0運用）
- PWA & Service Worker によるオフライン高速閲覧
- Shadcn UI によるコンポーネント基盤の構築とアクセシビリティ（a11y）確保

### フェーズ2 (将来拡張)

- i18n 多言語切り替え（`title_jp` / `title_en`、`racecourse_jp` / `racecourse_en` 等を活用した多言語表示）UIスイッチ実装
- NAR（地方競馬ダートグレード）および海外主要レース（米・豪・香港・サウジ・ドバイ・欧州）の拡張
- GitHub Actions による `.ics` 自動パッチ＆ビルドバッチ化
- 性別・年齢・距離区分・馬場種別（芝/ダート/障害）による高度なフィルタリング機能追加（Shadcn UI の `Select` / `Popover` / `Command` を活用）

---

## 3. デザイン・カラーパレット仕様 (Shadcn UI 準拠)

### 3.1 デザインシステム方針
- **Shadcn UI (https://ui.shadcn.com/docs)** のコンポーネント設計および Tailwind CSS デザイントークン（CSS Variables）を採用する。
- **ベースプリミティブ:** Radix UI をアクセシビリティ層として使用し、キーボード操作・フォーカス管理・スクリーンリーダー対応を標準で確保する。
- **テーマ設定:** Shadcn UI 標準のニュートラルカラー（Slate / Zinc / Stone 等）をベースに、CSS変数 (`--primary`, `--background` 等) でテーマを管理。

### 3.2 カラーパレット＆重賞グレードバッジ

Shadcn UI の `Badge` コンポーネントおよび Tailwind CSS カラーシステムを適用し、コントラスト比（WCAG 2.1 AA 準拠）を満たす配色を設定する。

| グレード | カラーネーム | カラーコード (HEX / Tailwind) | 文字色 / 境界線 | 備考・アクセシビリティ配慮 |
| :--- | :--- | :--- | :--- | :--- |
| **G1 / J.G1** | Blue (G1) | `#1D4ED8` (`bg-blue-700`) | 白文字 (`#FFFFFF`) | 視認性の高いダークブルーバッジ |
| **G2 / J.G2** | Red (G2) | `#B91C1C` (`bg-red-700`) | 白文字 (`#FFFFFF`) | 高コントラストのダークレッドバッジ |
| **G3 / J.G3** | Green (G3) | `#15803D` (`bg-green-700`) | 白文字 (`#FFFFFF`) | 識別しやすいダークグリーンバッジ |

---

## 4. UI/UX 仕様 (Shadcn UI コンポーネント構成)

### 4.1 レスポンシブ初期ビューおよび表示切替

- **モバイル表示（画面幅 < 768px）:** 直近および今後のレースを時系列で追える **「タイムラインビュー」** を初期表示。
- **デスクトップ/タブレット表示（画面幅 >= 768px）:** 全体感を把握できる **「月間カレンダービュー」** を初期表示。
- **ビュー切替コンポーネント:** Shadcn UI の `Tabs` または `ToggleGroup` を使用。
- **ユーザー設定の永続化:** ユーザーの選択状態を `localStorage` に保存。

### 4.2 アクセシビリティ & コンポーネント要件

- **キーボードナビゲーション:** Radix UI プリミティブにより、Tab / Shift+Tab / 矢印キーで完全操作可能。
- **フォーカスインジケーター:** Shadcn UI 標準の `focus-visible:ring-2 focus-visible:ring-ring` による明確なアウトライン表示。
- **ダイアログ/モーダル:** レース詳細表示には Shadcn UI の `Dialog` または `Drawer` (モバイル向け) を使用。

### 4.3 タイムゾーン自動変換（グローバル対応）

- JSON内の発走時刻（UTC）を、クライアント側で端末のローカルタイムゾーンに変換して表示。

### 4.4 フィルタリング機能

- **UI構成:** Shadcn UI の `Select` / `DropdownMenu` / `Badge` を使用したフィルターバー。
- **条件:** グレード、競馬場、トラック（芝/ダート/障害）、出走性別制限、出走年齢制限。
- **（将来拡張フィールド）**: 国・団体コード、多言語表示切替、距離区分

---

## 5. データアーキテクチャ & パイプライン

### 5.1 競馬用語標準化ルール（JRA公式用語集準拠）

レースマスター情報および条件データの一次情報源として、JRA公式の重賞日程ページおよび用語集を使用する。

> **JRA重賞レースソース:** [重賞レース一覧](https://www.jra.go.jp/datafile/seiseki/replay/2026/jyusyo.html)

> **用語マスターソース:** [海外競馬英和辞典](https://www.jra.go.jp/keiba/overseas/yougo/index.html)

### 5.2 データパース & 分割ルール

#### A. 「性齢（出走資格）」の分離・構造化

原本データ表記（例: 「3歳以上」「3歳牝馬」「2歳牡・牝」）を解析し、「性（Sex）」と「齢（Age）」に分割して日本語および英語のプロパティを割り当てる。

- **性制限 (sex_restriction):**
  - 「牝馬」「牝」表記あり $\rightarrow$ `sex_restriction_jp: "牝"`, `sex_restriction_en: "Fillies & Mares"`
  - 制限なし/「牡・牝」 $\rightarrow$ `sex_restriction_jp: "牡・牝"`, `sex_restriction_en: "Open to All"`
- **年齢制限 (age_restriction):**
  - 「2歳」 $\rightarrow$ `age_restriction_jp: "2歳"`, `age_restriction_en: "2yo"`
  - 「3歳以上」 $\rightarrow$ `age_restriction_jp: "3歳以上"`, `age_restriction_en: "3yo & Up"`
  - 「4歳以上」 $\rightarrow$ `age_restriction_jp: "4歳以上"`, `age_restriction_en: "4yo & Up"`

#### B. 「コース」の分離（馬場・距離）

原本データ表記（例: 「芝1,600メートル」「ダート1,800メートル」「障害3,100メートル」）を正規表現で抽出し、種別と数値に分離する。

- **馬場 (surface):**
  - 「芝」 $\rightarrow$ `surface_jp: "芝"`, `surface_en: "Turf"`
  - 「ダート」 $\rightarrow$ `surface_jp: "ダート"`, `surface_en: "Dirt"`
  - 「障害」 $\rightarrow$ `surface_jp: "障害"`, `surface_en: "Jump"`
- **距離 (distance_m):**
  - カンマや「メートル」を除去し、整数型 (number) として保持（例: `1600`）。

#### C. 発走時刻の取得・決定パイプライン

発走時刻は「デフォルト推定値」と「直前確定値」の2段階構成で管理する。

1. **初期推定値の設定（年間ビルド時）:**
   - 重賞（平地11R中心）: 原則 `15:40` JST（一部関西等 `15:45` JST）を初期値としてセット。
   - 障害重賞 (J.G1〜J.G3): `13:50`〜`14:30` JST の規定時間帯をセット。
   - `is_time_confirmed: false` としてフラグ管理。
2. **直前確定値の上書き更新（開催直前ビルド時）:**
   - 開催週（木曜日以降）にJRA公式出馬表ページから正確な確定発走時刻をスクレイピング取得。
   - 確定時刻で `start_time` を更新し、`is_time_confirmed: true` に変更。

### 5.3 データ補完マスター構造 (`src/data/race_master.json`)

JRA公式 `.ics` に含まれないフィールド（日本語/英語タイトル・競馬場名・デフォルト発走時刻・性・齢・馬場・距離）を補完するための辞書データ。

```json
{
  "府中牝馬ステークス": {
    "title_jp": "府中牝馬ステークス",
    "title_en": "Fuchu Himba Stakes",
    "racecourse_jp": "東京競馬場",
    "racecourse_en": "Tokyo Racecourse",
    "default_time_jst": "15:45",
    "sex_restriction_jp": "牝",
    "sex_restriction_en": "Fillies and Mares",
    "age_restriction_jp": "3歳以上",
    "age_restriction_en": "3yo & Up",
    "surface_jp": "芝",
    "surface_en": "Turf",
    "distance_m": 1800
  },
  "皐月賞": {
    "title_jp": "皐月賞",
    "title_en": "Satsuki Sho (Japanese 2000 Guineas)",
    "racecourse_jp": "中山競馬場",
    "racecourse_en": "Nakayama Racecourse",
    "default_time_jst": "15:40",
    "sex_jp": "牡・牝",
    "sex_en": "Open to ALL",
    "age_jp": "3歳",
    "age_en": "3yo",
    "surface_jp": "芝",
    "surface_en": "Turf",
    "distance_m": 2000
  }
}

```

### 5.5 .ics パーサー (結合変換ロジック) 要件

- JRA公式 `.ics` の `SUMMARY` から正規表現で「レース名」と「グレード (G1/G2/G3/J.G1等)」を抽出。
- `DTSTART` から「開催日」、`LOCATION` から「開催競馬場」を取得。
- レース名をキーにして `race_master.json` を参照し、各フィールドを補完。
- JRA公式用語集の表記ルールに準拠（`venue` ではなく `racecourse` に統一）。
- 開催日と `default_time_jst`（確定時は出馬表の確定時刻）を組み合わせ、UTC 形式 (`Z`) に変換して `start_time` に格納。

---

## 6. 技術スタック選定基準

- **フロントエンド**: React + TypeScript (Vite)
- **UIライブラリ / CSS**: Shadcn UI + Tailwind CSS (`shadcn-ui` CLI で生成するコンポーネント)
- **PWA / Cache**: `vite-plugin-pwa` (Workbox)
- **インフラ**: GitHub Pages (GitHub Actions でビルド・デプロイ)
- **セキュリティ・品質方針**: GitHub Dependabot の有効化、axe-core / Lighthouse による a11y 自動チェック。

---

## 7. Antigravity 連携手順

1. Step 1: リポジトリ直下に本 PRD（`PRD.md`）および `AGENTS.md`（Shadcn UI 準拠ルール）を配置。
2. Step 2: JRA公式の`jrarace2026.ics`と`jyusyo.html`を結合して `races.json`を出力するデータ生成スクリプトを作成。
3. Step 3: `npx shadcn-ui@latest init`により Shadcn UI + Tailwind CSS を初期化。
4. Step 4: Shadcn UI コンポーネント（`Card`, `Badge`, `Tabs`, `Select`, `Dialog`等）を使用してタイムライン / カレンダービューおよびフィルタリング機能を実装。