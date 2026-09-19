# 重賞カレンダーサービス プロダクト要求仕様書 (PRD)

| 項目 | 内容 |
| :--- | :--- |
| **プロダクト名** | horse-racing-calendar Web アプリケーション |
| **作成日** | 2026年9月12日 (最終更新: 2026年9月19日) |
| **バージョン** | v1.5.0 |
| **配信形式** | SPA / PWA (GitHub Pages ホスティング) |

---

## 1. プロジェクト概要

本プロダクト（`horse-racing-calendar`）は、JRA（日本中央競馬会）の重賞レース（G1, G2, G3等）を中心に、年間・月間の開催スケジュールを視覚的かつ軽快に確認できるWebアプリケーションである。

モバイル閲覧時はタイムライン形式、PC/タブレット閲覧時は月間カレンダー形式を初期表示とし、PWAおよびオフライン閲覧に対応することで、競馬場や外出先などの電波状況が不安定な環境でもストレスなくアクセスできる体験を提供する。

UIライブラリには **Shadcn UI** (Radix UI + Tailwind CSS) を全面採用し、モダンで洗練されたデザインと、Radix UI 由来の高いアクセシビリティ（キーボード操作・WAI-ARIA準拠）を両立したユーザー体験を実現する。

---

## 2. コア要件およびビジョン

### フェーズ1 (MVP / 実装完了スコープ)

- JRA重賞一覧ページ（`jyusyo.html`）からデータ補完マスターを作成 [完了]
- JRA公式サイトからの公式 `.ics` / ZIP 自動ダウンロード・展開・マージパイプラインの実装（`jra-calendar.ts`） [完了]
- 開催週のJRA公式出馬表から確定発走予定時刻を取得し、自動更新するパイプラインの実装（`jra-syutsuba.ts`, `update-race-times.ts`） [完了]
  - 相手先サーバー負荷軽減のための早期終了ガード・指数バックオフリトライ搭載
  - 将来のNAR・海外競馬拡張を見据えたプロバイダーアーキテクチャ（Strategyパターン）の導入
- i18n（国際化）を見据えた Localized Object 形式 `{ ja, en }` によるデータ構造化 [完了]
- ユーザー登録不要のオープン型SPA [完了]
- GitHub Pages による完全静的ホスティング（コスト0運用） [完了]
- GitHub Actions による CI/CD（自動テスト・ビルド・GitHub Pages デプロイ）および確定時刻の定期自動更新バッチ（cron）の整備 [完了]
- PWA & Service Worker によるオフライン高速閲覧 [完了]
- Shadcn UI によるコンポーネント基盤の構築とアクセシビリティ（a11y）確保 [完了]
- 発走ステータスバッジの改善（レース終了後の自動非表示、発走前の「発走予定」統一） [完了]
- GitHub Dependabot による依存関係セキュリティ監視の有効化 [完了]

### フェーズ2 (将来拡張)

- NAR（地方競馬ダートグレード）および海外主要レース（米・豪・香港・サウジ・ドバイ・欧州）の拡張
  - `RaceTimeFetcher` プロバイダーアーキテクチャへの `NarRaceTimeFetcher` / `OverseasRaceTimeFetcher` 追加
  - `organization` フィールドおよび拡張ID体系を活用
- i18n 多言語切り替え（`name.ja` / `name.en`、`course.ja` / `course.en`、`handicap.ja` / `handicap.en` 等を活用した多言語表示）UIスイッチ実装
- 性別・年齢・距離区分・馬場種別（芝/ダート/障害）による高度なフィルタリング機能追加（Shadcn UI の `Select` / `Popover` / `Command` を活用）
- タイムラインビューにおける現在日（直近レース）へのワンタップジャンプ機能・当日開催レースの強調表示

---

## 3. デザイン・カラーパレット仕様 (Shadcn UI 準拠)

