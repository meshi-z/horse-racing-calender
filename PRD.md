# 重賞カレンダーサービス プロダクト要求仕様書 (PRD)

| 項目 | 内容 |
| :--- | :--- |
| **プロダクト名** | horse-racing-calendar Web アプリケーション (MVP) |
| **作成日** | 2026年9月5日 |
| **バージョン** | v1.2.0 (MVP) |
| **配信形式** | SPA / PWA (GitHub Pages ホスティング) |

---

## 1. プロジェクト概要

本プロダクト（`horse-racing-calendar`）は、JRA（日本中央競馬会）の重賞レース（G1, G2, G3等）を中心に、年間・月間の開催スケジュールを視覚的かつ軽快に確認できるWebアプリケーションである。

モバイル閲覧時はタイムライン形式、PC/タブレット閲覧時は月間カレンダー形式を初期表示とし、PWAおよびオフライン閲覧に対応することで、競馬場や外出先などの電波状況が不安定な環境でもストレスなくアクセスできる体験を提供する。

---

## 2. コア要件およびビジョン

### フェーズ1 (MVP / 現在のスコープ)
- JRA公式提供の `.ics`（iCalendar）＋データ補完マスターによるビルド処理
- ユーザー登録不要のオープン型SPA
- GitHub Pages による完全静的ホスティング（コスト0運用）
- PWA & Service Worker によるオフライン高速閲覧

### フェーズ2 (将来拡張)
- i18n 多言語切り替え（`title_jp` / `title_en`、`racecourse_jp` / `racecourse_en` 等を活用した多言語表示）
- NAR（地方競馬ダートグレード）および海外主要レース（米・豪・香港・サウジ・ドバイ・欧州）の拡張
- GitHub Actions による `.ics` 自動パッチ＆ビルドバッチ化
- 距離別・トラック（芝/ダート/障害）別フィルタリング機能追加

---

## 3. デザイン・カラーパレット仕様

公式の重賞ブランド表記および動画帯色に準拠した視認性の高い配色ルールを適用する。

| グレード | カラーネーム | カラーコード (HEX) | 適用対象 | 備考 |
| :--- | :--- | :--- | :--- | :--- |
| **G1 / J.G1** | ブルー (Blue) | `#2563EB` | バッジ / レース枠線 | JRA公式の最高峰グレードカラー |
| **G2 / J.G2** | レッド (Red) | `#DC2626` | バッジ / レース枠線 | 主要ステップレース |
| **G3 / J.G3** | グリーン (Green) | `#16A34A` | バッジ / レース枠線 | 重賞競走 |

---

## 4. UI/UX 仕様

### 4.1 レスポンシブ初期ビューおよび表示切替
- **モバイル表示（画面幅 < 768px）:** 直近および今後のレースを時系列で追える **「タイムラインビュー」** を初期表示。
- **デスクトップ/タブレット表示（画面幅 >= 768px）:** 全体感を把握できる **「月間カレンダービュー」** を初期表示。
- **ユーザー設定の永続化:** ユーザーがヘッダーの切替スイッチでビューを変更した場合、`localStorage` に保存し、次回訪問時は設定されたビューを初期表示。

### 4.2 タイムゾーン自動変換（グローバル対応）
- JSON内の発走時刻（UTC）を、クライアント側で端末のローカルタイムゾーン（例: ブラウザのタイムゾーン）に変換して表示。

### 4.3 フィルタリング機能
- **重賞グレード絞り込み:** All / G1 / G2 / G3
- **競馬場絞り込み:** 東京、中山、阪神、京都などの開催地による絞り込み（`racecourse_jp` / `racecourse_en` 対応）
- **トラック（馬場）絞り込み:** 芝 (Turf) / ダート (Dirt) / 障害 (Jump)
- **（将来拡張フィールド）:** 国・団体コード、多言語表示切替、距離区分

---

## 5. データアーキテクチャ & パイプライン

### 5.1 競馬用語標準化ルール（JRA公式用語集準拠）
レース名、競馬場名 (`racecourse`)、トラック種別、競馬用語などの英字・日本語対応は、JRA公式の海外競馬用語集マスターを基準として定義・統一する。

