# フランス競馬（France Galop / PMU）データ仕様書 (France Data Specifications)

本ドキュメントは、フランス競馬（France Galop統轄、IFHA Part I平地全重賞競走: G1, G2, G3）に関するデータ仕様書です。

---

## 1. 基本メタ情報 (Metadata)

| 項目 | 設定値 / 仕様 | 備考 |
| :--- | :--- | :--- |
| **国コード (`country_code`)** | `"FR"` | ISO 3166-1 alpha-2 |
| **主催者コード (`organization`)** | `"france_galop"` | `Organization` 型識別子 |
| **原語・対応言語 (`languages`)** | `ja`, `en`, `fr` | 日本語通称、英名、原語フランス語 |
| **レースID採番ルール (`id`)** | `{YYYY}-france-{grade}-{index}` | 例: `2026-france-g1-01` |
| **格付け体系 (`grades`)** | `G1`, `G2`, `G3` | IFHA Part I 平地国際重賞 |
| **マスタファイルパス** | `src/data/france_race_master.json` | 日仏英対訳マスタ、主要16競馬場、出走条件 |
| **生成・ビルドモジュール** | `scripts/lib/france-races.ts`, `scripts/parse-races.ts` | IFHA Part I と公式カレンダーPDFを統合 |

---

## 2. データソース一覧 (Data Sources)

| 分類 | ソース元 / URL | 取得形式 | 用途 |
| :--- | :--- | :--- | :--- |
| **年間日程 / カレンダー** | France Galop 公式開催カレンダー 2026 PDF | PDF | 年間開催日程、開催競馬場 |
| **格付け・出走条件** | [IFHA Part I France PDF](https://www.tjcis.com/pdf/icsc26/ICSC-PartI_France.pdf) | PDF | レース格付け、出走条件、距離、馬場種別 |
| **出馬表・確定発走時刻** | `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/{DDMMYYYY}` | REST API (JSON) | PMU公式出馬表プログラム（ミリ秒タイムスタンプ） |
| **過去実績補完データ** | `src/data/france_race_master.json` | JSON | 2026年開催済み全重賞の確定発走時刻バックフィル |

---

## 3. タイムゾーン & 発走時刻仕様 (Timezone & Schedule)

- **現地タイムゾーン**:
  - 冬時間: 中央ヨーロッパ時間（CET: UTC+1）
  - 夏時間: 中央ヨーロッパ夏時間（CEST: UTC+2）
- **夏時間（DST）規則**:
  - 適用期間: 3月最終日曜日 〜 10月最終日曜日
- **UTC変換式**:
  - 夏時間（CEST）: `CEST - 2時間 = UTC`（日本時間 JST 比: `UTC + 9時間 = JST`、時差 7時間）
  - 冬時間（CET）: `CET - 1時間 = UTC`（日本時間 JST 比: `UTC + 9時間 = JST`、時差 8時間）
- **標準推定発走時刻（マスタ初期値）**:
  - 主要G1（凱旋門賞等）: 現地 16:05（夏時間: UTC `14:05:00.000Z` / JST `23:05`）
  - 通常重賞競走: 現地 15:00〜16:30 前後

---

## 4. 競馬場 & 馬場種別仕様 (Courses & Tracks)

### 4.1 登録競馬場一覧（主要16競馬場）
| 競馬場名 (日本語) | 英語表記 (`en`) | 原語表記 (`fr`) | 区分 / 所在地 |
| :--- | :--- | :--- | :--- |
| **パリロンシャン** | ParisLongchamp | ParisLongchamp | パリ地区 (主要G1舞台) |
| **シャンティイ** | Chantilly | Chantilly | パリ近郊 (ジョッケクリブ賞等) |
| **ドーヴィル** | Deauville | Deauville | ノルマンディー (夏季開催 / PSF併設) |
| **サンクルー** | Saint-Cloud | Saint-Cloud | パリ近郊 (サンクルー大賞等) |
| **オートゥイユ** | Auteuil | Auteuil | パリ地区 (障害中心) |
| **フォンテーヌブロー** | Fontainebleau | Fontainebleau | イル・ド・フランス |
| **コンピエーニュ** | Compiegne | Compiègne | オワーズ県 |
| **クラファンティーヌ** | Clairefontaine | Clairefontaine | ノルマンディー |
| **カーニュシュルメール** | Cagnes-sur-Mer | Cagnes-sur-Mer | コート・ダジュール |
| **リヨンパリー** | Lyon-Parilly | Lyon-Parilly | ローヌ県 |
| **ボルドー** | Bordeaux-Le Bouscat | Bordeaux-Le Bouscat | ジロンド県 |
| **トゥールーズ** | Toulouse | Toulouse | オック地方 |
| **マルセイユボレリー** | Marseille-Borely | Marseille-Borély | プロヴァンス |
| **ヴィシー** | Vichy | Vichy | オーヴェルニュ |
| **ナント** | Nantes | Nantes | ロワール地方 |
| **ストラスブール** | Strasbourg | Strasbourg | アルザス地方 |

### 4.2 馬場種別 (`track_type`) & 特殊競走仕様
- **採用馬場種別**:
  - `turf` (芝): フランス平地重賞の大半（パリロンシャン、シャンティイ等の芝コース）
  - `aw` (オールウェザー / PSF: Piste en Sable Fibré): ドーヴィル、シャンティイ等の全天候型ファイバーサンドコース

---

## 5. 確定発走時刻自動取得バッチ仕様 (RaceTimeFetcher)

- **プロバイダー名**: `FranceRaceTimeFetcher`
- **実装ファイル**: `scripts/lib/france-syutsuba.ts`, `scripts/update-race-times.ts`
- **対象開催ウィンドウ**: 基準日（JST）から直近7日間の開催予定レース（`getFranceUpcomingWindowRange`）
- **CLI実行コマンド**: `npm run data:update-times -- --org france_galop`
- **定期実行スケジュール**:
  - 毎日 21:30 JST（現地午後・出馬表および確定発走時刻取得枠）
- **名寄せ・照合アルゴリズム**:
  - `frenchRaceMatches` により、`PRIX` の接頭辞、スポンサー名（`QATAR`, `TATTERSALLS` 等）、アクセント記号を除去・正規化して照合。
  - PMU API の `heureDepart`（ミリ秒タイムスタンプ）から UTC ISO 8601 文字列を算出し、夏時間・冬時間を自動吸収。
