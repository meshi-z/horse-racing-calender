# アメリカ競馬（Equibase / The Jockey Club）データ仕様書 (US Data Specifications)

本ドキュメントは、アメリカ合衆国の競馬（The Jockey Club / Equibase統轄、IFHA Part I平地全408重賞競走: G1, G2, G3）に関するデータ仕様書です。

---

## 1. 基本メタ情報 (Metadata)

| 項目 | 設定値 / 仕様 | 備考 |
| :--- | :--- | :--- |
| **国コード (`country_code`)** | `"US"` | ISO 3166-1 alpha-2 |
| **主催者コード (`organization`)** | `"equibase"` | `Organization` 型識別子 |
| **原語・対応言語 (`languages`)** | `ja`, `en`, `fr` | 日本語通称、英語正式名、仏語 |
| **レースID採番ルール (`id`)** | `{YYYY}-us-{grade}-{index}` | 例: `2026-us-g1-01` |
| **格付け体系 (`grades`)** | `G1`, `G2`, `G3` | IFHA Part I 平地国際重賞（全408競走） |
| **マスタファイルパス** | `src/data/us_race_master.json` | 日英辞書、全米主要競馬場、タイムゾーンマッピング |
| **生成・ビルドモジュール** | `scripts/lib/us-races.ts`, `scripts/parse-races.ts` | IFHA Part I と Equibase公式日程を統合 |

---

## 2. データソース一覧 (Data Sources)

| 分類 | ソース元 / URL | 取得形式 | 用途 |
| :--- | :--- | :--- | :--- |
| **年間日程 / カレンダー** | [Equibase](https://www.equibase.com/) | Web / データベース | 北米公式開催日程、競馬場 |
| **格付け・出走条件** | IFHA Part I United States of America リスト | PDF | レース格付け、出走条件、斤量、距離、馬場 |
| **出馬表・確定発走時刻** | Equibase Racecards Web エンドポイント | Web JSON / HTML | 確定出馬表、公式発走時刻 |
| **過去実績補完データ** | `src/data/us_race_master.json` | JSON | 2026年開催済み全重賞の確定発走時刻バックフィル |

---

## 3. タイムゾーン & 発走時刻仕様 (Timezone & Schedule)

アメリカ競馬は競馬場所在地（州）によってタイムゾーンが異なります。

| タイムゾーン名 | 略称 (冬/夏) | UTC オフセット (冬/夏) | 対象競馬場例 |
| :--- | :--- | :--- | :--- |
| **東部時間 (Eastern)** | EST / EDT | UTC-5 / UTC-4 | チャーチルダウンズ、サラトガ、ベルモント、ガルフストリーム、ピムリコ、キーンランド |
| **中部時間 (Central)** | CST / CDT | UTC-6 / UTC-5 | オークローンパーク、フェアグラウンズ、ローンスタースパーク |
| **山岳部時間 (Mountain)** | MST / MDT | UTC-7 / UTC-6 | サンランドパーク |
| **太平洋時間 (Pacific)** | PST / PDT | UTC-8 / UTC-7 | サンタアニタ、デルマー |

- **夏時間（DST）規則**:
  - 適用期間: 3月第2日曜日 〜 11月第1日曜日
- **UTC変換式**:
  - EDT (UTC-4): `EDT + 4時間 = UTC`（日本時間 JST 比: `UTC + 9時間 = JST`）
  - CDT (UTC-5): `CDT + 5時間 = UTC`
  - PDT (UTC-7): `PDT + 7時間 = UTC`
- **標準推定発走時刻（マスタ初期値）**:
  - ケンタッキーダービー: 現地 18:57 EDT（UTC 22:57 / JST 翌朝 07:57）
  - ブリーダーズカップ・クラシック: 現地 17:40 前後

---

## 4. 競馬場 & 馬場種別仕様 (Courses & Tracks)

### 4.1 登録競馬場一覧（全米主要16競馬場）
| 競馬場名 (日本語) | 英語表記 (`en`) | タイムゾーン | 所在地 / 代表競走 |
| :--- | :--- | :--- | :--- |
| **チャーチルダウンズ** | Churchill Downs | ET (東部) | ケンタッキー州 (ケンタッキーダービー) |
| **ピムリコ** | Pimlico | ET (東部) | メリーランド州 (プリークネスS) |
| **ベルモントパーク** | Belmont Park | ET (東部) | ニューヨーク州 (ベルモントS) |
| **サラトガ** | Saratoga | ET (東部) | ニューヨーク州 (トラヴァーズS、夏季名門) |
| **サンタアニタ** | Santa Anita | PT (太平洋) | カリフォルニア州 (サンタアニタH、BC開催) |
| **デルマー** | Del Mar | PT (太平洋) | カリフォルニア州 (パシフィッククラシック、BC開催) |
| **キーンランド** | Keeneland | ET (東部) | ケンタッキー州 (春・秋名門開催) |
| **ガルフストリームパーク** | Gulfstream Park | ET (東部) | フロリダ州 (ペガサスワールドカップ) |
| **オークローンパーク** | Oaklawn Park | CT (中部) | アーカンソー州 (アーカンソーダービー) |
| **アケダクト** | Aqueduct | ET (東部) | ニューヨーク州 (冬季・春季開催) |
| **モンマスパーク** | Monmouth Park | ET (東部) | ニュージャージー州 (ハスケルS) |
| **フェアグラウンズ** | Fair Grounds | CT (中部) | ルイジアナ州 (ルイジアナダービー) |
| **ローレルパーク** | Laurel Park | ET (東部) | メリーランド州 (フランクJドフランシス記念) |
| **タンパベイダウンズ** | Tampa Bay Downs | ET (東部) | フロリダ州 (タンパベイダービー) |
| **ケンタッキーダウンズ** | Kentucky Downs | CT (中部) | ケンタッキー州 (全欧州風芝専用コース) |
| **ウッドバイン** | Woodbine | ET (東部) | 加オンタリオ州 (カナダ国際S、北米共用) |

### 4.2 馬場種別 (`track_type`) & 特殊競走仕様
- **採用馬場種別**:
  - `dirt` (ダート): アメリカ本流のダート競走（三冠、BCクラシック等）
  - `turf` (芝): 芝重賞競走（BCターフ、BCマイル、マンハッタンS等）

---

## 5. 確定発走時刻自動取得バッチ仕様 (RaceTimeFetcher)

- **プロバイダー名**: `UsRaceTimeFetcher`
- **実装ファイル**: `scripts/lib/us-syutsuba.ts`, `scripts/update-race-times.ts`
- **対象開催ウィンドウ**: 基準日（JST）から直近7日間の開催予定レース（`getUsUpcomingWindowRange`）
- **CLI実行コマンド**: `npm run data:update-times:us`（または `--org equibase`）
- **定期実行スケジュール**:
  - 毎日 07:30 JST（米国現地前夜〜当日・出馬表確定枠）
  - 毎日 21:30 JST（米国現地早朝・最新時刻監視枠）
- **名寄せ・照合アルゴリズム**:
  - `getCourseTimeZone` により、競馬場から所属州の正確なタイムゾーンを自動判別。
  - `usRaceMatches` / `usCourseMatches` により、レース名に含まれる冠名、ステークス略称（`S.`, `H.`, `INVITATIONAL`）をトークン化して照合。