> **用語マスターソース:** [https://www.jra.go.jp/keiba/overseas/yougo/index.html](https://www.jra.go.jp/keiba/overseas/yougo/index.html)

### 5.2 データ補完マスター構造 (`src/data/race_master.json`)
JRA公式 `.ics` に含まれない「日本語タイトル (`title_jp`)」「英語タイトル (`title_en`)」「日本語競馬場名 (`racecourse_jp`)」「英語競馬場名 (`racecourse_en`)」「デフォルト発走時刻（JST）」「コース種別 (`surface`)」「距離」を補完するための辞書データ。

```json
{
  "府中牝馬ステークス": {
    "title_jp": "府中牝馬ステークス",
    "title_en": "Fuchu Himba Stakes",
    "racecourse_jp": "東京競馬場",
    "racecourse_en": "Tokyo Racecourse",
    "default_time_jst": "15:45",
    "surface": "Turf",
    "distance_m": 1800
  },
  "桜花賞": {
    "title_jp": "桜花賞",
    "title_en": "Ouka Sho (Japanese 1000 Guineas)",
    "racecourse_jp": "阪神競馬場",
    "racecourse_en": "Hanshin Racecourse",
    "default_time_jst": "15:40",
    "surface": "Turf",
    "distance_m": 1600
  }
}
```

### 5.3 統合拡張 JSON スキーマ定義 (`public/data/races.json`)
パーサーが `.ics` と `race_master.json` を結合して生成する統合出力データ。

```json
{
  "$schema": "[http://json-schema.org/draft-07/schema#](http://json-schema.org/draft-07/schema#)",
  "version": "1.2.0",
  "updated_at": "2026-09-05T18:00:00Z",
  "races": [
    {
      "id": "jra-2026-fuchu-himba-s",
      "title_jp": "府中牝馬ステークス",
      "title_en": "Fuchu Himba Stakes",
      "grade": "G3",
      "organization": "JRA",
      "country_code": "JP",
      "racecourse_jp": "東京競馬場",
      "racecourse_en": "Tokyo Racecourse",
      "surface_jp": "芝",
      "surface_en": "Turf",
      "distance_m": 1800,
      "start_time": "2026-06-21T06:45:00Z",
      "time_zone": "Asia/Tokyo"
    }
  ]
}
```

### 5.4 .ics パーサー (結合変換ロジック) 要件

- JRA公式 `.ics` の `SUMMARY` から正規表現で「レース名」と「グレード (G1/G2/G3/J.G1等)」を抽出。
- `DTSTART` から「開催日」、`LOCATION` から「開催競馬場」を取得。
- レース名をキーにして `race_master.json` を参照し、`title_jp` / `title_en` / `racecourse_jp` / `racecourse_en` / `surface_jp` / `surface_en`/ `distance_m` を補完。
- JRA公式用語集（https://www.jra.go.jp/keiba/overseas/yougo/index.html）の表記ルールに準拠（`venue` ではなく `racecourse` に統一）。
- 開催日と `default_time_jst` を組み合わせ、UTC 形式 (`Z`) に変換 して `start_time` に格納。

---

## 6. 技術スタック選定基準

- **フロントエンド**: React + TypeScript (Vite) または Next.js (SSG)
- **スタイリング**: Tailwind CSS
- **PWA / Cache**: `vite-plugin-pwa` (Workbox)
- **インフラ**: GitHub Pages (GitHub Actions でビルド・デプロイ)
- **セキュリティ・品質方針**: 活発なオープンソースコミュニティを持つライブラリで構成し、GitHub Dependabot を有効化して脆弱性を自動でアップデート・検知。

---

## 7. Antigravity 連携手順

1. Step 1: リポジトリ直下に本 PRD（`PRD.md`）および JRA公式用語集対応の `src/data/race_master.json` を配置。
2. Step 2: JRA公式の `jrarace2026.ics` と `race_master.json` をガッチャンコして `title_jp`/`title_en`・`racecourse_jp`/`racecourse_en`・UTC時間の `races.json` を生成するビルドスクリプトを作成・テスト。
3. Step 3: Vite + React + Tailwind CSS のプロジェクト構造作成と PWA 構成。
4. Step 4: タイムライン & カレンダービュー、タイムゾーン自動変換、トラック/グレード絞り込み機能の実装。