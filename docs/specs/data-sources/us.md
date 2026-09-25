# アメリカ競馬（Equibase / The Jockey Club）データ仕様書 (US Data Specifications)

本ドキュメントは、アメリカ合衆国の競馬（The Jockey Club / Equibase 統轄、IFHA Part I平地全408重賞: G1, G2, G3）に関するデータ仕様書です。

---

## 1. データソース一覧

| 項目 | ソースURL / 取得先 | 用途 |
| :--- | :--- | :--- |
| **重賞格付け・出走条件** | IFHA Part I United States of America リスト | 平地全408重賞（G1 92、G2 133、G3 183）の格付け・距離・馬場 |
| **公式開催日程 & 出馬表** | [Equibase](https://www.equibase.com/) | 北米公式データベース、開催カレンダー、出馬表、確定時刻 |
| **日英マスタ** | `src/data/us_race_master.json` | 日英レース名、全米主要競馬場マッピング、州別タイムゾーン |

---

## 2. 北米4大タイムゾーン & 夏時間（DST）仕様

アメリカ競馬は競馬場所在地（州）によってタイムゾーンが異なります。

| タイムゾーン名 | 略称 (冬/夏) | UTC オフセット (冬/夏) | 対象競馬場例 |
| :--- | :--- | :--- | :--- |
| **東部時間 (Eastern)** | EST / EDT | UTC-5 / UTC-4 | チャーチルダウンズ、サラトガ、ベルモント、ガルフストリーム、ピムリコ、キーンランド |
| **中部時間 (Central)** | CST / CDT | UTC-6 / UTC-5 | オークローンパーク、フェアグラウンズ、ローンスタースパーク |
| **山岳部時間 (Mountain)** | MST / MDT | UTC-7 / UTC-6 | サンランドパーク |
| **太平洋時間 (Pacific)** | PST / PDT | UTC-8 / UTC-7 | サンタアニタ、デルマー |

- **夏時間（DST）適用期間**: 3月第2日曜日〜11月第1日曜日
- **UTC変換**:
  - EDT (UTC-4): `EDT + 4時間 = UTC`
  - CDT (UTC-5): `CDT + 5時間 = UTC`
  - PDT (UTC-7): `PDT + 7時間 = UTC`

---

## 3. 主要レース & 三冠・ブリーダーズカップ

- **アメリカ三冠競走**:
  - ケンタッキーダービー (Kentucky Derby, G1, チャーチルダウンズ)
  - プリークネスステークス (Preakness Stakes, G1, ピムリコ)
  - ベルモントステークス (Belmont Stakes, G1, ベルモントパーク / サラトガ)
- **ブリーダーズカップ (Breeders' Cup)**:
  - クラシック、ターフ、マイル、スプリント等全14競走（デルマー、サンタアニタ等での持ち回り開催）

---

## 4. 確定発走時刻自動取得 (`UsRaceTimeFetcher`)

- **実装ファイル**: `scripts/lib/us-syutsuba.ts`, `scripts/update-race-times.ts`
- **対象ウィンドウ**: 基準日から直近7日間の開催予定レース
- **CLI単独実行**: `npm run data:update-times:us`（`--org equibase`）
- **タイムゾーン解決**: `getCourseTimeZone` により、対象競馬場に応じた州のタイムゾーンを自動選択し、夏時間を判定して正確な UTC ISO 8601 文字列を生成。
- **名寄せルール**: `usRaceMatches` / `usCourseMatches` により、スポンサー名、ステークス略称（`S.`, `H.`, `Stakes`, `Handicap`）をトークン化して照合。
