# オーストラリア競馬（Racing Australia）データ仕様書 (Australia Data Specifications)

本ドキュメントは、オーストラリア競馬（Racing Australia統轄、IFHA Part I重賞競走、および主要重要競走: ジ・エベレスト、メルボルンカップ、コックスプレート、コーフィールドカップ、ゴールデンスリッパー等）に関するデータ仕様書です。

---

## 1. 基本メタ情報 (Metadata)

| 項目 | 設定値 / 仕様 | 備考 |
| :--- | :--- | :--- |
| **国コード (`country_code`)** | `"AU"` | ISO 3166-1 alpha-2 |
| **主催者コード (`organization`)** | `"racing_australia"` | `Organization` 型識別子 |
| **原語・対応言語 (`languages`)** | `ja`, `en`, `fr`, `zh` | 日本語通称、英語公式名（原語）、仏語、繁体字中国語 |
| **レースID採番ルール (`id`)** | `{YYYY}-au-{grade}-{index}` | 例: `2026-au-g1-01` |
| **格付け体系 (`grades`)** | `G1`, `G2`, `G3` | IFHA Part I 国際重賞およびオーストラリア主要特定条件競走 |
| **マスタファイルパス** | `src/data/australia_race_master.json` | 日英仏中辞書、主要競馬場マスタ、推定発走時刻 |
| **生成・ビルドモジュール** | `scripts/lib/australia-races.ts`, `scripts/parse-races.ts` | IFHA Part Iと公式スケジュールを統合 |

---

## 2. データソース一覧 (Data Sources)

