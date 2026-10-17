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
| **出馬表・確定発走時刻** | Sporting Life Racecards API (`api/horse-racing/racing/racecards/${date}`) | Web REST API (JSON) | 北米全主要競馬場の出馬表・公式確定発走時刻（WAF回避・実通信パイプライン） |
| **レース結果 / 勝者** | Sporting Life Results API (`api/horse-racing/racing/results/${date}`) / Equibase | Web JSON / HTML | 終了レースの確定着順・勝ち馬・確定勝ちタイム |
| **過去実績補完データ** | `src/data/us_race_master.json`, `src/data/race_winners.json` | JSON | 2026年開催済み全重賞の確定発走時刻・勝ち馬マスター |

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

## 5. 確定発走時刻自動取得パイプライン仕様 (RaceTimeFetcher)

- **プロバイダー名**: `UsRaceTimeFetcher`
- **実装ファイル**: `scripts/lib/us-syutsuba.ts`, `scripts/update-race-times.ts`
- **対象開催ウィンドウ**: 基準日（JST）から直近7日間の開催予定レース（`getUsUpcomingWindowRange`）
- **CLI実行コマンド**: `npm run data:update-times:us`（または `--org equibase`）
- **実通信アーキテクチャ & WAF回避**:
  - Equibase 公式Webサイトは Imperva Incapsula WAF によるチャレンジ画面が介在し自動通信がブロックされるため、英国最大手かつグローバル競馬情報配信基盤である **Sporting Life Racecards API (`https://www.sportinglife.com/api/horse-racing/racing/racecards/${dateYmd}`)** をデータ取得基盤として採用。
  - 北米全主要競馬場（Keeneland, Belmont, Saratoga, Santa Anita, Del Mar, Churchill Downs, Aqueduct, Gulfstream 等）のレースカードを完全網羅。
- **タイムゾーン変換仕様**:
  - Sporting Life API から配信される発走予定時刻は英国時間（BST: UTC+1 / GMT: UTC+0）で統一表記。
  - 英国夏時間規則（3月最終日曜日〜10月最終日曜日）に基づき `parseUkTimeToIsoAndJst` にて UTC ISO 8601 および JST `HH:mm` を算出し、ミリ秒精度で正確な発走時刻を生成。
- **名寄せ・照合アルゴリズム（同名別レース誤一致防止）**:
  - `usCourseMatches`: 競馬場名（`Keeneland`, `Santa Anita`, `Churchill Downs` 等）の正規化部分一致判定。
  - `usRaceMatches`: レース名トークン照合に加え、以下の**重要区別ワード（ディファレンシエータ）不一致ガード**を搭載：
    - `['TURF', 'DIRT', 'OAKS', 'DERBY', 'MILE', 'SPRINT', 'DISTAFF', 'LADIES', 'JUVENILE', 'CLASSIC', 'FILLIES', 'FILLY', 'MARES', 'MARE', 'COLTS', 'COLT']`
    - 片方のレース名にのみ区別ワードが含まれる場合は同日開催の別レース（例: Pegasus World Cup vs Pegasus World Cup Turf、Santa Anita Derby vs Santa Anita Oaks）と判定し、誤一致を確実に防止。
- **データ開示・URL表示ポリシー (Issue #190 準拠)**:
  - JRA / NAR 以外の海外レースでは、外部直リンクの信頼性・規約保護の観点から `sourceUrl` は `undefined` を設定し、公式リンクボタンは非表示とする。