### 3.1 デザインシステム方針
- **Shadcn UI (https://ui.shadcn.com/docs)** のコンポーネント設計および Tailwind CSS デザイントークン（CSS Variables）を採用する。
- **ベースプリミティブ:** Radix UI をアクセシビリティ層として使用し、キーボード操作・フォーカス管理・スクリーンリーダー対応を標準で確保する。
- **テーマ設定:** Shadcn UI 標準のニュートラルカラー（Slate / Zinc / Stone 等）をベースに、CSS変数 (`--primary`, `--background` 等) でテーマを管理。

### 3.2 カラーパレット＆重賞グレードバッジ

Shadcn UI の `Badge` コンポーネントおよび Tailwind CSS デザイントークン（CSS Variables）を適用し、コントラスト比（WCAG 2.1 AA 準拠: 4.5:1 以上）を満たすセマンティックカラーを設定する。コンポーネント内への直接のカラーコードハードコードは行わず、CSS 変数を介して管理する。

| グレード | セマンティックトークン | カラーコード (HEX / Tailwind) | 文字色トークン | 備考・アクセシビリティ配慮 |
| :--- | :--- | :--- | :--- | :--- |
| **G1 / J.G1** | `--grade-g1` | `#1D4ED8` (`bg-grade-g1`) | `--grade-g1-foreground` (`#FFFFFF`) | コントラスト比 7.42:1（WCAG AA 適合） |
| **G2 / J.G2** | `--grade-g2` | `#B91C1C` (`bg-grade-g2`) | `--grade-g2-foreground` (`#FFFFFF`) | コントラスト比 7.02:1（WCAG AA 適合） |
| **G3 / J.G3** | `--grade-g3` | `#15803D` (`bg-grade-g3`) | `--grade-g3-foreground` (`#FFFFFF`) | コントラスト比 5.86:1（WCAG AA 適合） |

---

## 4. UI/UX 仕様 (Shadcn UI コンポーネント構成)

### 4.1 レスポンシブ初期ビューおよび表示切替

- **モバイル表示（画面幅 < 768px）:** 直近および今後のレースを時系列で追える **「タイムラインビュー」** を初期表示。
- **デスクトップ/タブレット表示（画面幅 >= 768px）:** 全体感を把握できる **「月間カレンダービュー」** を初期表示。
  - **週始まりの定義:** 競馬の土日連続開催を直感的に視認・把握できるよう、必ず **月曜日始まり（月〜日）** の7列グリッドとする。
  - **週末・日付スタイル:** 土曜日は青系、日曜日は赤系で区別表示し、当月以外の日付セルは非活性（グレーアウト）とする。
  - **ナビゲーション:** 年月切り替え（前月・翌月・今月へジャンプ）および当月の重賞件数表示を備える。
- **ビュー切替コンポーネント:** Shadcn UI の `Tabs` または `ToggleGroup` を使用。
- **ユーザー設定の永続化:** ユーザーの選択状態を `localStorage` に保存。

### 4.2 アクセシビリティ & コンポーネント要件

- **キーボードナビゲーション:** Radix UI プリミティブにより、Tab / Shift+Tab / 矢印キーで完全操作可能。
- **カード操作:** レースカード（`RaceCard`）は `role="button"`, `tabindex="0"`, `aria-haspopup="dialog"` を持ち、Enter / Space キーで詳細ダイアログを起動。
- **フォーカスインジケーター:** Shadcn UI 標準の `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` による明確なアウトライン表示。
- **レース詳細ダイアログ (`RaceDetailDialog`):** レース詳細表示には独立したモーダルダイアログを使用。タイムラインビュー（`RaceCard` クリック時）およびカレンダービュー（日付・レースセル選択時）の双方から再利用可能な合成設計とする。

### 4.3 タイムゾーン自動変換 & 日時表示仕様

- **ローカル時刻変換:** JSON内の発走時刻（UTC ISO 8601）を、クライアント側で端末のローカルタイムゾーン（通常は日本標準時 JST）に変換して `HH:mm` 形式で表示。
- **開催日表示:** `YYYY年M月D日(曜日)` 形式で曜日を自動計算・付与して表示。
- **発走ステータスバッジ:** 発走時刻前は「発走予定」（アウトライン）バッジを時刻横に併記。競馬の特性上、直前まで発走確定しないため「発走確定」表示は行わず、発走時刻を経過したレース（終了後）は「発走予定」バッジを自動的に非表示とする。
- **代替開催バッジ & 振替日案内表示:** 悪天候等により代替競馬・続行競馬（日程変更）となったレース（`is_rescheduled: true`）には、タイムラインカードおよび詳細ダイアログに「代替開催」バッジを表示し、当初開催予定日（`original_date`）からの順延案内を明記。月間カレンダー上でも該当セル内レースに「代替」バッジを表示して視覚的に判別可能とする。

### 4.4 フィルタリング機能

- **UI構成:** Shadcn UI の `Input`（検索）、トグルチップ（`Button` / `Badge` 合成）、リセットボタンからなるフィルターバー（`FilterBar`）。
- **条件:**
  - キーワード検索: 日本語名（`name.ja`）・英語名（`name.en`）の部分一致検索（クリアボタン付き）。
  - グレード絞り込み: `G1`, `G2`, `G3`, `J.G1`, `J.G2`, `J.G3` のトグルチップによる複数選択（OR検索）。
  - 馬場種別絞り込み: `芝 (turf)`, `ダート (dirt)`, `障害 (obstacle)` のトグルチップによる複数選択。
  - 条件リセット: 適用中の全フィルターをワンクリックで初期状態へ復元。
- **（将来拡張フィールド）**: 国・団体コード（`organization`）、多言語表示切替、距離区分。

### 4.5 PWA & オフラインキャッシュ仕様

- **Web App Manifest 仕様:**
  - アプリ名: `重賞カレンダー - JRA重賞レーススケジュール` (short_name: `重賞カレンダー`)
  - 説明: `JRA重賞レースのスケジュールを閲覧・管理するオフライン対応カレンダー`
  - 表示モード: `standalone`（ブラウザのアドレスバー非表示・ネイティブアプリライクなフルスクリーン）
  - 画面向き: `portrait-primary`
  - テーマカラー: `#1D4ED8` (G1プライマリカラー) / 背景色: `#FFFFFF`
  - アイコン構成: 192x192, 512x512, maskable, SVG, iOS向け apple-touch-icon
- **Service Worker & Workbox キャッシュ戦略:**
  - **プリキャッシュ (Precache):** HTML, JS, CSS, Webフォント, アイコン等の静的アセットをインストール時に一括キャッシュ。
  - **ランタイムキャッシュ (Runtime Cache: `/data/races.json`):** `Stale-While-Revalidate` 戦略を採用。競馬場や地下鉄などの電波不安定環境でもミリ秒単位で手元のキャッシュから即座に画面を表示し、バックグラウンドで最新データを取得・更新。有効期限7日間 (`maxAgeSeconds: 604800`)、エントリ上限10件。
  - **バックグラウンド更新通知 (BroadcastUpdate):** Workbox の `BroadcastUpdatePlugin`（`channelName: 'races-data-updates'`）を導入。バックグラウンドで最新データが取得・キャッシュ更新された際、クライアント（React）へメッセージを自動通知し、ユーザーによる手動リロード操作なしで画面のレースデータを自動的に最新化。
- **オフライン・更新案内 UI:**
  - **オフラインインジケーター (`OfflineIndicator`):** 電波断絶時にヘッダー下部へ「オフライン表示中（キャッシュされたレースデータを表示しています）」バナーを表示 (`role="status"`, `aria-live="polite"`)。オンライン復帰時には自動で復帰案内を表示。
  - **PWAリロードプロンプト (`ReloadPrompt`):** バックグラウンドで新しいService Workerが利用可能になった際、更新案内トーストを表示して即時反映を支援。

---

## 5. データアーキテクチャ & パイプライン

### 5.1 競馬用語標準化ルール（JRA公式用語集準拠）

レースマスター情報および条件データの一次情報源として、JRA公式の重賞日程ページおよび用語集を使用する。

> **JRA重賞レースソース:** [重賞レース一覧](https://www.jra.go.jp/datafile/seiseki/replay/2026/jyusyo.html)

> **用語マスターソース:** [海外競馬英和辞典](https://www.jra.go.jp/keiba/overseas/yougo/index.html)

### 5.2 データパース & 分割ルール

#### A. 「出走資格（性別・年齢制限）」の分離・構造化
原本データ表記（例: 「3歳以上」「3歳牝馬」「2歳牡・牝」）を解析し、プログラム処理用のコード値（`constraint`）と多言語表示用ラベル（`label`）に構造化する。

- **性別制限 (`sex_constraint`):**
  - `/牡・牝|牡・牝馬/` $\rightarrow$ コード: `colt_and_filly`, ラベル: `{ ja: "牡・牝", en: "Colts & Fillies" }`
  - `/牝/` $\rightarrow$ コード: `filly_and_mare`, ラベル: `{ ja: "牝", en: "Fillies & Mares" }`
  - 上記以外 $\rightarrow$ コード: `none`, ラベル: `{ ja: "制限なし", en: "Open to All" }`
- **年齢制限 (`age_constraint`):**
  - `/3歳以上/` $\rightarrow$ コード: `3yo_and_up`, ラベル: `{ ja: "3歳以上", en: "3yo & Up" }`
  - `/4歳以上/` $\rightarrow$ コード: `4yo_and_up`, ラベル: `{ ja: "4歳以上", en: "4yo & Up" }`
  - `/2歳/` $\rightarrow$ コード: `2yo`, ラベル: `{ ja: "2歳", en: "2yo" }`
  - `/3歳/` $\rightarrow$ コード: `3yo`, ラベル: `{ ja: "3歳", en: "3yo" }`

#### B. 「コース」の分離（馬場・距離）
原本データ表記（例: 「芝1,600メートル」「ダート1,800メートル」「障害3,100メートル」）を正規表現で抽出し、種別（`track_type`）と整数数値（`distance`）に分離する。

- **馬場種別 (`track_type`):**
  - `/障害|J・G|障/` $\rightarrow$ コード: `obstacle`, ラベル: `{ ja: "障害", en: "Jump" }`
  - `/ダート|ダ/` $\rightarrow$ コード: `dirt`, ラベル: `{ ja: "ダート", en: "Dirt" }`
  - 上記以外（「芝」含む） $\rightarrow$ コード: `turf`, ラベル: `{ ja: "芝", en: "Turf" }`
- **距離 (`distance`):**
  - カンマや「メートル」を除去し、整数型 (number) として保持（例: `1600`）。

#### C. 「負担重量（斤量種別）」の判定・構造化
レース条件から斤量種別を判定し、コードと多言語ラベルを割り当てる。

- **負担重量 (`handicap`):**
  - 定量: コード `weight_for_age`, ラベル: `{ ja: "定量", en: "Weight for Age" }`
  - 馬齢: コード `special_weight`, ラベル: `{ ja: "馬齢", en: "Special Weight" }`
  - 別定: コード `set_weight`, ラベル: `{ ja: "別定", en: "Set Weight" }`
  - ハンデ: コード `handicap`, ラベル: `{ ja: "ハンデ", en: "Handicap" }`

#### D. 発走時刻の取得・決定パイプライン
発走時刻は「デフォルト推定値」と「直前確定値」の2段階構成で管理する。また、将来のNAR（地方競馬）や海外競馬の拡張に対応するため、主催者ごとのプロバイダーアーキテクチャ（`RaceTimeFetcher` Strategyパターン）を採用している。

1. **初期推定値の設定（年間ビルド時）:**
   - 平地重賞（関東・新潟・福島）: 原則 `15:40` JST を初期値としてセット。
   - 平地重賞（関西・中京・小倉）: 原則 `15:45` JST を初期値としてセット。
   - 平地重賞（北海道・札幌・函館）: 原則 `15:35` JST を初期値としてセット。
   - 障害重賞 (J.G1〜J.G3): `13:50`〜`14:45` JST（J.G1は `14:45`、一般は `13:50`）をセット。
   - 開催日と `default_time_jst` を組み合わせ、UTC ISO 8601 形式 (`Z`) に変換して `start_time` に格納。
   - `is_time_confirmed: false` としてフラグ管理。
2. **直前確定値の上書き更新（開催直前自動バッチパイプライン）:**
   - **取得ソース:** JRA公式「今週の注目レース」ページ (`/keiba/thisweek/`) および出馬表詳細ページ (`/JRADB/accessD.html`) から確定発走時刻をスクレイピング取得（出馬表ポータルからのフォールバック探索も搭載）。
   - **相手先サーバー負荷軽減ガード（早期終了）:** 当週の対象レースがすべて確定済み（`is_time_confirmed: true`）の場合、リモートリクエストを一切送信せず即座に正常終了。
   - **耐障害性:** 通信エラーや一時的障害に対応する指数バックオフリトライ（最大3回）。
   - **更新ロジック:** 確定時刻で `start_time` を UTC ISO 8601 形式に上書きし、`is_time_confirmed: true` に更新。他のデータ整合性は完全維持。
    - **自動実行 (GitHub Actions):** 出馬表発表（木曜16時目安）および確定枠順発表（金曜10時目安）に合わせ、木・金・土・日の定期スケジュール（cron）および手動ディスパッチ (`workflow_dispatch`) で差分発生時のみ自動コミット＆デプロイ。
    - **プロバイダー拡張性 (`scripts/update-race-times.ts`):** `RaceTimeFetcher` インターフェースを介し、`JraRaceTimeFetcher` のほか将来の `NarRaceTimeFetcher` / `OverseasRaceTimeFetcher` をプラグイン感覚で追加可能。
    - **天候等による開催日変更（代替競馬）時の検知・上書き:** 降雪・台風等により開催日が変更（順延）された場合、出馬表で発表された実開催日を自動検知し、`date` を新開催日に上書き、`start_time` を新開催日時に更新。同時に `original_date`（当初予定日）を記録し `is_rescheduled: true` フラグをセット。

#### E. 組織コードおよびID体系 (拡張性設計)
- 組織識別子 `organization`: `"jra"`（将来拡張: `"nar"`, `"overseas"` / `"intl"`）
- レースID体系: `{年度}-{組織コード}-{グレード小文字}-{連番2桁}`（例: `2026-jra-g1-01`、将来は `2026-nar-jpn1-01`）

---

### 5.3 データ補完マスター構造 (`src/data/race_master.json`)

JRA公式 `.ics` に含まれないフィールド（多言語名称・競馬場名・デフォルト発走時刻・性齢制限・馬場・距離・斤量）を補完するための辞書データ。

```json
{
  "フェブラリーステークス": {
    "name": {
      "ja": "フェブラリーステークス",
      "en": "February Stakes"
    },
    "organization": "jra",
    "course": {
      "ja": "東京競馬場",
      "en": "Tokyo Racecourse"
    },
    "default_time_jst": "15:40",
    "sex_constraint": {
      "code": "none",
      "label": {
        "ja": "制限なし",
        "en": "Open to All"
      }
    },
    "age_constraint": {
      "code": "4yo_and_up",
      "label": {
        "ja": "4歳以上",
        "en": "4yo & Up"
      }
    },
    "track_type": {
      "code": "dirt",
      "label": {
        "ja": "ダート",
        "en": "Dirt"
      }
    },
    "distance": 1600,
    "handicap": {
      "code": "weight_for_age",
      "label": {
        "ja": "定量",
        "en": "Weight for Age"
      }
    }
  }
}
```

---

### 5.4 アプリケーション用出力データ構造 (`public/data/races.json`)

フロントエンドのタイムラインビューおよびカレンダービューが表示・フィルタリングに使用する一次データ。

```json
[
  {
    "id": "2026-jra-g1-01",
    "organization": "jra",
    "name": {
      "ja": "フェブラリーステークス",
      "en": "February Stakes"
    },
    "grade": "G1",
    "date": "2026-02-22",
    "start_time": "2026-02-22T06:40:00.000Z",
    "is_time_confirmed": false,
    "is_rescheduled": false,
    "original_date": "2026-02-22",
    "course": {
      "ja": "東京",
      "en": "Tokyo"
    },
    "distance": 1600,
    "track_type": "dirt",
    "sex_constraint": "none",
    "age_constraint": "4yo_and_up",
    "handicap": {
      "code": "weight_for_age",
      "ja": "定量",
      "en": "Weight for Age"
    }
  }
]
```

---

### 5.5 .ics パーサー (結合変換ロジック) 要件

- JRA公式 `.ics` の `SUMMARY` から正規表現（半角・全角括弧の混在に対応）で「レース名」と「グレード (G1/G2/G3/J.G1等)」を抽出。
- `DTSTART` から「開催日」、`LOCATION` から「開催競馬場」を取得。
- レース名エイリアス辞書（略称マッピング）を用いて `jyusyo.html` の行データと1対1結合。
- レース名をキーにして `race_master.json` を参照し、各フィールドを補完。
- 開催日と `default_time_jst`（確定時は出馬表の確定時刻）を組み合わせ、UTC 形式 (`Z`) に変換して `start_time` に格納。

---

## 6. 技術スタック選定基準

- **フロントエンド**: React 19 + TypeScript (Vite)
- **UIライブラリ / CSS**: Shadcn UI (New York スタイル) + Tailwind CSS + Radix UI
- **状態管理**: Zustand
- **テスト基盤**: Vitest + @testing-library/react + jsdom
- **PWA / Cache**: `vite-plugin-pwa` (Workbox)
- **インフラ**: GitHub Pages (GitHub Actions でビルド・デプロイ)
- **セキュリティ・品質方針**: GitHub Dependabot の有効化 [完了]、Secret Protection 有効化 [完了]、axe-core / Lighthouse による a11y 自動チェック。

---

## 7. Antigravity 連携手順

1. **Step 1:** リポジトリ直下に本 PRD（`PRD.md`）および `AGENTS.md`（Shadcn UI 準拠ルール）を配置。[完了]
2. **Step 2:** JRA公式の`jrarace2026.ics`と`jyusyo.html`を結合して `races.json`および`race_master.json`を出力するデータ生成スクリプト（`npm run data:build`）を作成・実行。[完了]
3. **Step 3:** Shadcn UI + Tailwind CSS を初期化し、セマンティックトークン基盤および共通UIコンポーネント群（`GradeBadge`, `RaceCard`, `RaceDetailDialog`, `FilterBar`, `Header`, `Layout`）を実装・検証。[完了]
4. **Step 4:** 共通UIコンポーネントを活用し、レスポンシブな「タイムラインビュー」および「月間カレンダービュー（月曜始まり・土日連続）」を実装・統合。[完了]
5. **Step 5:** PWA & Service Worker（Workbox）によるオフラインキャッシュおよびPWAマニフェストの実装。[完了]
6. **Step 6:** GitHub Actions による自動ビルド＆GitHub Pages 自動デプロイパイプライン（`deploy.yml`）の構築。[完了]
7. **Step 7:** JRA公式からの `.ics` / ZIP 自動取得・展開機能（`jra-calendar.ts`）の実装。[完了]
8. **Step 8:** 発走ステータスバッジの改善（レース終了後の自動非表示対応、`v1.2.0` リリース）。[完了]
9. **Step 9:** JRA確定発走予定時刻の自動更新パイプライン・プロバイダー設計および定期実行ワークフローの実装（`v1.3.0` リリース）。[完了]
10. **Step 10:** 天候等による開催日変更（代替競馬）時の日程上書き対応およびUI表示の実装（`v1.4.0` リリース）。[完了]
11. **Step 11:** PWAバックグラウンドキャッシュ更新時の自動画面反映（BroadcastUpdate、`v1.5.0` リリース）。[完了]
12. **Step 12 (Next):** フェーズ2 拡張機能（NAR/海外競馬対応、多言語UI切替、詳細フィルター等）の順次実装。[次のステップ]