# フランス競馬（France Galop / PMU）データ仕様書 (France Data Specifications)

本ドキュメントは、フランス競馬（France Galop統轄、IFHA Part I平地重賞: G1, G2, G3）に関するデータ仕様書です。

---

## 1. データソース一覧

| 項目 | ソースURL / 取得先 | 用途 |
| :--- | :--- | :--- |
| **重賞格付け・出走条件** | [IFHA Part I France PDF](https://www.tjcis.com/pdf/icsc26/ICSC-PartI_France.pdf) | 格付け（G1〜G3）、出走条件、コース距離、馬場種別 |
| **公式開催日程カレンダー** | France Galop 公式開催カレンダー 2026 PDF | 年間開催日程、開催競馬場 |
| **確定出馬表・発走時刻 API** | `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/{DDMMYYYY}` | PMU公式出馬表プログラム（ミリ秒タイムスタンプ） |
| **日仏英マスタ** | `src/data/france_race_master.json` | 日仏英レース名辞書、主要16競馬場マッピング、夏時間推定時刻 |

---

## 2. タイムゾーン & 夏時間（DST）仕様

- **タイムゾーン**:
  - 冬時間: 中央ヨーロッパ時間（CET: UTC+1）
  - 夏時間: 中央ヨーロッパ夏時間（CEST: UTC+2）
- **夏時間切替規則**: 3月最終日曜日〜10月最終日曜日
- **UTC変換**:
  - 夏時間（CEST）: `CEST - 2時間 = UTC`（日本時間 JST 比: `UTC + 9時間 = JST`）
  - 冬時間（CET）: `CET - 1時間 = UTC`
- **主要レース発走目安**:
  - 凱旋門賞（Prix de l'Arc de Triomphe）等: 現地 16:05（夏時間: UTC 14:05 / JST 23:05）

---

## 3. 馬場種別と特徴

- **`turf`（芝）**: パリロンシャン、シャンティイ、ドーヴィル、サンクルー等の主要芝コース。
- **`aw`（オールウェザー / PSF: Piste en Sable Fibré）**: ドーヴィル、シャンティイ等の全天候型ファイバーサンドコース。

---

## 4. 確定発走時刻自動取得 (`FranceRaceTimeFetcher`)

- **実装ファイル**: `scripts/lib/france-syutsuba.ts`, `scripts/update-race-times.ts`
- **対象ウィンドウ**: 基準日から直近7日間の開催予定レース
- **APIレスポンス**: PMU REST API から各レースの `heureDepart`（ミリ秒タイムスタンプ）を取得し、直接 ISO 8601 UTC 文字列へ変換（夏時間・冬時間を自動吸収）。
- **名寄せルール**: `frenchRaceMatches` により、`PRIX` の接頭辞、スポンサー名（`QATAR`, `TATTERSALLS` 等）、アクセント記号を正規化して照合。
