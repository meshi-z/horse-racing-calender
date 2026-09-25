# イギリス競馬（BHA / Sporting Life）データ仕様書 (UK Data Specifications)

本ドキュメントは、イギリス競馬（British Horseracing Authority: BHA統轄、IFHA Part I平地全156重賞競走: G1, G2, G3）に関するデータ仕様書です。

---

## 1. 基本メタ情報 (Metadata)

| 項目 | 設定値 / 仕様 | 備考 |
| :--- | :--- | :--- |
| **国コード (`country_code`)** | `"GB"` | ISO 3166-1 alpha-2 |
| **主催者コード (`organization`)** | `"bha"` | `Organization` 型識別子 |
| **原語・対応言語 (`languages`)** | `ja`, `en`, `fr` | 日本語通称、英語正式名、仏語 |
| **レースID採番ルール (`id`)** | `{YYYY}-uk-{grade}-{index}` | 例: `2026-uk-g1-01` |
| **格付け体系 (`grades`)** | `G1`, `G2`, `G3` | IFHA Part I 平地国際重賞（全156競走） |
| **マスタファイルパス** | `src/data/uk_race_master.json` | 日英辞書、全16競馬場マスタ、推定発走時刻 |
| **生成・ビルドモジュール** | `scripts/lib/uk-races.ts`, `scripts/parse-races.ts` | IFHA Part I と BHA公式カレンダーを統合 |

---

## 2. データソース一覧 (Data Sources)

| 分類 | ソース元 / URL | 取得形式 | 用途 |
| :--- | :--- | :--- | :--- |
| **年間日程 / カレンダー** | [British Horseracing Authority (BHA)](https://www.britishhorseracing.com/) | Web / カレンダー | 年間開催日程、開催競馬場 |
| **格付け・出走条件** | IFHA Part I Great Britain リスト | PDF | レース格付け、出走資格、斤量、距離、馬場 |
| **出馬表・確定発走時刻** | `https://www.sportinglife.com/api/horse-racing/racing/racecards/{date}` | REST API (JSON) | Sporting Life 公式出馬表・確定発走時刻 |
| **過去実績補完データ** | `src/data/uk_race_master.json` | JSON | 2026年開催済み全重賞の確定発走時刻バックフィル |

---

## 3. タイムゾーン & 発走時刻仕様 (Timezone & Schedule)

- **現地タイムゾーン**:
  - 冬時間: グリニッジ標準時（GMT: UTC+0）
  - 夏時間: 英国夏時間（BST: UTC+1）
- **夏時間（BST）規則**:
  - 適用期間: 3月最終日曜日 〜 10月最終日曜日
- **UTC変換式**:
  - 夏時間（BST）: `BST - 1時間 = UTC`（日本時間 JST 比: `UTC + 9時間 = JST`、時差 8時間）
  - 冬時間（GMT）: `GMT = UTC`（日本時間 JST 比: `UTC + 9時間 = JST`、時差 9時間）
- **標準推定発走時刻（マスタ初期値）**:
  - 主要競走（エプソムダービー、キングジョージ等）: 現地 15:30〜16:35（夏時間: UTC `14:30`〜`15:35` / JST `23:30`〜`00:35`）
  - 通常重賞競走: 現地 14:00〜16:00 前後

---

## 4. 競馬場 & 馬場種別仕様 (Courses & Tracks)

### 4.1 登録競馬場一覧（平地重賞開催全16競馬場）
| 競馬場名 (日本語) | 英語表記 (`en`) | 区分 / 主な開催競走 |
| :--- | :--- | :--- |
| **アスコット** | Ascot | ロイヤルアスコット、キングジョージ6世&QES |
| **ニューマーケット** | Newmarket | 2000ギニー、1000ギニー (ローリーマイル/ジュライ) |
| **エプソム** | Epsom | ダービーステークス、オークスステークス |
| **ヨーク** | York | インターナショナルステークス (イボア開催) |
| **グッドウッド** | Goodwood | サセックスステークス (グロリアスグッドウッド) |
| **ドンカスター** | Doncaster | セントレジャーステークス (最古のクラシック) |
| **サンダウン** | Sandown | エクリプスステークス |
| **ニューベリー** | Newbury | ロッキンジステークス |
| **ヘイドック** | Haydock | スプリントカップ |
| **チェスター** | Chester | チェスターカップ、チェスターヴァーズ |
| **エア** | Ayr | エアゴールドカップ |
| **ケンプトン** | Kempton | オールウェザー競走 (9月セプテンバーS等) |
| **リングフィールド** | Lingfield | ダービートライアル (AW/芝) |
| **ニューカッスル** | Newcastle | オールウェザー直線コース (チップチェイスS等) |
| **リポン** | Ripon | 伝統の直線スプリント競走 |
| **ノッティンガム** | Nottingham | 各種前哨戦重賞 |

### 4.2 馬場種別 (`track_type`) & 特殊競走仕様
- **採用馬場種別**:
  - `turf` (芝): イギリス平地重賞の大半（アスコット、エプソム、ニューマーケット等）
  - `aw` (オールウェザー): ケンプトン、ニューカッスル等の全天候型コース

---

## 5. 確定発走時刻自動取得バッチ仕様 (RaceTimeFetcher)

- **プロバイダー名**: `UkRaceTimeFetcher`
- **実装ファイル**: `scripts/lib/uk-syutsuba.ts`, `scripts/update-race-times.ts`
- **対象開催ウィンドウ**: 基準日（JST）から直近7日間の開催予定レース（`getUkUpcomingWindowRange`）
- **CLI実行コマンド**: `npm run data:update-times:uk`（または `--org bha`）
- **定期実行スケジュール**:
  - 毎日 21:30 JST（現地午後・出馬表および確定発走時刻取得枠）
- **名寄せ・照合アルゴリズム**:
  - `ukRaceMatches` / `ukCourseMatches` により、レース名に含まれるスポンサー冠名（`BETFRED`, `QIPCO`, `CORAL` 等）、ステークス略称（`STAKES`, `CUP`）をトークン化して照合。
  - 英国夏時間判定（`isBritishSummerTime`）により、日付から正確に GMT / BST を判別して UTC 変換。
