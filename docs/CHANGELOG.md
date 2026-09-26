# 開発進捗 & 変更履歴 (Changelog)

本ドキュメントは、`horse-racing-calendar` プロジェクトにおける各リリース・バージョンの開発完了実績および詳細な変更履歴を記録したものです。

---

## バージョン履歴 (Version History)

### Step 41: 言語切替ボタンタップ時にヘッダーおよび検索・フィルターエリアが消失する不具合の修正 (v1.33.2 / Issue #132) [完了]
- **`overflow-x: clip` の撤去によるスクロールロック干渉・sticky解除の解消 [完了]**
  - `src/styles/globals.css` の `html, body { overflow-x: clip; }` および `src/components/shared/Layout.tsx` の最外層 `overflow-x-clip` を完全に削除。
  - Radix UI Select（言語切替ドロップダウン）展開時に発動するスクロールロック（`body` スタイル変更）と `overflow-x: clip` の干渉による包含ブロック・描画コンテキスト崩壊を防ぎ、ヘッダー（`sticky top-0`）および FilterBar（`sticky top-14`）が画面上から消失する不具合を解消。
- **安全なコンテナ幅制御の担保 [完了]**
  - `Layout.tsx` の `<main>` および `FilterBar.tsx` のコンテナに `max-w-full` を付与し、`overflow-x: clip` に頼らずに画面幅内に安全に収容。
- **仕様書・テスト更新 [完了]**
  - `docs/PRD.md` の FilterBar レスポンシブ・固定配置仕様を更新。
  - `tests/unit/Header.test.tsx` に、言語切替ドロップダウン展開時にもヘッダー要素および各機能がDOM上に保持され、消失しないことの検証テストを追加（全47テストファイル・462テストすべて合格、ビルド・型検査も正常完了）。

---

### Step 40: 複数国選択時のラベル長超過によるリセットボタンはみ出しおよび画面横揺れ・ヘッダー固定解除の解消 (v1.33.1 / Issue #130) [完了]
- **複数主催者選択時短縮キー（`filter.orgSelectShort`）新設と多言語対応 [完了]**
  - `src/libs/i18n.ts`: 日・英・仏・繁体字中国語4言語に短縮キー `orgSelectShort`（ja: 「地域」, en: "Regions", fr: "Régions", zh: "地區"）を新設。
  - `src/components/shared/FilterBar.tsx`: 2つ以上の複数国選択時は「地域 (2)」「Regions (2)」等の簡潔な表記とし、ボタン幅の肥大化を約70px以上削減。
  - 欧州3団体全選択時の「🇪🇺 ヨーロッパ (3)」表記およびアイルランド（`hri`）単一選択時（`🇮🇪 Ireland`）の表示をサポート。
- **モバイルコントロール行のレスポンシブ幅・テキスト折りたたみ最適化 [完了]**
  - 主催者トリガーボタンのテキスト要素に `max-w-[85px] sm:max-w-[130px]` を適用。
  - 詳細フィルター展開ボタンおよびリセットボタンにモバイル用 `max-w-[70px] truncate` を付与し、375px 幅や長文言語（仏語 "Réinitialiser" 等）でも1行内に美しく収まるよう調整。
- **画面横揺れ & sticky 解除防止ガード [完了]**
  - `src/styles/globals.css` の `html, body` および `src/components/shared/Layout.tsx` に `overflow-x: clip` を適用。
  - スクロールコンテナを新設しないため、子要素の `position: sticky` を阻害することなく、不意な横揺れや横スクロール発生を安全に防止。
- **仕様書・テスト更新 [完了]**
  - `docs/PRD.md` の FilterBar 仕様およびロードマップ（Step 40）を更新。
  - `tests/unit/FilterBar.test.tsx` に複数主催者選択時の短縮ラベル・幅制御テストを追加（全47テストファイル・461テストすべて合格、ビルド・型検査も正常完了）。

---