| 分類 | ソース元 / URL | 取得形式 | 用途 |
| :--- | :--- | :--- | :--- |
| **年間日程 / カレンダー** | [Racing Australia](https://www.racingaustralia.horse/) / 州統轄団体（Racing NSW, Racing Victoria 等） | Web / スケジュール | 年間開催日程、開催競馬場 |
| **格付け・出走条件** | IFHA Part I Australia リスト | PDF | レース格付け、出走資格、斤量、距離、馬場 |
| **出馬表・確定発走時刻** | [Racing Australia Calendar & Race Fields](https://www.racingaustralia.horse/FreeServices/Calendar_Races.aspx) 等 | Web / REST | Racing Australia 公式出馬表・確定発走時刻 |
| **レース結果・勝ち馬情報** | Racing Australia 公式リザルトアーカイブ | Web / JSON | 着順、勝ち馬（英語名・騎手・タイム・馬番） |
| **過去実績補完データ** | `src/data/australia_race_master.json` | JSON | 2026年開催済み重賞の確定発走時刻・勝ち馬バックフィル |

---

## 3. タイムゾーン & 発走時刻仕様 (Timezone & Schedule)

- **現地タイムゾーン**:
  - **ニューサウスウェールズ州 (NSW: シドニー) / ビクトリア州 (VIC: メルボルン)**:
    - 冬時間（標準時）: オーストラリア東部標準時（AEST: UTC+10）
    - 夏時間: オーストラリア東部夏時間（AEDT: UTC+11）
  - **クイーンズランド州 (QLD: ブリスベン)**:
    - 通年: オーストラリア東部標準時（AEST: UTC+10、夏時間なし）
  - **南オーストラリア州 (SA: アデレード)**:
    - 冬時間: オーストラリア中央標準時（ACST: UTC+9:30）
    - 夏時間: オーストラリア中央夏時間（ACDT: UTC+10:30）
  - **西オーストラリア州 (WA: パース)**:
    - 通年: オーストラリア西部標準時（AWST: UTC+8、夏時間なし）
- **夏時間（DST）規則**:
  - 南半球のため、**10月第1日曜日 午前2:00 〜 翌年4月第1日曜日 午前3:00** が夏時間（AEDT / ACDT）となります。
  - 2026年の切替予定:
    - 2026年4月5日（日）午前3:00に夏時間終了 $\rightarrow$ AEST / ACST
    - 2026年10月4日（日）午前2:00に夏時間開始 $\rightarrow$ AEDT / ACDT
- **UTC変換式**:
  - AEDT（夏時間）: `AEDT - 11時間 = UTC`（日本時間 JST 比: `UTC + 9時間 = JST`、日本より2時間先行）
  - AEST（標準時）: `AEST - 10時間 = UTC`（日本時間 JST 比: `UTC + 9時間 = JST`、日本より1時間先行）
- **標準推定発走時刻（マスタ初期値）**:
  - 主要G1競走（メルボルンカップ、コックスプレート、ジ・エベレスト等）:
    - 現地 15:00〜17:15 前後
    - 日本時間（JST）: 13:00〜15:15 前後（日本の主要重賞と重なる時間帯）

---

## 4. 競馬場 & 馬場種別仕様 (Courses & Tracks)

### 4.1 登録競馬場一覧
| 競馬場名 (日本語) | 英語表記 (`en`) | 繁体字表記 (`zh`) | 州 / 主な開催競走 |
| :--- | :--- | :--- | :--- |
| **ロイヤルランドウィック** | Royal Randwick | 皇家蘭域 | NSW / ジ・エベレスト、ドンカスターマイル、クイーンエリザベスS、オーストラリアンダービー |
| **フレミントン** | Flemington | 費明頓 | VIC / メルボルンカップ、オーストラリアンギニー、ブラックキャビアライトニング、チャンピオンズS |
| **コーフィールド** | Caulfield | 考菲爾德 | VIC / コーフィールドカップ、コーフィールドギニー、CFオーアS、フューチュリティS |
| **ローズヒルガーデンズ** | Rosehill Gardens | 玫瑰崗 | NSW / ゴールデンスリッパー、ローズヒルギニー、ジョージライダーS、タンクレッドS |
| **ムーニーバレー** | Moonee Valley | 滿利谷 | VIC / コックスプレート、マニカトS |
| **イーグルファーム** | Eagle Farm | 鷹園 | QLD / ストラドブロークH、クイーンズランドダービー |
| **ドゥームベン** | Doomben | 多姆奔 | QLD / ドゥームベン10,000、ドゥームベンカップ |
| **モーフェットビル** | Morphettville | 莫費特維爾 | SA / サウスオーストラリアンダービー、グッドウッド、ロバートサングスターS |
| **アスコット** | Ascot | 雅士閣 | WA / レイルウェイS、ウィンターボトムS、ノラリーS |

### 4.2 馬場種別 (`track_type`) & 特殊競走仕様
- **採用馬場種別**:
  - `turf` (芝): オーストラリアの主要競馬場・重賞はすべて高品質な天然芝コースで施行。
- **特殊重要競走**:
  - **ジ・エベレスト (The Everest)**: ランドウィック競馬場芝1200m。世界最高賞金の芝スプリント競走（スロットレース、国際格付けG1）。
  - **メルボルンカップ (Melbourne Cup)**: フレミントン競馬場芝3200m。オーストラリア最大の国民的ハンデG1競走（「国を止めるレース」）。

---

## 5. 確定発走時刻およびリザルト自動取得バッチ仕様

### 5.1 発走予定時刻自動更新バッチ (RaceTimeFetcher)
- **プロバイダー名**: `AustraliaRaceTimeFetcher`
- **実装ファイル**: `scripts/lib/australia-syutsuba.ts`, `scripts/update-race-times.ts`
- **対象開催ウィンドウ**: 基準日（JST）から直近7〜14日間の開催予定レース
- **CLI実行コマンド**: `npm run data:update-times -- --org racing_australia`
- **定期実行スケジュール**:
  - オーストラリア開催直前・当日枠（日本時間土曜 10:00, 11:30 JST 等）

### 5.2 レース結果・勝ち馬自動取得バッチ (RaceResultFetcher)
- **プロバイダー名**: `AustraliaRaceResultFetcher`
- **実装ファイル**: `scripts/lib/australia-results.ts`, `scripts/update-race-results.ts`
- **CLI実行コマンド**: `npm run data:update-results -- --org racing_australia`
- **定期実行スケジュール**:
  - オーストラリア開催終了枠（日本時間土曜 16:30, 18:30 JST 等）

### 5.3 公式サイトリンク（official_url）に関する方針
- **基本方針 (Issue #190 準拠)**:
  - 確度100%が保証されたレース（JRA G1確定結果マスタ等）以外への公式リンク付与は完全廃止されています。
  - オーストラリア競馬の各レースにおいては、推測による動的URL生成（デッドリンクや他レース誤リンクのリスク）を一切行わず、`official_url` は設定せず未設定（`undefined`）のまま保持します。
  - これにより、UI上では外部リンクボタン・アイコンが表示されず、安全な非表示制御が機能します。
