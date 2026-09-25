# JRA（日本中央競馬会）データ仕様書 (JRA Data Specifications)

本ドキュメントは、JRA（日本中央競馬会統轄、中央競馬平地および障害全重賞競走: G1, G2, G3, J.G1, J.G2, J.G3）に関するデータ仕様書です。

---

## 1. 基本メタ情報 (Metadata)

| 項目 | 設定値 / 仕様 | 備考 |
| :--- | :--- | :--- |
| **国コード (`country_code`)** | `"JP"` | ISO 3166-1 alpha-2 |
| **主催者コード (`organization`)** | `"jra"` | `Organization` 型識別子 |
| **原語・対応言語 (`languages`)** | `ja`, `en`, `fr` | 日本語を主表示、英語、主要G1仏語 |
| **レースID採番ルール (`id`)** | `{YYYY}-jra-{grade_code}-{index}` | 例: `2026-jra-g1-01` |
| **格付け体系 (`grades`)** | `G1`, `G2`, `G3`, `J.G1`, `J.G2`, `J.G3` | 平地重賞および障害重賞 |
| **マスタファイルパス** | `src/data/jra_past_times_2026.json` | 開催済み過去重賞の実績確定発走時刻マスタ |
| **生成・ビルドモジュール** | `scripts/parse-races.ts`, `scripts/lib/jra-calendar.ts` | JRA公式カレンダーICSと `jyusyo.html` を統合 |

---

## 2. データソース一覧 (Data Sources)

| 分類 | ソース元 / URL | 取得形式 | 用途 |
| :--- | :--- | :--- | :--- |
| **年間日程 / カレンダー** | JRA公式サイト提供 公式 `.ics` / ZIP アーカイブ | iCalendar (ICS) | 年間開催日程、日割、開催競馬場 |
| **格付け・出走条件** | `https://www.jra.go.jp/datafile/seiseki/replay/{YYYY}/jyusyo.html` | HTML | レース名、グレード、出走資格、斤量、距離、馬場 |
| **出馬表・確定発走時刻** | JRA公式「今週の注目レース」および出馬表詳細ページ | HTML スクレイピング | 開催週出馬表、確定発走時刻（JST） |
| **過去実績補完データ** | `src/data/jra_past_times_2026.json` | JSON | 2026年開催済み全重賞の確定発走時刻バックフィル |

---

## 3. タイムゾーン & 発走時刻仕様 (Timezone & Schedule)

- **現地タイムゾーン**: 日本標準時（JST: UTC+9）
- **夏時間（DST）規則**: なし（通年固定）
- **UTC変換式**: `JST - 9時間 = UTC`（例: JST `15:40` $\rightarrow$ UTC `06:40:00.000Z`）
- **標準推定発走時刻（マスタ初期値）**:
  - 関東主場（東京・中山）平地重賞: `15:45` JST（UTC `06:45`）
  - 関西主場（京都・阪神）平地重賞: `15:40` JST（UTC `06:40`）
  - ローカル・北海道開催（札幌・函館・福島・新潟・中京・小倉）: `15:35` JST（UTC `06:35`）
  - 障害重賞（J.G1〜J.G3）: `13:50`〜`14:45` JST 前後

---

## 4. 競馬場 & 馬場種別仕様 (Courses & Tracks)

### 4.1 登録競馬場一覧（中央競馬主要10場）
| 競馬場名 (日本語) | 英語表記 (`en`) | 原語表記 (`fr`) | 区分 / 所在地 |
| :--- | :--- | :--- | :--- |
| **東京** | Tokyo | Tokyo | 関東主場 (東京都府中市) |
| **中山** | Nakayama | Nakayama | 関東主場 (千葉県船橋市) |
| **京都** | Kyoto | Kyoto | 関西主場 (京都府京都市) |
| **阪神** | Hanshin | Hanshin | 関西主場 (兵庫県宝塚市) |
| **中京** | Chukyo | Chukyo | ローカル主場 (愛知県豊明市) |
| **新潟** | Niigata | Niigata | ローカル場 (新潟県新潟市) |
| **福島** | Fukushima | Fukushima | ローカル場 (福島県福島市) |
| **小倉** | Kokura | Kokura | ローカル場 (福岡県北九州市) |
| **札幌** | Sapporo | Sapporo | 北海道開催 (北海道札幌市) |
| **函館** | Hakodate | Hakodate | 北海道開催 (北海道函館市) |

### 4.2 馬場種別 (`track_type`) & 特殊競走仕様
- **採用馬場種別**:
  - `turf` (芝): 平地芝競走全般
  - `dirt` (ダート): 平地ダート競走全般（フェブラリーS、チャンピオンズC等）
  - `obstacle` (障害): 障害重賞（中山大障害、中山GJ等）
- **特殊条件**:
  - 新潟直線1000m（アイビスサマーダッシュ）等の特殊直線芝コース設定。

---

## 5. 確定発走時刻自動取得バッチ仕様 (RaceTimeFetcher)

- **プロバイダー名**: `JraRaceTimeFetcher`
- **実装ファイル**: `scripts/lib/jra-syutsuba.ts`, `scripts/update-race-times.ts`
- **対象開催ウィンドウ**: 基準日（通常木曜〜翌月曜）の開催予定レース（`getJraUpcomingWeekendRange`）
- **CLI実行コマンド**: `npm run data:update-times -- --org jra`
- **定期実行スケジュール**:
  - 毎週木曜 17:30 JST（特別登録・出走馬情報枠）
  - 毎週金曜 11:30 JST（枠順確定・正式出馬表発表枠）
  - 毎週土日 07:30 JST（当日天候・順延監視枠）
- **名寄せ・照合アルゴリズム**:
  - レース名の回数表記（「第〇回」）を除去し、競馬場名および開催日（`YYYY-MM-DD`）と完全一致照合。
