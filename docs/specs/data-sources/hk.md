# 香港競馬（HKJC / 香港賽馬會）データ仕様書 (Hong Kong Data Specifications)

本ドキュメントは、香港競馬（The Hong Kong Jockey Club: HKJC / 香港賽馬會 統轄、IFHA Part I平地全31重賞および4歳クラシックシリーズ全35競走）に関するデータ仕様書です。

---

## 1. データソース一覧

| 項目 | ソースURL / 取得先 | 用途 |
| :--- | :--- | :--- |
| **重賞格付け・出走条件** | IFHA Part I Hong Kong リスト | 平地全31重賞（G1 12、G2 7、G3 12）および4歳限定戦の格付け |
| **公式開催日程 & 出馬表** | [The Hong Kong Jockey Club (HKJC)](https://racing.hkjc.com/) | 香港公式開催カレンダー、出馬表、公式発走時刻 |
| **日英中マスタ** | `src/data/hk_race_master.json` | 英語正式名、繁体字中文名、日本語通称名、競馬場マスタ |

---

## 2. タイムゾーン仕様

- **タイムゾーン**: 香港標準時（HKT: UTC+8、通年固定・夏時間なし）
- **UTC変換**: `HKT - 8時間 = UTC`（日本標準時 JST より 1時間遅れ: `HKT + 1時間 = JST`）
- **標準発走時間帯**:
  - 昼間開催（沙田 / Sha Tin）: 現地 13:00〜18:00（JST 14:00〜19:00 / UTC 05:00〜10:00）
  - ナイター開催（跑馬地 / Happy Valley）: 現地 18:45〜23:00（JST 19:45〜24:00 / UTC 10:45〜15:00）

---

## 3. 競馬場 & スキーマ独自拡張

- **競馬場（全2場）**:
  - **沙田（Sha Tin / シャティン）**: 芝コースおよびオールウェザー（全天候）コース。主要G1の全舞台。
  - **跑馬地（Happy Valley / ハッピーバレー）**: 香港島都心部のナイター競馬場。芝コース。
- **4歳限定戦 (`age_constraint: '4yo'`)**:
  - 香港クラシックマイル（Hong Kong Classic Mile）
  - 香港クラシックカップ（Hong Kong Classic Cup）
  - 香港ダービー（Hong Kong Derby / 香港打吡大賽）
- **繁体字中文表記 (`LocalizedText.zh`)**:
  - レース名および競馬場名に繁体字中文（`zh`）を格納。

---

## 4. 確定発走時刻自動取得 (`HkRaceTimeFetcher`)

- **実装ファイル**: `scripts/lib/hk-syutsuba.ts`, `scripts/update-race-times.ts`
- **対象ウィンドウ**: 基準日から直近7日間の開催予定レース
- **CLI単独実行**: `npm run data:update-times:hk`（`--org hkjc`）
- **名寄せルール**: `hkRaceMatches` / `hkCourseMatches` により、英語名、中文名、スポンサー冠名、エイリアスを網羅突合。
