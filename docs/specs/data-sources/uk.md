# イギリス競馬（BHA / Sporting Life）データ仕様書 (UK Data Specifications)

本ドキュメントは、イギリス競馬（British Horseracing Authority: BHA 統轄、IFHA Part I平地全156重賞: G1, G2, G3）に関するデータ仕様書です。

---

## 1. データソース一覧

| 項目 | ソースURL / 取得先 | 用途 |
| :--- | :--- | :--- |
| **重賞格付け・出走条件** | IFHA Part I Great Britain リスト | 平地全156重賞（G1 38、G2 47、G3 71）の格付け・距離・馬場 |
| **公式開催日程** | [British Horseracing Authority (BHA)](https://www.britishhorseracing.com/) | 年間開催日程、競馬場 |
| **出馬表・確定発走時刻 API** | `https://www.sportinglife.com/api/horse-racing/racing/racecards/{date}` | Sporting Life Racing API（出馬表・確定発走時刻） |
| **日英マスタ** | `src/data/uk_race_master.json` | 日英レース名・主要16競馬場マスタ、推定発走時刻 |

---

## 2. タイムゾーン & 夏時間（BST）仕様

- **タイムゾーン**:
  - 冬時間: グリニッジ標準時（GMT: UTC+0）
  - 夏時間: 英国夏時間（BST: UTC+1）
- **夏時間切替規則**: 3月最終日曜日〜10月最終日曜日
- **UTC変換**:
  - 夏時間（BST）: `BST - 1時間 = UTC`（日本時間 JST 比: `BST + 8時間 = JST`）
  - 冬時間（GMT）: `GMT = UTC`（日本時間 JST 比: `GMT + 9時間 = JST`）
- **主要レース発走目安**:
  - エプソムダービー（Derby Stakes）等: 現地 15:30〜16:30（夏時間: UTC 14:30〜15:30 / JST 23:30〜24:30）

---

## 3. 主要競馬場 & 馬場種別

- **主要芝コース**: アスコット（Ascot）、エプソム（Epsom）、ニューマーケット（Newmarket）、ヨーク（York）、グッドウッド（Goodwood）等
- **全天候コース（`aw`）**: ケンプトン（Kempton Park）、リングフィールド（Lingfield Park）、ニューカッスル（Newcastle）等

---

## 4. 確定発走時刻自動取得 (`UkRaceTimeFetcher`)

- **実装ファイル**: `scripts/lib/uk-syutsuba.ts`, `scripts/update-race-times.ts`
- **対象ウィンドウ**: 基準日から直近7日間の開催予定レース
- **CLI単独実行**: `npm run data:update-times:uk`（`--org bha`）
- **名寄せルール**: `ukRaceMatches` / `ukCourseMatches` により、レース名に含まれるスポンサー冠名、距離表現、競馬場名を正規化して照合。