### Step 37: 欧州主要障害重賞（イギリス・アイルランド・フランス）包括統合 (v1.33.0 / Issue #126, #127, #128) [完了]
- **イギリス主要障害重賞（BHA Jump Pattern 計34競走）の統合 (Issue #126) [完了]**
  - `src/data/uk_race_master.json`: チェルトナム (`Cheltenham`)、エイントリー (`Aintree`) を競馬場マスタに追加。
  - チェルトナムフェスティバル全14G1（チェルトナムゴールドC、チャンピオンハードル、クイーンマザーチャンピオンチェイス、ステイヤーズハードル等）、エイントリー・グランドナショナルフェスティバル全9G1および伝統の世界最高峰障害競走グランドナショナル（Premier Handicap / `grade: G3` / 6858m）、ケンプトン・キングジョージ6世チェイス、その他冬期主要G1等計34競走を追加（イギリス重賞合計190競走）。
  - `docs/specs/data-sources/uk.md` の改訂、`scripts/lib/uk-races.ts` の `track_type: obstacle` および `age_constraint: 4yo` 対応。
- **アイルランド主要障害重賞（HRI Jump Pattern 計31競走）の統合 (Issue #127) [完了]**
  - `src/data/ireland_race_master.json`: パンチェスタウン (`Punchestown`)、ゴルウェイ (`Galway`)、リムリック (`Limerick`) を競馬場マスタに追加。
  - ダブリンレーシングフェスティバル全8G1（アイリッシュゴールドC、アイリッシュチャンピオンハードル、ダブリンチェイス等）、フェアリーハウス・イースターフェスティバル（アイリッシュグランドナショナル / Premier Handicap `grade: G3` / 5834m、ウィローウォームゴールドC等）、パンチェスタウンフェスティバル全12G1（パンチェスタウンゴールドC、チャンピオンチェイス等）、クリスマスG1群等計31競走を追加（アイルランド重賞合計98競走）。
  - `docs/specs/data-sources/ireland.md` の改訂、`scripts/lib/ireland-races.ts` の `track_type: obstacle` および `age_constraint: 4yo` 対応。
- **フランス主要障害重賞（France Galop オートゥイユ競馬場全8G1競走）の統合 (Issue #128) [完了]**
  - `src/data/france_race_master.json`: 障害の聖地オートゥイユ (`Auteuil`) を競馬場マスタに追加。
  - オートゥイユ競馬場開催の全8G1競走（春のグラン・スティープルチェイス・ド・パリ ウィークエンド: パリ大障害 芝6000m、オートゥイユ大ハードル 芝5100m、フェルディナン・デュフォー賞、アラン・デュ・ブレユ賞、秋の48 Heures de l'Obstacle: ラ・エ・ジュグラ賞 芝5500m、モーリス・ジロワ賞、ルノー・デュ・ヴィヴィエ賞、カンバセレス賞）を追加（フランス重賞合計121競走）。
  - `docs/specs/data-sources/france.md` の改訂、`scripts/lib/france-races.ts` の `track_type: obstacle` および `age_constraint: 4yo` 対応。
- **共通パイプライン & UI統合 [完了]**
  - `scripts/parse-races.ts`: `RaceOutput` の `age_constraint` に `4yo` を追加し、全1,336競走の完全ビルド出力を実現。
  - 単体・統合テストの網羅的アップデート（全47テストファイル、459テストすべて完全通過）。
  - `docs/PRD.md`: ロードマップおよびプロダクト概要の更新。

---

### Step 36: 海外競馬第5弾・アイルランド競馬（HRI / IFHA Part I 重賞）統合 (v1.32.0 / Issue #121, #122, #123, #124) [完了]
- **Phase 1: PRD改訂・要件定義・TypeScript型定義 (Issue #121) [完了]**
  - データ仕様書 `docs/specs/data-sources/ireland.md` の新規策定（一次データソース、夏時間ルール、競馬場、ID体系）。
  - `src/types/race.ts` の型定義拡張（`Organization: 'hri'`, `CountryCode: 'IE'`）。
  - `docs/PRD.md` へのアイルランド競馬仕様の統合。
- **Phase 2: アイルランド重賞データ抽出・日英仏中マスタ作成およびパイプライン統合 (Issue #122) [完了]**
  - `src/data/ireland_race_master.json`: アイルランド平地国際全67重賞（G1: 13競走、G2: 14競走、G3: 40競走）の日英仏中4言語マスタ作成（愛ダービー、愛オークス、愛チャンピオンS等を網羅）。
  - `scripts/lib/ireland-races.ts`: マスタ読み込み・データ正規化モジュール実装。
  - `scripts/parse-races.ts`: 年間データビルドパイプラインへの統合（合算で全1263レース生成）。
  - 単体テスト（`tests/unit/irelandRaces.test.ts`）の実装と既存テストの追従。
- **Phase 3: アイルランド競馬UI対応（主催者フィルター・主要競馬場・IEバッジ・免責事項） (Issue #123) [完了]**
  - 主催者フィルターへの「アイルランド (HRI)」追加、モバイルモーダルでの欧州地域グルーピング（「欧州全重賞」一括選択/解除）への統合。
  - 競馬場フィルターへのアイルランド主要9競馬場（カラ、レパーズタウン、ネース、コーク、ティペラリー、ダンドーク、ゴウランパーク、フェアリーハウス、ナヴァン）の追加（日/英/仏/中4言語完全対応）。
  - タイムラインビュー、カレンダービュー、詳細ダイアログにおける国コード「IE」バッジおよび「HRI」組織バッジのスタイル適用（アイリッシュグリーン基調）。
  - 免責事項ダイアログ（`DisclaimerDialog`）、フッター、およびドキュメントタイトルへの HRI（Horse Racing Ireland）の出典・非公式性・知的財産権の明記。
  - 原語判定（`src/libs/raceLanguage.ts`）に `IE` / `hri` を追加し、原語を英語として自動判定。
  - 構造化データ（JSON-LD）にアイルランド競馬（HRI）を反映。
- **Phase 4: アイルランド重賞確定発走予定時刻自動更新バッチ（`IeRaceTimeFetcher`）の実装 & 過去実績補完 (Issue #124) [完了]**
  - `scripts/lib/ie-syutsuba.ts`: Sporting Life API 出馬表のパース、アイルランド夏時間（IST: UTC+1）および冬時間（GMT: UTC+0）の判定、表記揺れを吸収する名寄せアルゴリズム（`ieRaceMatches`, `ieCourseMatches`）の実装。
  - `scripts/update-race-times.ts`: `IeRaceTimeFetcher` の実装と `DEFAULT_FETCHERS` への `hri` / `ie` プロバイダー登録、直近7日間の開催予定ウィンドウ（`getIeUpcomingWindowRange`）の実装。
  - 過去開催済みアイルランド重賞（2026年9月26日以前の60レース）の確定発走時刻バックフィル（`is_time_confirmed: true`）。
  - 本日（2026-09-26）開催の「ベレスフォードステークス（G2, カラ競馬場）」の確定発走時刻（13:10 UTC / 22:10 JST）への実データ自動更新を確認。
  - 単体テスト（`tests/unit/irelandSyutsuba.test.ts`）の実装（全9テスト完全合格）。
  - `package.json` および `docs/batch-schedules.md`: `data:update-times:ie` コマンド新設およびバッチ運用仕様の反映。

---
- **Phase 1: PRD改訂・要件定義・TypeScript型定義 (Issue #109) [完了]**
  - `docs/PRD.md` 改訂、`src/types/race.ts` の型定義拡張（`Organization: 'hkjc'`, `CountryCode: 'HK'`, `LocalizedText.zh?: string`, `AgeConstraint: '4yo'`）。
- **Phase 2: 香港重賞データ抽出・日英中マスタ作成およびパイプライン統合 (Issue #110) [完了]**
  - `src/data/hk_race_master.json`: 香港全35重賞（G1 15競走、G2 7競走、G3 13競走）の日英中マスタ作成（香港国際競走、チャンピオンズデー、香港三冠、4歳クラシックシリーズ等を網羅）。
  - `scripts/lib/hk-races.ts`: マスタ読み込み・データ正規化モジュール実装。
  - `scripts/parse-races.ts`: ビルドパイプライン統合（国内・欧州・米国・香港合算で全1196レース生成）。
  - 単体テスト（`tests/unit/hkRaces.test.ts`）の実装と既存テストの追従。
- **Phase 3: 香港競馬UI対応（主催者フィルター・主要競馬場・HKバッジ・原語表示・免責事項） (Issue #111) [完了]**
  - 主催者フィルターへの「香港 (HKJC)」追加、モバイルモーダルでのアジア地域グルーピング（「アジア全重賞」一括選択/解除）対応。
  - 競馬場フィルターへの香港2競馬場（シャティン / 沙田、ハッピーバレー / 跑馬地）の追加（日/英/仏3言語完全対応）。
  - タイムラインビュー、カレンダービュー、詳細ダイアログにおける国コード「HK」バッジおよび「HKJC」組織バッジのスタイル適用（オリエンタルレッド/クリムゾン）。
  - レース詳細ダイアログおよび一覧での原語（繁体字中国語 `race.name.zh`）併記、検索エンジンでの中国語検索対応。
- **Phase 4: 香港重賞確定発走予定時刻自動更新バッチ（`HkRaceTimeFetcher`）の実装 & 過去実績補完 (Issue #112) [完了]**
  - `scripts/lib/hk-syutsuba.ts`: 香港競馬（HKJC）の出馬表パース（英語名、中文名、スポンサー名、エイリアス照合）および香港時間（HKT: UTC+8、夏時間なし）から UTC ISO / JST への時刻変換モジュールの実装。
  - `scripts/update-race-times.ts`: `HkRaceTimeFetcher` の実装と `DEFAULT_FETCHERS` への `hkjc` / `hk` プロバイダー登録、直近7日間の開催予定ウィンドウ（`getHkUpcomingWindowRange`）の実装。
  - 過去開催済み香港重賞（2026年今日以前の23レース）の確定発走時刻バックフィル:
    - `src/data/hk_race_master.json` の過去23レースを `is_time_confirmed: true` に更新。
    - `scripts/parse-races.ts` による再生成で `public/data/races.json` の確定済みフラグを同期反映（全35レース中23レース確定済み、12レースが今後の予定）。
  - 単体テスト（`tests/unit/hkSyutsuba.test.ts`）の実装:
    - 香港時間変換、レース名・競馬場名マッチング、出馬表パース、`updateRaceTimes` 統合の全9テスト完全合格。
  - `package.json` および `.github/workflows/update-race-times.yml`: `data:update-times:hk` コマンド新設およびバッチ運用仕様（`docs/batch-schedules.md`）の反映。

---

### Step 33: 海外競馬第3弾・アメリカ競馬（US / Equibase）の統合 (v1.28.0 / Issue #101, #102, #103, #104) [完了]
- **Phase 1: PRD改訂およびスキーマ・型定義拡張 (Issue #101) [完了]**
  - `src/types/race.ts`: `Organization` 型に `'equibase'` を追加。
  - `docs/PRD.md`: v1.28.0 仕様策定（一次データソース、タイムゾーン、ID体系等の明文化）。
- **Phase 2: アメリカ重賞データ抽出・日英マスタ作成およびパイプライン統合 (Issue #102) [完了]**
  - `src/data/us_race_master.json`: 米国全408重賞（G1 92競走、G2 133競走、G3 183競走）の日英マスタ作成（ケンタッキーダービー等の三冠、ブリーダーズカップ全競走等を網羅）。
  - `scripts/lib/us-races.ts`: マスタ読み込み・データ正規化モジュール実装。
  - `scripts/parse-races.ts`: ビルドパイプライン統合（国内・欧州・米国合算で全1161レース生成）。
  - 単体テスト（`tests/unit/usRaces.test.ts`）の実装と既存テストの追従。
- **Phase 3: アメリカ競馬UI対応（主催者フィルター・主要競馬場・USバッジ・免責事項） (Issue #103) [完了]**
  - 主催者フィルターへの「アメリカ (Equibase)」追加、モバイルモーダルでの北米地域グルーピング（「米国全重賞」一括選択/解除）対応。
  - 競馬場フィルターへのアメリカ主要16競馬場（チャーチルダウンズ、サラトガ、ベルモントパーク、デルマー、サンタアニタ等）の追加（日/英/仏3言語完全対応）。
  - タイムラインビュー、カレンダービュー、詳細ダイアログにおける国コード「US」バッジおよび「EQUIBASE」組織バッジのスタイル適用。
  - 免責事項ダイアログ（`DisclaimerDialog`）およびフッターへの Equibase / The Jockey Club の出典・非公式性・知的財産権の明記（日/英/仏）。
  - 接続元地域判定（`src/libs/geolocation.ts`）に米国タイムゾーン（`America/*`, `US/*`）および `en-US` ロケールからの `US` 判定と初期主催者 `['equibase']` マッピングを追加。
  - 原語判定（`src/libs/raceLanguage.ts`）に `equibase` を追加し、原語を英語として自動判定。
  - Schema.org JSON-LD（`index.html`）にアメリカ競馬（Equibase）を反映。
  - 単体・統合テストの拡充（全42テストファイル・377テスト完全合格）。
- **Phase 4: 確定発走時刻自動更新パイプラインおよび過去開催実績バックフィル (Issue #104) [完了]**
  - `scripts/lib/us-syutsuba.ts` の実装:
    - 米国タイムゾーン（ET, CT, MT, PT）および夏時間（DST）の自動判定と UTC ISO 8601 / JST 発走時刻換算。
    - 競馬場名に応じたタイムゾーン自動マッピング（`getCourseTimeZone`）。
    - 表記揺れを吸収する正規化・トークン化マッチングアルゴリズム（`usRaceMatches`, `usCourseMatches`）。
    - Equibase出馬表データからの確定発走時刻パース処理（`parseEquibaseRacecardsJson`）。
    - 指数バックオフ付きHTTPリトライ通信（`fetchWithRetry`）。
  - `scripts/update-race-times.ts` へのプロバイダー統合（`UsRaceTimeFetcher`）。
  - 過去開催済み重賞（2026年今日以前の296レース）の確定発走時刻バックフィル（`is_time_confirmed: true`）。
  - バッチスケジュール・ワークフロー連携（`docs/batch-schedules.md`、`npm run data:update-times:us`）。
  - 単体テスト（`tests/unit/usSyutsuba.test.ts`）の全15テスト完全合格。
- **Phase 5: アメリカ競馬マスタの日付計算不具合解消 & バリデーション強化 (Issue #106) [完了]**
  - 不具合の根本原因: 前年開催曜日（土曜）を2026年の同一曜日に合わせる補正計算において、月末日（30日/31日）を超過した場合の月跨ぎ処理の欠落（全408レース中19レースで不正日付発生）。
  - 恒久対策: `src/data/us_race_master.json` の該当19レースの日付を正しい暦日へ更新し、マークアップゴミを除去。`public/data/races.json` の全1,161レースへ同期反映。
  - 単体テスト（`tests/unit/usRaces.test.ts`, `tests/unit/racesData.test.ts`）に全レースの実在暦日バリデーションアサーションを追加。
- **Phase 6: 開催国・競馬場増加に伴うフィルタービューの画面占有解消と主催者連動UI最適化 (Issue #107) [完了]**
  - 主催者（開催国）選択と競馬場グループの動的連動（選択中主催者の競馬場グループのみを表示、地域クイックセレクター提供）。
  - 主催者選択に応じたグレード・馬場種別選択肢の最適化（海外主催者選択時の障害・地方重賞非表示化など）。
  - フィルターパネルの高さ制限 & 内部スクロールによる画面突き抜け防止（`max-h-60 sm:max-h-80 overflow-y-auto`）。
  - 単体テスト拡充（`FilterBar.test.tsx`、全43スイート・399テスト完全合格）。

---

### Step 32: 海外競馬第2弾：イギリス競馬（BHA / IFHA Part I 重賞）統合 (v1.23.0 / Issue #83, #84, #85, #86) [完了]
- **Phase 1: PRD改訂 (v1.23.0) およびイギリス競馬スキーマ・型定義の拡張 (Issue #83) [完了]**
  - `docs/PRD.md` 改訂、`src/types/race.ts` の型定義拡張（`Organization: 'bha'`, `CountryCode: 'GB'`, `FilterState.organization: 'bha'`）。
- **Phase 2: イギリス重賞データ抽出・日英マスタ作成およびパイプライン統合 (Issue #84) [完了]**
  - `src/data/uk_race_master.json`（全156重賞の日英マスタ、全16競馬場、距離・馬場・AW対応、夏時間BST/GMT自動吸収）の作成。
  - `scripts/lib/uk-races.ts` の実装および `scripts/parse-races.ts` への統合マージ処理追加（全753レース出力）。
  - 単体テスト（`tests/unit/ukRaces.test.ts`, `tests/unit/racesData.test.ts`）の拡充と全テスト合格。
- **Phase 3: イギリス競馬UI対応（主催者フィルター「UK」、競馬場グループ追加、GB国コードバッジ、多言語化） (Issue #85) [完了]**
  - `FilterBar`: 主催者フィルターセグメントに「イギリス (UK)」を追加（`bha`）、競馬場グループ「イギリス (UK)」の追加（全16場）。
  - UIバッジ: 国コード「GB」バッジの実装（スカイブルー配色）および主催者「BHA」タグのカラーリング対応。
  - 多言語化: 日・英・仏の各辞書への UK / BHA 対応。
- **Phase 4: イギリス重賞確定発走予定時刻自動更新バッチ（`UkRaceTimeFetcher`）の実装 & 過去実績補完 (Issue #86) [完了]**
  - Sporting Life API からの出馬表プログラム自動取得スクリプト（`scripts/lib/uk-syutsuba.ts`）の実装。
  - 英国夏時間（BST: UTC+1）／冬時間（GMT: UTC+0）の自動判別および UTC ISO 8601 文字列・JST表記算出。
  - 名寄せ照合エンジン（`ukRaceMatches`, `ukCourseMatches`）の開発。
  - `scripts/update-race-times.ts` への `UkRaceTimeFetcher` 統合（`npm run data:update-times:uk`）。
  - 過去イギリス重賞129レースを実績発走時刻で完全確定化（`is_time_confirmed: true`）。
  - 単体テスト `tests/unit/ukSyutsuba.test.ts` 新設（全38スイート・336テスト合格）。
- **Phase 5: 接続元地域に応じた初期主催者の自動切り替え & 設定永続化 (Issue #87) [完了]**
  - `src/libs/geolocation.ts` の実装: クライアント側タイムゾーンおよび言語判定による初期主催者の自動選択と `localStorage` 永続化。
- **Phase 6: 主催者・開催国フィルターの複数選択対応（JRA+NAR同時選択など） (Issue #90) [完了]**
  - `FilterState.organizations: Organization[]`（配列）への完全移行。
  - `FilterBar`: 複数トグル選択UI（`aria-pressed` 対応）。
- **Phase 7: スマホ画面での開催国・主催者フィルターUIの最適化 (Issue #92) [完了]**
  - モバイル画面でコンパクトなトリガーボタンから地域別グルーピング `Dialog` を展開するハイブリッド設計。
- **Phase 8: PWAインストール時のアプリ名称およびホーム画面メタタグの多言語対応 (Issue #94) [完了]**
  - 多言語アプリ名称定義および `apple-mobile-web-app-title` 動的同期（`src/libs/pwaMetadata.ts`）。
- **Phase 9: PWAインストール促進案内バナーの実装 (Issue #95) [完了]**
  - Android インストールバナー & iOS ホーム画面追加手順ガイド（`src/components/shared/PwaInstallPrompt.tsx`）。
- **Phase 10: Android PWAインストール時のアイコン余白解消 & 静的マニフェスト配信担保 (Issue #98) [完了]**
  - 静的 `manifest.webmanifest` 配信の担保と maskable アイコン余白解消。
- **Phase 11: モバイル画面のフィルター操作ボタン文言短縮による見切れ解消 (Issue #96) [完了]**
  - 操作ボタンの簡潔な表記（「フィルター」「All Orgs」等）とレイアウト最適化。

---

### Step 31: サイトUIのフランス語（fr）対応および多言語切替UI・レース名多言語表示ルールの刷新 (v1.22.0 / Issue #81) [完了]
- **多言語ストアの3言語化 (`src/store/useLanguageStore.ts`)**: 言語型 `'ja' | 'en' | 'fr'` への拡張。
- **Shadcn UI Select による言語切替UI (`src/components/shared/Header.tsx`)**: ドロップダウン（`JA`, `EN`, `FR`）へ刷新。
- **フランス語辞書（`translations.fr`）の完全網羅 (`src/libs/i18n.ts`)**: 全キーの仏語訳を提供。
- **レース名多言語表示ルールの刷新 (`src/libs/raceLanguage.ts`)**: メイン表示（選択言語）/ サブ表示（開催国原語）の整理、重複時の自動非表示、日本レース仏語名対応。
- **日付・時刻・コンポーネントのフランス語対応**: `src/libs/date.ts`, `GradeBadge.tsx`, `index.html`。

---

### Step 30: 新しい国の競馬（海外競馬）を追加する開発・運用手順書の作成 (Issue #79) [完了]
- `docs/guides/adding-new-country.md` の新設。データ設計・確定時刻取得・UI拡張の知見を体系化。

---

### Step 29: フランス重賞発走予定時刻自動更新パイプライン整備 & 過去重賞実績発走時刻補完 (v1.21.0 / Issue #73, #77) [完了]
- **確定発走予定時刻自動取得パイプライン (`FranceRaceTimeFetcher` / Issue #73)**: PMU API からの出馬表自動取得、夏時間/冬時間自動吸収、名寄せ照合、Actions定期バッチ増設。
- **過去フランス重賞実績発走時刻補完 & 廃止競走整理 (Issue #77)**: 過去88レースの実績発走時刻補完（`is_time_confirmed: true`）、国内・フランス全過去414レース確定化完了。

---

### Step 28: JRA過去重賞発走時刻マスタ整備および国内過去全重賞確定バックフィルの完了 (v1.20.2) [完了]
- `src/data/jra_past_times_2026.json` の作成とバックフィルスクリプト（`scripts/backfill-jra-past-times.ts`）の実装。国内過去297重賞の発走時刻を100%確定化。

---

### Step 27: NAR確定発走予定時刻の自動更新パイプライン拡充および過去重賞バックフィル (v1.20.0 〜 v1.20.1 / Issue #72) [完了]
- keiba.go.jp `RaceList`（各場当日出馬表）スクレイパーの実装とNAR全15場の馬場コードマッピング。
- 過去重賞一括バックフィルスクリプト（`scripts/backfill-nar-past-times.ts`）の実装により、過去NAR全199重賞の確定発走時刻更新完了。

---

### Step 26: バッチ処理スケジュール・運用ドキュメントの整備 (Issue #69) [完了]
- `docs/batch-schedules.md` の新設。cronバッチスケジュール一覧、CLIフラグ、トラブルシューティングの文書化。

---

### Step 25: 海外競馬：フランス競馬（France-Galop / IFHA Part I 重賞）統合 (v1.19.0 / Issue #64, #65, #66) [完了]
- **Phase 1: PRD改訂および海外・フランス競馬スキーマ定義 (Issue #64)**: `country_code: "FR"`, `organization: "france_galop"`, `track_type: "aw"`, `LocalizedText.fr`。
- **Phase 2: フランス重賞データ抽出・日仏英マスタ作成および統合マージ (Issue #65)**: `src/data/france_race_master.json`（全114重賞）作成、パイプライン統合。
- **Phase 3: フランス競馬UI対応 (Issue #66)**: 主催者フィルター「France」、競馬場グループ、FR国コードバッジ、フランス語原語名併記。

---

### Step 24: NAR・将来拡張に対応したヘッダー英語表記・検索例・metaタグの再整理 (v1.18.2 / Issue #62) [完了]
- 包括的英語表記 `Graded Races Calendar`、検索プレースホルダー例、meta/OGP/構造化データ再整理。

---

### Step 23: 未確定レースの未来発走予定時刻非表示・時刻未定対応 (v1.18.2 / Issue #56) [完了]
- 公式発表前の未来レースにおいてデフォルト推定時刻表示を廃止し、「時刻未定 / TBD」を表示。

---

### Step 22: NAR重賞英語レース名におけるカタカナ外来語の英単語置換 (v1.18.1 / Issue #59) [完了]
- カタカナ外来語辞書（45語彙）拡充、主要レース辞書追加。

---

### Step 21: フィルターバーのアコーディオン型折りたたみ/展開機能の実装 (v1.18.0 / Issue #51) [完了]
- 画面スクロール連動による詳細フィルター自動折りたたみ/展開、手動トグル制御および要約バッジバー。

---

### Step 20: NAR全重賞 & ばんえい競馬データパイプラインおよびUI対応 (v1.17.0) [完了]
- **Phase 1: NARスクレイパー & 補完マスター基盤の構築**: `schedule_2026.html` スクレイパー、`nar_race_master.json` 作成、馬場種別 `banei` 新設。
- **Phase 2: データ統合 & 型安全マージパイプライン**: JRA/NAR統合マージ、TypeScript型拡張。
- **Phase 3: フロントエンド & デザインシステム対応**: 新グレードバッジ（`Jpn1〜3`, `S1〜3`, `local_grade`）、競馬場グループ化。
- **Phase 4: 当週NAR確定時刻自動取得**: `NarRaceTimeFetcher` 実装。

---

### Step 19: UI多言語（日/英）対応の実装 (v1.16.0) [完了]
- Zustand 5 による軽量言語ストア、日英動的切り替え。

---

### Step 1〜18: MVP & 初期基盤構築 (v1.0.0 〜 v1.15.1) [完了]
- **Step 1**: 初期 PRD / AGENTS.md 配置。
- **Step 2**: JRA公式 `.ics` / `jyusyo.html` 結合ビルドスクリプト作成。
- **Step 3**: Shadcn UI + Tailwind CSS 初期化。
- **Step 4**: タイムラインビュー & 月間カレンダービュー実装。
- **Step 5**: PWA & Service Worker（Workbox）オフラインキャッシュ。
- **Step 6**: GitHub Actions CI/CD パイプライン。
- **Step 7**: JRA公式 `.ics` / ZIP 自動ダウンロード・展開。
- **Step 8**: 発走ステータスバッジの改善（レース終了後非表示、`v1.2.0`）。
- **Step 9**: JRA確定時刻自動更新バッチ（`v1.3.0`）。
- **Step 10**: 天候等による代替競馬・開催日変更対応（`v1.4.0`）。
- **Step 11**: PWA BroadcastUpdatePlugin 画面反映（`v1.5.0`）。
- **Step 12**: 免責事項ダイアログ（`DisclaimerDialog`、`v1.5.1`）。
- **Step 13**: タイムライン今日ハイライト & フローティングジャンプボタン。
- **Step 14**: 主要10競馬場 & 4区分距離フィルター。
- **Step 15**: 新公式アプリアイコン・公式カラー `#047B5F` 導入。
- **Step 16**: ダークモード対応（OS連動・永続化）。
- **Step 17**: GA4、メタタグ、OGP、Schema.org 構造化データ、robots、sitemap。
- **Step 18**: 確定発走時刻保持機能（`preserveConfirmedRaceTimes`）、斤量日本語表記最適化（`v1.15.1`）。
