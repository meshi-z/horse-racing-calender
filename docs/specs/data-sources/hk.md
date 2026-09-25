# 香港競馬（HKJC / 香港賽馬會）データ仕様書 (Hong Kong Data Specifications)

本ドキュメントは、香港競馬（The Hong Kong Jockey Club: HKJC / 香港賽馬會統轄、IFHA Part I平地全31重賞および4歳クラシックシリーズ全35競走）に関するデータ仕様書です。

---

## 1. 基本メタ情報 (Metadata)

| 項目 | 設定値 / 仕様 | 備考 |
| :--- | :--- | :--- |
| **国コード (`country_code`)** | `"HK"` | ISO 3166-1 alpha-2 |
| **主催者コード (`organization`)** | `"hkjc"` | `Organization` 型識別子 |
| **原語・対応言語 (`languages`)** | `ja`, `en`, `fr`, `zh` | 日本語通称、英名、仏名、繁体字中文 |
| **レースID採番ルール (`id`)** | `{YYYY}-hk-{grade}-{index}` | 例: `2026-hk-g1-01` |
| **格付け体系 (`grades`)** | `G1`, `G2`, `G3` | 国際G1〜G3および香港G1（4歳クラシック） |
| **マスタファイルパス** | `src/data/hk_race_master.json` | 日英中対訳マスタ、沙田・跑馬地、推定発走時刻 |
| **生成・ビルドモジュール** | `scripts/lib/hk-races.ts`, `scripts/parse-races.ts` | IFHA Part I と HKJC公式日程を統合 |

---

## 2. データソース一覧 (Data Sources)

| 分類 | ソース元 / URL | 取得形式 | 用途 |
| :--- | :--- | :--- | :--- |
| **年間日程 / カレンダー** | [The Hong Kong Jockey Club (HKJC)](https://racing.hkjc.com/) | Web / カレンダー | 年間開催日程、レース一覧 |
| **格付け・出走条件** | IFHA Part I Hong Kong リスト | PDF | レース格付け、出走条件、斤量、距離、馬場 |
| **出馬表・確定発走時刻** | HKJC 公式出馬表（Racecards）ページ | HTML スクレイピング | 確定出馬表、公式発走時刻（HKT） |
| **過去実績補完データ** | `src/data/hk_race_master.json` | JSON | 2026年開催済み全重賞の確定発走時刻バックフィル |

---

## 3. タイムゾーン & 発走時刻仕様 (Timezone & Schedule)

- **現地タイムゾーン**: 香港標準時（HKT: UTC+8）
- **夏時間（DST）規則**: なし（通年固定）
- **UTC変換式**: `HKT - 8時間 = UTC`（日本時間 JST 比: `HKT + 1時間 = JST`、日本より1時間遅れ）
- **標準推定発走時刻（マスタ初期値）**:
  - 昼間開催（沙田）: 現地 13:00〜18:00（JST 14:00〜19:00 / UTC `05:00`〜`10:00`）
  - ナイター開催（跑馬地）: 現地 18:45〜23:00（JST 19:45〜24:00 / UTC `10:45`〜`15:00`）
  - 香港国際競走（香港カップ等）: 現地 16:40 前後（JST 17:40 / UTC `08:40`）

---

## 4. 競馬場 & 馬場種別仕様 (Courses & Tracks)

### 4.1 登録競馬場一覧（全2競馬場）
| 競馬場名 (日本語) | 英語表記 (`en`) | 繁体字中文 (`zh`) | 原語仏名 (`fr`) | 区分 / 特徴 |
| :--- | :--- | :--- | :--- | :--- |
| **シャティン** | Sha Tin | 沙田 | Sha Tin | 新界地区 (主要国際G1の全舞台、AW併設) |
| **ハッピーバレー** | Happy Valley | 跑馬地 | Happy Valley | 香港島都心部 (水曜ナイター中心) |

### 4.2 馬場種別 (`track_type`) & 特殊競走仕様
- **採用馬場種別**:
  - `turf` (芝): 香港平地競走の主流コース
  - `aw` (オールウェザー): 沙田競馬場の全天候型ダートコース
- **特殊条件**:
  - **4歳限定戦 (`age_constraint: '4yo'`)**: 香港クラシックマイル、香港クラシックカップ、香港ダービー（香港打吡大賽）の3競走に適用。

---

## 5. 確定発走時刻自動取得バッチ仕様 (RaceTimeFetcher)

- **プロバイダー名**: `HkRaceTimeFetcher`
- **実装ファイル**: `scripts/lib/hk-syutsuba.ts`, `scripts/update-race-times.ts`
- **対象開催ウィンドウ**: 基準日（JST）から直近7日間の開催予定レース（`getHkUpcomingWindowRange`）
- **CLI実行コマンド**: `npm run data:update-times:hk`（または `--org hkjc`）
- **定期実行スケジュール**:
  - 毎日 07:30 JST（香港現地早朝・当日出馬表確定枠）
  - 毎日 21:30 JST（香港ナイター開催監視枠）
- **名寄せ・照合アルゴリズム**:
  - `hkRaceMatches` / `hkCourseMatches` により、英語名、中文名（繁体字）、スポンサー名、エイリアスを複合突合。
  - 香港時間（HKT: UTC+8）から正確に ISO 8601 UTC 文字列および JST 表記を算出。
