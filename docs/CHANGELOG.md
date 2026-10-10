# 開発進捗 & 変更履歴 (Changelog)

本ドキュメントは、`horse-racing-calendar` プロジェクトにおける各リリース・バージョンの開発完了実績および詳細な変更履歴を記録したものです。

---

## バージョン履歴 (Version History)

### Step 73: 依存関係の一括安定更新（Vite / Radix Tabs / Lucide / tsx）および TypeScript 7 メジャー更新抑止設定 (v1.44.13 / PR #219, #222, #230, #231, #232) [完了]
- **Dependabot 起票 PR の一括統合・安定バージョン更新 [完了]**
  - 個別マージによる lockfile コンフリクトを回避するため、安全なパッチ・マイナー更新 4 件を一括統合して更新：
    - `vite`: `8.3.0` → `8.3.3`（パフォーマンス向上、ウォッチャー例外処理）
    - `@radix-ui/react-tabs`: `1.1.21` → `1.1.22`（タブ切替時のフォーカス/blur制御修正）
    - `lucide-react`: `1.46.0` → `1.52.0`（新規アイコン追加、SVGエスケープ修正）
    - `tsx`: `4.23.13` → `4.23.15`（スクリプト実行時バグ修正）
- **TypeScript 7.0 メジャー更新の抑止設定 (`.github/dependabot.yml`) [完了]**
  - PRD 要件（TypeScript 5）および周辺エコシステム（Vite, tsx, vitest 等）との整合性を維持するため、TypeScript 7 への破壊的メジャーバージョンアップ（PR #222）をクローズ。
  - `.github/dependabot.yml` の `ignore` ルールに `typescript` の `semver-major` を追加し、以後の自動起票を抑止。
- **品質・整合性検証 [完了]**
  - `npm run type-check`、`npm test`（全66テストファイル・628テスト）、`npm run build` による検証を実施し、全件成功を確認。

---

### Step 72: Dependabot による @types/node メジャーバージョン自動更新の抑止設定 (v1.44.12 / PR #220) [完了]
- **Node.js 22 ランタイム整合性維持のための Dependabot 設定 (`.github/dependabot.yml`) [完了]**
  - プロジェクトの実行環境（CI/CD、GitHub Actions、各バッチ）が Node.js 22 LTS（`node-version: 22`）であるため、Node 26 向けの型定義（`@types/node@26.6.4`）への自動アップグレードによる実行時未定義エラーリスクを防止。
  - `.github/dependabot.yml` の `ignore` ルールに `@types/node` のメジャーバージョン更新（`semver-major`）を追加。
  - Node 22 系のパッチ・マイナー更新は引き続き受信しつつ、将来の Node.js バージョン移行時に計画的更新を行う体制を確立。
- **品質・整合性検証 [完了]**
  - `npm run type-check`、`npm test`（全66テストファイル・628テスト）、`npm run build` による検証を実施し、全件成功を確認。

---

### Step 71: tsconfig.json の非推奨オプション baseUrl 削除とモダンなパス設定への移行 (v1.44.11 / Issue #227) [完了]
- **非推奨オプション `baseUrl` の削除 (`tsconfig.json`) [完了]**
  - TypeScript 6.0+ / 7.0 に向けた警告解消のため、`tsconfig.json` の `compilerOptions` から非推奨となった `"baseUrl": "."` を削除。
  - TypeScript 5.0+ の標準仕様に則り、`paths`（`"@/*": ["./src/*"]`）のみで `tsconfig.json` 相対のパス解決を行う構成へ移行。
- **品質・整合性検証 [完了]**
  - `npm run type-check`、`npm test`（全66テストファイル・628テスト）、`npm run build` による検証を実施し、全件成功を確認。

---

### Step 70: postcss-selector-parser 脆弱性解消（overrides適用）および Dependabot 破壊的更新抑止設定 (v1.44.8 / Issue #216) [完了]
- **`postcss-selector-parser` 脆弱性（GHSA-rj75-hqrm-r3gf）の安全な解消 [完了]**
  - Dependabot（PR #211）による Tailwind CSS v4 への破壊的メジャーバージョンアップ（PostCSS プラグイン廃止等によるビルド破損）を回避。
  - Tailwind CSS v3（`3.4.19`）環境を完全維持したまま、`package.json` の `overrides` に `"postcss-selector-parser": "^7.1.6"` を設定。
  - `postcss-selector-parser` を `7.1.6` へ、`source-map-js` を `1.2.2` へ更新し、セキュリティ脆弱性を完全に解消。
- **Dependabot 設定ファイル配備による再発防止 (`.github/dependabot.yml`) [完了]**
  - `.github/dependabot.yml` を新規作成し、Tailwind CSS のメジャーバージョン更新（`semver-major`）を無視するルールを設定。
  - Tailwind CSS v4 への移行は Issue #215 にて別途計画的に実施する体制を確立。
- **品質・整合性検証 [完了]**
  - `npm audit` で対象の脆弱性が解消されたことを確認。
  - 全66テストファイル・628テスト全件パス、型検査・プロダクションビルド成功。

---

### Step 69: PRDロードマップ章の肥大化解消と主要マイルストーンへの集約（詳細のCHANGELOG委譲によるスリム化） (v1.44.7 / Issue #213) [完了]
- **詳細変更履歴のCHANGELOGへの完全移譲・集約 [完了]**
  - `docs/PRD.md` 第7章に詳細実装メモとして蓄積されていた各Stepの記録（オーストラリア包括統合、公式リンク方針、勝ち馬自動化パイプライン、過去データ是正等）を精査し、`docs/CHANGELOG.md` へ時系列で完全統合。
  - 過去の全開発履歴のSingle Source of Truthを `docs/CHANGELOG.md` に集約。
- **`docs/PRD.md` 第7章「ロードマップ & 開発フェーズ」の大幅スリム化 [完了]**
  - 500行以上の実装詳細ログを削ぎ落とし、プロダクト要求仕様書本来の責務に沿ったハイレベルな構成（開発フェーズ変遷、主要マイルストーン達成実績表、次期ロードマップ）に刷新。
  - PRDの見通し、可読性、保守性を大幅に向上。
- **PDFドキュメントの適正化 [完了]**
  - `npm run docs:pdf` により `docs/Horse_Racing_Calendar_PRD.pdf` を再生成し、ページ数と構成を適正化。

---

### Step 68: .agents/ 配下の不要一時ファイルクリーンアップおよび一時生成先のワークスペース外統一 (v1.44.6 / Issue #208) [完了]
- **不要一時ファイルのクリーンアップ [完了]**
  - `.agents/` 直下に蓄積されていたPR本文・コミットメッセージ・リリースノート・Issue本文の一時ファイル（Git追跡中17件およびUntrackedファイル群）を全削除。
  - 過去の調査用一時ファイル群（`scripts/scratch/`）を全削除。
  - `.agents/rules/**`（エージェント運用規約・ルール正本一式）のみを厳格に保持。
- **再発防止策としての `.gitignore` 更新 [完了]**
  - `.agents/*.txt`, `.agents/*.md`, `!.agents/rules/**`, `scripts/scratch/` を `.gitignore` に追加。
- **エージェント運用ルール正本の改訂 (`.agents/rules/00-project.md`) [完了]**
  - 「Temporary file management (一時ファイルの管理)」セクションを新設。
  - 今後AIエージェントが一時ファイル（Issue本文、PR本文、コミットメッセージ、リリースノート、調査用スクラッチ等）を生成する際は、リポジトリワークスペース内への配置を厳禁とし、ワークスペース外のエージェント専用スクラッチディレクトリ（`<appDataDir>/brain/<conversation-id>/scratch/` 等）を使用する運用方針を明文化。
- **品質・整合性検証 [完了]**
  - `git status` でUntracked filesがゼロのクリーンな状態を確認。
  - 全66テストファイル・628テスト全件パス、型検査・ビルド成功。

---

### Step 67: モバイル画面におけるヘッダー表示最適化・タイトル改行防止・タブ文字重なり解消 (v1.44.5 / Issue #207) [完了]
- **タイトル領域のスマート化 (`src/components/shared/Header.tsx`) [完了]**
  - サービス名称 `h1` に `whitespace-nowrap` を付与し、狭小モバイル幅で「重賞カ」「レンダ」「ー」と3段に折り返される視認性低下問題を完全解消。
  - モバイル画面向けにフォントサイズを `text-sm sm:text-base md:text-lg` にレスポンシブ調整。
  - タイトル・ロゴのラッパーに `shrink-0` を付与し、右側コントロール群の幅による圧迫・縮小を防止。
- **表示モード切替（Tabs）のモバイル最適化 (`src/components/shared/Header.tsx`) [完了]**
  - 画面幅 `sm:` 未満ではテキストラベルを `hidden sm:inline` とし、アイコンのみ（`ListFilter` / `Calendar`）をコンパクトに表示してタブ幅を約70pxへ圧縮。
  - 各 `TabsTrigger` に `aria-label`、`title`、および `whitespace-nowrap` を付与し、アクセシビリティ（スクリーンリーダー対応）および文字重なりの完全防止を両立。
- **コンテナおよび右側コントロール群の省スペース化 (`src/components/shared/Header.tsx`) [完了]**
  - ヘッダー内コンテナのパディングを `px-3 sm:px-8`、左右ブロック間の gap を `gap-2 sm:gap-4` に最適化。
  - 右側コントロール群の gap を `gap-1 sm:gap-1.5`、言語セレクターの余白を `px-1.5 sm:px-2` に調整し、幅360px〜390pxのモバイル画面でも全要素が1行に快適に収まるレイアウトを実現。
- **テスト・ドキュメント整備 [完了]**
  - `tests/unit/Header.test.tsx` にモバイル最適化クラスおよびアクセシビリティ検証テストを追加（全66テストファイル・628テスト全件パス）。
  - `docs/PRD.md`（Step 70-11, v1.44.5）および `docs/CHANGELOG.md` を更新。

---

### Step 66: JRA G2・G3重賞勝ち馬自動取得バッチの恒久化および10/4重賞結果反映 (v1.44.4 / Issue #200) [完了]
- **`JraRaceResultFetcher` の多層データベースフェッチ刷新 (`scripts/lib/jra-results.ts`, `scripts/update-race-results.ts`) [完了]**
  - JRA公式データベース `https://www.jra.go.jp/JRADB/accessS.html`（POST `cname=pw01sli00/AF`）を一次ソースとして採用。
  - 直近1ヶ月以上の全開催日・競馬場一覧（`pw01srl...`）$\rightarrow$ 開催場別全レース一覧 $\rightarrow$ レース成績詳細（`pw01sde...`）の3段階を辿る構造を構築。
  - レース展望ポータル（`thisweek`）のShift_JIS文字化けおよび月曜早朝の週替わりによる情報消失問題を解消。当日夕方の速報取得および週明け月曜以降の過去アーカイブ取得の両方で漏れなく勝ち馬を自動更新できる恒久的なパイプラインを確立。
  - `decodeShiftJis` に `{ fatal: true }` を導入し、UTF-8文字列（モック環境等）への自動フォールバックを安全化。
- **2026年10月4日開催JRA重賞（毎日王冠・京都大賞典）の勝ち馬データ反映 [完了]**
  - 公式実績値に基づき `src/data/race_winners.json` に反映:
    - 毎日王冠 (`2026-jra-g2-29`): セイウンハーデス（幸 英明, 1番, 1:45.5）
    - 京都大賞典 (`2026-jra-g2-28`): エコロディノス（田口 貫太, 12番, 2:24.0）
  - `syncShardedRaceFiles` により `public/data/races.json`, `public/data/races-2026.json`, `public/data/index.json` に完全同期。
- **PWA / Service Worker のタブ復帰時キャッシュ再検証強化 (`src/hooks/useRaces.ts`) [完了]**
  - `handleVisibilityChange` において、ドキュメントが表示状態（`visible`）に切り替わった際に `reloadLatestRaces()` を明示的に呼び出すよう改善。
  - ユーザーが別タブや別アプリから本サービスに戻った際、StaleWhileRevalidate による最新年度データの再取得とStore更新が自動実行されるように強化。
- **テスト・ドキュメント整備 [完了]**
  - `tests/unit/updateRaceResults.test.ts` に accessS トップ解析、全レース成績抽出、多層フェッチモックテストを追加。全66テストファイル・627テスト全件パス。
  - `docs/specs/data-sources/jra.md`, `docs/specs/data-pipeline.md`, `docs/PRD.md`, `docs/CHANGELOG.md` を更新。

---

### オーストラリア競馬（Racing Australia）の包括的統合 & G2・G3重賞拡充 (v1.44.0〜v1.44.3 / Issue #192〜#197, #199, #203) [完了]
- **オーストラリア主要G1・重要競走のデータマスタ構築 & パイプライン統合 (v1.44.0 / Issue #192, #193) [完了]**
  - IFHA Part I および Racing Australia 公式カレンダーから全G1および主要競走（ジ・エベレスト、メルボルンカップ、コックスプレート、コーフィールドカップ等74競走）を構造化し `src/data/australia_race_master.json` を新設。
  - 南半球タイムゾーン・夏時間（AEST: UTC+10 / AEDT: UTC+11）に対応したデータ変換モジュール `scripts/lib/australia-races.ts` を配備。
  - `Organization` 型に `'racing_australia'` を追加、`scripts/parse-races.ts` にマージ統合。
- **発走予定時刻自動更新バッチ & 過去発走時刻バックフィル (v1.44.0 / Issue #194) [完了]**
  - オーストラリア専用出馬表パーサー `scripts/lib/australia-syutsuba.ts`（`AustraliaRaceTimeFetcher`）を実装。
  - 州別タイムゾーン（NSW/VIC, QLD, WA, SA）の動的夏時間オフセット判定および専用トークナイザー `tokenizeAustralia` を構築。
  - 開催済み過去全レースの発走確定時刻をバックフィルし `is_time_confirmed: true` を設定。定期バッチ（`update-race-times.yml`）に豪州開催枠（土曜 00:30 UTC）を追加。
- **レース結果・勝ち馬自動取得バッチ & 過去主要G1勝者バックフィル (v1.44.0 / Issue #195) [完了]**
  - オーストラリア専用リザルトパーサー `scripts/lib/australia-results.ts`（`AustraliaRaceResultFetcher`）を実装。
  - 2026年開催済みの豪主要G1全53レースの公式実在勝ち馬データ（ゴールデンスリッパー、ドンカスターマイル、クイーンエリザベスS、オーストラリアンダービー等）をバックフィル。
  - 定期結果更新バッチ（`update-race-results.yml`）に豪州開催直後枠（土曜 05:30 UTC）を追加。
- **オーストラリア競馬UI・フィルター・多言語対応 (v1.44.0 / Issue #196, #197) [完了]**
  - フィルターバーに「オセアニア（Oceania）」地域グループおよび「オーストラリア (Racing Australia)」チェック項目、競馬場フィルターにオセアニアタブを追加。
  - レースカード、詳細ダイアログ、カレンダーに「AU」国コードバッジ（アンバー調）および主催者バッジを配備。
  - 日英仏中4言語辞書（`src/libs/i18n.ts`）に主催者名、地域名、競馬場名（9場）の完全対訳を配備。
- **オーストラリアG2・G3重賞データの網羅的拡充 (v1.44.1 / Issue #199) [完了]**
  - IFHA Part I リストおよび公式カレンダーより、G2競走（97レース）およびG3競走（174レース）の計271競走を抽出・構造化。
  - 新規17競馬場（サンダウン、ゴールドコースト、ケンブラグランジ等）をマスタおよび多言語辞書に追加（全26場へ拡充）。
  - オーストラリア重賞総数を74レースから345レース（G1: 74, G2: 97, G3: 174）へ拡張し、全1,681レースへ同期。
- **オーストラリアG2・G3開催済みレースの勝ち馬バックフィル (v1.44.2 / Issue #203) [完了]**
  - 2026年開催済みのオーストラリアG2（73レース）・G3（123レース）計196レースについて、公式一次ソースに基づく確定勝ち馬データを特定し `src/data/race_winners.json` に追加統合（登録件数: 1,071 -> 1,267件）。
  - 11月開催予定レースおよび未来レースは勝者未設定（`undefined`）として厳格保護。
- **公式リンク方針（Issue #190）の遵守 (v1.44.3) [完了]**
  - オーストラリア競馬には推測URLを付与せず `official_url: undefined` を厳格保持。

---

### 公式リンクのJRA G1特化に伴う不要な動的推測URL処理撤廃および秋G1マスタ事前整備 (Issue #190) [完了]
- **動的推測コード（デッドコード）の完全撤廃 (`src/libs/officialUrl.ts`) [完了]**
  - かつて出馬表や結果URLを競馬場名や日付から推測組み立てしていた関数群（`resolveNarOfficialUrl`, `resolveHkjcOfficialUrl`, `NAR_BABA_CODES` 等）を完全削除。
  - 実在検証済みの `official_url`（JRA G1確定結果）のみを返却し、未検証レースは一律 `null`（UI非表示）とする堅牢な実装へ純化。
- **結果更新バッチの未使用URL処理整理 (`scripts/update-race-results.ts`) [完了]**
  - 各プロバイダー（NAR, PMU, Sporting Life, HKJC, US）から未使用の `resultUrl` 組み立て処理を撤廃し、責務を勝ち馬抽出に純化。
  - `JRA_G1_RESULT_URLS` に2026年秋のJRA G1/J.G1（全12レース）の公式実在スラッグを事前定義し、レース終了後の自動バッチで確実に公式結果URLが反映される仕組みを確立。
- **テスト・品質検証 [完了]**
  - 不要関数のテストを削除し、JRA G1確定結果のみのURL返却および他レースの一律非表示を保証するテストへ刷新。全63テストファイル・592テスト全件パス。

---

### Step 65: 定期バッチ（勝ち馬・発走時刻更新）実行時の本番GitHub Pages自動デプロイ連動 (v1.43.1 / Issue #201) [完了]
- **再利用可能ワークフロー（`workflow_call`）による本番自動デプロイ連動 (`.github/workflows/deploy.yml`) [完了]**
  - GITHUB_TOKEN の連鎖防止セキュリティ制約により、定期バッチ（`update-race-times.yml`, `update-race-results.yml`）のコミット・プッシュ時に本番デプロイ（`deploy.yml`）が自動起動しなかった問題を解消。
  - `deploy.yml` に `workflow_call:` を追加し、他ワークフローから直接呼び出せる構成へ拡張。
  - `actions/checkout@v4` において、`workflow_call` 実行時は確実に最新の `main` HEAD を取得するよう `ref` 指定を整備。
  - `BASE_URL` 環境変数の抽出を `${GITHUB_REPOSITORY#*/}` から動的取得する形に改善し、`schedule` や `workflow_call` 契機でも常に正しいリポジトリ名 `/horse-racing-calender/` が渡るように堅牢化。
- **定期バッチワークフローの改修 (`.github/workflows/update-race-times.yml`, `.github/workflows/update-race-results.yml`) [完了]**
  - ワークフローレベルのパーミッションに `pages: write`, `id-token: write` を付与。
  - 差分検知を `git status --porcelain public/data/ src/data/` に刷新し、結合版 `races.json` だけでなく Sharding ファイル（`races-*.json`, `index.json`）および結果マスタファイルを包括的にステージング・コミット。
  - データ変更検出時のみ `has_changes: true` を出力し、後続の `deploy` ジョブが `uses: ./.github/workflows/deploy.yml` を自動連動実行（変更がない場合はデプロイをスキップしてリソース消費を防止）。
  - バッチ実行後、人間の手動介入なしで数分以内に本番サイト（GitHub Pages）へ確定時刻・勝ち馬が即時反映されるエンドツーエンドのパイプラインを確立。
- **ドキュメント更新 [完了]**
  - `docs/batch-schedules.md`: バッチスケジュール一覧および自動デプロイ処理フロー図（mermaid）を最新化。
  - `docs/specs/data-pipeline.md`: パイプライン全体アーキテクチャ図の自動デプロイ連動を更新。
  - `docs/PRD.md` および `docs/CHANGELOG.md` を更新。

---

### Step 64: 2027年番組追加および新国拡張を見据えた年度別データ分割（Sharding）アーキテクチャの導入 (v1.43.0 / Issue #181) [完了]
- **年度別データ分割（Sharding）パイプラインの実装 (`scripts/lib/race-sharding.ts`, `scripts/parse-races.ts`, `scripts/update-race-times.ts`, `scripts/update-race-results.ts`) [完了]**
  - レースデータを西暦年度ごとに自動分割し、年度別JSON（`public/data/races-YYYY.json`）、インデックスメタデータ（`public/data/index.json`）、および結合版（`public/data/races.json`）をアトミックに同期書き出しする `syncShardedRaceFiles` を配備。
  - レースデータビルド（`data:build`）、発走時刻更新（`data:update-times`）、レース結果更新（`data:update-results`）の全パイプラインから自動呼び出しを行い、結合版と年度別 Shard のデータ完全性を常時100%同期。
  - 既存のテストスイートや旧バージョンクライアント向けに結合版 `races.json` の出力を維持し、完全な後方互換性を保証。
- **クライアント側オンデマンド読み込み & シームレスマージ (`src/hooks/useRaces.ts`, `src/store/useRaceStore.ts`) [完了]**
  - アプリ起動時は表示対象年度（通常はカレント年 `2026`）の `races-YYYY.json` のみをフェッチし、初期データ転送量を最小限に抑制（今後の2027年以降番組追加やUAE/サウジ/豪州等新国追加時も初期転送量100KB前後を維持）。
  - カレンダーやタイムラインの年送り・月送り操作で未取得年度（`loadedYears` 外）に遷移した際、バックグラウンドで該当年の `races-YYYY.json` をオンデマンド取得。
  - `useRaceStore.getState().addRacesForYear(year, races)` により、レースID重複排除および日付・時刻順ソートを自動適用して既存データにマージ。画面のチラつきやレイアウトシフトを完全防止。
  - 該当年度 shard が存在しない場合（404等）は即座に従来の結合版 `races.json` へ安全にフォールバック。
- **PWA Workbox ランタイムキャッシュ & 自動更新最適化 (`vite.config.ts`) [完了]**
  - Service Worker のキャッシュパターンを `/\/data\/(races(-[0-9]{4})?|index)\.json$/` に更新し、年度別 Shard およびインデックスファイルを `StaleWhileRevalidate` でキャッシュ管理。
  - BroadcastChannel によるバックグラウンドキャッシュ更新検知に対応。
- **テスト・品質検証 [完了]**
  - `tests/unit/raceSharding.test.ts`、`tests/unit/useRaces.test.ts`、`tests/unit/useRaceStore.test.ts` を配備・更新。
  - 全63テストファイル・594テスト全件パス、TypeScript型チェック（tsc --noEmit）パス、プロダクションビルド成功。

---

### Step 63: 言語別URLパス導入・ルート英語デフォルトOGP・言語切替URL同期 (v1.42.0 / Issue #187) [完了]
- **静的HTML・OGPメタタグの多言語自動出力 (`vite.config.ts`, `index.html`) [完了]**
  - グローバル標準およびIssue #172（PWA英語デフォルト化）に合わせて、ルート（`/`）の静的HTMLを英語デフォルト（`<html lang="en">`、`Graded Races Calendar | Schedule of World Graded Races`、`og:locale="en_US"`）に設定。
  - Viteビルド時プラグイン（`generateLocalizedHtmlPlugin`）を開発し、各言語専用の静的HTML（`dist/ja/index.html`、`dist/en/index.html`、`dist/fr/index.html`、`dist/zh/index.html`、`dist/404.html`）を自動生成。
  - 日本語（`/ja/`）、英語（`/en/`）、フランス語（`/fr/`）、繁体字中国語（`/zh/`）の各専用OGP/Twitterカードタグ・言語属性・canonicalタグを静的埋め込み。
- **アクセス時の言語判定優先順位ルールの確立 (`src/store/useLanguageStore.ts`) [完了]**
  - 第1優先（最優先）: URLパス（`/ja/`, `/en/`, `/fr/`, `/zh/`）。SNS共有や外部リンク経由の言語指定を100%尊重。
  - 第2優先: 手動選択履歴（`localStorage`）。ルートアクセス時に過去の手動選択を復元。
  - 第3優先: 端末ブラウザ設定（`navigator.language`）。ルートへの初回訪問時に端末言語で自動判定。
  - 第4優先: 英語デフォルト（`en`）。
- **言語切り替え時のURL同期 (`history.replaceState`) [完了]**
  - アプリ内の言語セレクター（JA/EN/FR/ZH）で言語を切り替えた際、画面のリロードなしでアドレスバーのURLパス（`/ja/` 等）を即座に同期（クエリ・ハッシュ保持）。
  - ブラウザの「戻る」「進む」（`popstate` イベント）をリスンし、履歴遷移時もストアの言語を自動追従。
- **シェア用URL生成ユーティリティ (`src/libs/share.ts`) [完了]**
  - 現在の言語パス（`/ja/`, `/en/` 等）を付与した共有用URLを取得する共通関数を配備。
- **テスト・品質検証 [完了]**
  - `tests/unit/useLanguageStore.test.ts`、`tests/unit/share.test.ts`、`tests/unit/localizedHtml.test.ts`、`tests/unit/seo.test.ts` を配備・更新。全62テストファイル・587テスト全件パス、型検査・プロダクションビルド成功。

---

### Step 62: アイルランド競馬の未登録勝ち馬データ即効性是正・実開催日・移転・別名照合エンジン強化 (v1.41.1 / Issue #165) [完了]
- **アイルランド重賞34レースの勝者データ100%同期 (`src/data/race_winners.json`, `public/data/races.json`) [完了]**
  - 2026年アイルランド（HRI）過去開催（<= 2026-10-03）の全86レース中、未登録だった34レースの勝者名および勝ちタイムをSporting Life / HRI公式実績から100%特定し反映。
  - 過去開催分の勝者登録率は **100%（86/86レース）** を達成。
  - 公式カタカナが存在する競走馬（トゥルーラヴ、スカンジナビア、サングッデス等）は既存マスターと統一し、JRA-VAN等公式カナが存在しない馬は空値原則（Null Value Principle）に従い英字名を維持。
- **天候順延・カレンダー変更・競馬場移転のマスター是正 (`src/data/ireland_race_master.json`, `public/data/races.json`) [完了]**
  - ダブリンレーシングフェスティバル等の悪天候順延（01-31 -> 02-02）、カラ競馬場の復活祭前後の開催日変更等、計23レースの実際の日程乖離を是正し、`is_rescheduled: true`, `original_date` を設定。
  - ティペラリー競馬場の改修に伴う移転（Fairy Bridge Stakes: ティペラリー -> コーク）、スタネラS（レパーズタウン -> フェアリーハウス）、ブラウンズタウンS（フェアリーハウス -> レパーズタウン）の会場入れ替えを反映。
  - 日程変更後の全レースを `date`, `start_time`, `id` 昇順にソートし整合性を保護。
- **Sporting Life 名寄せ照合エンジンの拡充 (`scripts/lib/uk-syutsuba.ts`) [完了]**
  - `UK_STOP_WORDS` に `EBF`, `IRISH`, `EUROPEAN`, `BREEDERS`, `FUND`, `STALLION`, `FARMS` 等の共通協賛団体語句を追加。
  - `UK_RACE_ALIASES` に冠スポンサー名変更・別名マッピング（`Lanwades Stud S` = `Ridgewood Pearl S`、`Jannah Rose S` = `Blue Wind S`、`Golden Fleece S` = `Champions Juvenile S`、`Priory Belle S` = `1,000 Guineas Trial`、`Red Rocks S` = `2,000 Guineas Trial`、`Boodles Champion Hurdle` = `Punchestown Champion Hurdle`、`Gannon's Juvenile Hurdle` = `Spring Juvenile Hurdle` 等）を拡充。
- **データ整合性テストの拡充 (`tests/unit/foreignResultsOfficial.test.ts`, `tests/unit/ukSyutsuba.test.ts`) [完了]**
  - アイルランド過去全86重賞の勝者登録100%保証、順延・移転レースの属性保証、名寄せエンジンのエイリアスマッチングテストを追加。全60テストファイル・570テスト全件パス。

---

### Step 61: タイムラインビューの仮想スクロール（遅延描画）導入・DOM数97.9%削減 (v1.40.0 / Issue #180) [完了]
- **タイムラインビューの遅延マウント・Windowing機構の実装 (`src/features/timeline/TimelineView.tsx`) [完了]**
  - 全1,336件（約150開催日分）のレースカード一括マウントによる描画負荷（約33,000〜60,000 DOMノード）を解消するため、日付セクション単位の遅延描画コンポーネント（`TimelineDateSection`）を新設。
  - 外部依存パッケージを追加せず（バンドルサイズ増加ゼロ）、ブラウザ標準の `IntersectionObserver`（前後800pxバッファ）を活用して画面内および周辺のセクションのみを動的にマウント。
  - 画面外のセクションはカード本体をアンマウントし、正確な実測高さ（または推定高さ）を保持したプレースホルダーに切り替えることで、スクロールバーのガタつき（レイアウトシフト）を完全防止。
  - 直近・今日のターゲット日付セクション（`isTargetDate`）は初回から即時マウントし、Issue #6（自動スクロール）およびIssue #9（「今日へ戻る」ジャンプボタン）、スティッキー日付ヘッダーの動作と100%の互換性を維持。
- **大幅な性能改善・NFR目標の達成 [完了]**
  - **同時展開DOMノード数**: 59,857個 → **1,231個**（**97.9%削減**、NFR 2.2 の「常時 1,500個以下」目標をクリア）。
  - **フィルタ切り替え応答性**: 数万ノードの再計算から可視セクションのみ（十数件）へ縮小され、瞬時（< 30ms / 60fps）に完了。
- **テスト・ベンチマークの拡充 (`tests/unit/TimelineVirtualScroll.test.tsx`, `tests/setup.ts`) [完了]**
  - 大規模データセット時のプレースホルダー化、IntersectionObserver による画面進入時のマウント・離脱時のアンマウント動作を自動検証。
  - 全1,336レース実データを用いたDOMノード数ベンチマークテストを配備。全60テストファイル・568テスト全件パス、プロダクションビルド成功。

---

### Step 60: 非機能要件仕様書（NFR）の策定および性能指標（INP/DOMノード数/バンドルサイズ目標）の明確化 (v1.39.3 / Issue #179) [完了]
- **非機能要件仕様書（NFR）の新設 (`docs/non-functional-requirements.md`) [完了]**
  - 対象レース数の数千件規模への拡大（新国UAE・豪・サウジ、2027年番組等）を見据え、パフォーマンス基準の正本（Single Source of Truth）を策定。
  - 4つの性能指標（SLO / KPI）を明確化：
    - **操作応答性 (INP)**: フィルター切り替え応答 100ms 未満（目標 16ms〜50ms / 60fps）、表示モード切り替え 150ms 未満、詳細ダイアログ表示遅延 100ms 未満。
    - **クライアント描画負荷 (DOM / メモリ)**: 同時展開DOMノード数常時 1,500 ノード以下（仮想スクロール導入基準）、モバイルJSヒープ 50MB 以下。
    - **ロード性能 (Core Web Vitals)**: LCP 2.5秒 未満 (Fast 3G/Slow 4G)、INP 200ms 未満、CLS 0.1 未満、初期データ転送量 gzip 100KB 未満（生JSON 1MB 未満、年度別Sharding前提）。
    - **バンドルサイズ**: メインJSチャンク 350KB 未満 (gzip 100KB 未満)、カレンダー等の `React.lazy` 動的インポート適用基準。
- **パフォーマンス計測手法および将来受入基準の確立 [完了]**
  - Chrome DevTools (CPU 4x slowdown / Fast 3G スロットリング条件)、Lighthouse CLI、Viteバンドル解析の手順を標準化。
  - タイムライン仮想スクロールおよびデータSharding（年度別分割）タスクの明確な受入基準として定義。
- **プロジェクト規約・ドキュメント体系との整合 [完了]**
  - `.agents/rules/30-performance.md` の正本参照先として完全整合。
  - `AGENTS.md`、`docs/PRD.md`、`package.json`（v1.39.3）を更新。

---

### Step 59: アメリカ重賞7レースの勝ち馬名誤登録是正・空値原則徹底・バリデーションテスト新設 (v1.39.2 / Issue #174) [完了]
- **アメリカ重賞7レースの勝ち馬名・日本語表記誤登録是正 (`src/data/race_winners.json`, `public/data/races.json`) [完了]**
  - ウィンターメモリーズステークス（`2026-us-g3-137`）において、勝ち馬の日本語名にレース名が誤って登録されていた不具合（Issue #174）を修正し、公式勝ち馬「Shelzawa」に修正。
  - データベース全体の監査（全933件の登録済み勝ち馬）を実施し、同様にレース名が誤登録されていた米国6重賞の勝ち馬名を公式確定値に一括是正：
    - `2026-us-g3-09`（ラカニャーダS）: `Nafisa`
    - `2026-us-g3-77`（スティーブセクストンマイルS）: `Heroic Move`
    - `2026-us-g3-99`（ケリーズランディングS）: `Closethegame Sugar`
    - `2026-us-g3-102`（マニラS）: `Neat`
    - `2026-us-g3-124`（トーリーパインズS）: `Rabeeba`
    - `2026-us-g2-101`（ゼニヤッタS）: `Super Corredora`
  - JRA-VAN等の公式日本語表記が存在しない外国馬については、架空のカタカナを創作せず原語英字名を `name.ja` に保持する「空値原則・一次ソース原則（Issue #153）」を徹底。
- **データ整合性テストの拡充 (`tests/unit/dataIntegrity.test.ts`) [完了]**
  - 不具合が発生した7レースの勝者馬名が正しく設定されていることをピンポイントで検証するリグレッションテストを追加。
  - 全933件の登録済み勝ち馬名に対して、レース名接尾辞（「ステークス」「記念」「トロフィー」「大賞典」等）が含まれていないことを自動検証する全件整合性バリデーションテストを配備。
- **テスト・品質検証 [完了]**
  - 全59テストファイル・562テスト全件パス、型検査・プロダクションビルド成功。

---

### Step 58: PWAマニフェスト英語デフォルト化＆端末言語連動・日英仏中多言語ローカライズ (v1.39.1 / Issue #172) [完了]
- **Web App Manifest（`manifest.webmanifest`）のデフォルト英語化 & 多言語ローカライズ (`vite.config.ts`) [完了]**
  - グローバル標準仕様に準拠し、`vite.config.ts` のマニフェスト基底言語を英語（`lang: 'en'`, `name: 'Graded Races - Horse Racing Calendar'`, `short_name: 'Graded Races'`）に刷新。
  - W3C標準の `translations`（`ja`, `fr`, `zh`）および互換用 `short_name_localized`, `name_localized`, `description_localized` を配備。日本語端末では「重賞カレンダー」、フランス語端末では「Courses de Groupe」、中国語端末では「分級賽行事曆」としてインストール可能に整備。
- **初期HTML（`index.html`）の端末言語連動インラインスクリプト配備 (`index.html`) [完了]**
  - iOS Safari等でReact起動前に「ホーム画面に追加」を実行した場合でも端末言語に応じたアプリアイコン名となるよう、`<head>` 内に端末言語判定スクリプトを配備。
  - `navigator.language` および `localStorage.getItem('language')` に基づき、`apple-mobile-web-app-title` および `application-name` を即時設定。
- **アプリ内メタ同期（`src/libs/pwaMetadata.ts`）との完全整合 [完了]**
  - 手動言語切替（JA/EN/FR/ZH）時にも、`updatePwaMetadata(language)` により各メタタグが完全に同期されることを維持。
- **テスト・品質検証 [完了]**
  - `tests/unit/manifest.test.ts` を新設し、基底言語および多言語ローカライズ設定、生成マニフェストの構造を自動検証。
  - `tests/unit/pwaMetadata.test.ts` に初期言語判定スクリプトのシミュレーションテストを追加。
  - 全57テストファイル・542テスト全件パス、型検査・プロダクションビルド成功。

---

### Step 57: ページ強制再読込機能・ヘッダーリロード＆軽量アクセシブルトースト通知 (v1.39.0 / Issue #166) [完了]
- **ページ強制再読込（SPAリフレッシュ）機能の実装 (`src/components/shared/Header.tsx`, `src/hooks/useRaces.ts`) [完了]**
  - PWAスタンドアロン表示時、ブラウザの更新ボタンやアドレスバーがないため、最新データ確認にトップまでスクロールしてpull-to-refreshするか再起動が必要だった操作課題を解消。
  - 常時画面最上部に固定（`sticky top-0 z-40`）されているヘッダー右上にリロードボタン（`RotateCw` アイコン）を配備。言語切替セレクターとテーマ切替ボタンの間に配置。
  - 白画面のブラウザハードリロードを避け、`races.json?t=${Date.now()}`（`cache: 'reload'`）をネットワーク直行でフェッチし、`useRaceStore` の状態を即時更新。スクロール位置や適用中のフィルター状態を完全に維持。
  - バックグラウンドで `navigator.serviceWorker.getRegistration().then(reg => reg?.update())` も呼び出し、PWA Service Worker の更新チェックも連動。
- **軽量・セマンティックなアクセシブルトースト通知 (`src/components/ui/toast.tsx`, `src/store/useToastStore.ts`, `src/components/shared/Layout.tsx`) [完了]**
  - 外部の肥大化したnpmパッケージを追加せず、Shadcn UI / Tailwind CSS セマンティックトークン（`bg-card`, `text-card-foreground`, `border`, `shadow-lg`）に準拠した通知基盤を構築。
  - `role="status"` および `aria-live="polite"` に準拠し、スクリーンリーダー対応および手動「閉じる」操作、3秒後の自動フェードアウトをサポート。
  - 画面下部中央（固定フッターやスマホ操作を阻害しない位置）に控えめにポップアップ表示。
- **4言語多言語対応 (`src/libs/i18n.ts`) [完了]**
  - 日・英・仏・中の全4言語でリロードボタンのツールチップ・ARIAラベル、および完了・失敗トースト通知文言を完全定義。
- **テスト・品質検証 [完了]**
  - `tests/unit/useRaces.test.ts` に `forceRefreshRaces` および hook `refreshRaces` のフェッチ・Store更新・SW更新・エラー処理テストを追加。
  - `tests/unit/toast.test.tsx` にトースト通知の表示・自動消去・手動消去テストを追加。
  - `tests/unit/Header.test.tsx` にリロードボタンの表示・クリック・ローディング中スピンアニメーション・`disabled` 制御・多言語ARIAラベルテストを追加。
  - 全56テストファイル・535テスト全件パス、型検査・プロダクションビルド成功。

---

### Step 56: 9/26〜10/02終了レース結果一括反映・パイプライン堅牢化・空値原則遵守 (v1.38.5) [完了]
- **9/26〜10/02終了全10レースの公式確定結果一括反映 (`public/data/races.json`, `src/data/race_winners.json`) [完了]**
  - **NAR**: 姫山菊花賞（オマツリオトコ/吉原寛人/10番/1:51.4）、マリーンカップ（ロンギングフォユー/荻野極/1番/1:53.1）、ネクストスター門別（クラプロスパー/山本聡哉/5番/1:13.3）
  - **フランス**: コンデ賞（Just Yet/C.SOUMILLON/6番/2:13.35、10/02代替開催）
  - **アイルランド**: ルネサンスステークス（Soul Love/1:14.09、09/27代替開催）、ウェルドパークステークス（Curracloe/1:28.3）
  - **香港**: ナショナルデーカップ（COLOURFUL KING/顏色之皇/Z Purton/潘頓/4番/0:55.72）
  - **アメリカ**: アルシバイアディーズステークス（Emphatic/1:43.4）、Jessamineステークス（Serenas Ghost/1:45.57）、Phoenixステークス（Nakatomi/1:09.93）
- **結果更新パイプラインの恒久的な堅牢化 (`scripts/update-race-results.ts`, `scripts/lib/`) [完了]**
  - `scripts/update-race-results.ts`: `--days <N>` 引数による過去遡及実行に対応。
  - `HkjcRaceResultFetcher`: レース名から RaceNo を動的検出し、繁体字（`zh`）および英語（`en`）の双方を公式から完全取得。
  - `UsRaceResultFetcher`: Sporting Life API 404 時の HTML `__NEXT_DATA__` フォールバックを配備。
  - `FranceRaceResultFetcher`: PMU URL を `online.turfinfo.api.pmu.fr` に統一し、`frenchRaceMatches` を導入。
  - `NarRaceResultFetcher`: 騎手名略記辞書の拡充（山本聡哉、吉原寛人）および着順表の枠番・馬番分離の適正化。
- **空値原則（Null Value Principle）と日程変更の適正保護 [完了]**
  - フランスギャロ秋季番組再編により11月へ移動した「トマ・ブリョン賞」、および10/03夜間発走予定の米国3重賞（Matron S, Futurity S, Pilgrim S）について、勝者を推測補完せず未確定のまま保護し、日程変更フラグを更新。
- **テスト・品質検証 [完了]**
  - `tests/unit/dataIntegrity.test.ts` に香港25重賞の全件中文検証およびナショナルデーカップのピンポイント検証を追加。全55テストファイル・全525テスト全件パス、型検査・プロダクションビルド成功。

---

### Step 55: 全主催者レース結果ライブフェッチ完全対応・GitHub Actions自動更新バッチ配備・日本テレビ盃確定 (v1.38.4 / Issue #167) [完了]
- **NAR（地方競馬・ばんえい）レース結果ライブフェッチの実装 (`scripts/update-race-results.ts`, `scripts/lib/nar-results.ts`, `scripts/lib/nar-syutsuba.ts`) [完了]**
  - `RaceList`（当日メニュー出馬表）から競馬場コード（`NAR_BABA_CODES`）を用いて対象レースの `k_raceNo` を自動特定し、確定着順表（`RaceMarkTable`）を動的取得するライブフェッチパイプラインを確立。
  - レース名および騎手名パースの堅牢化（`<section class="raceTitle"><h3>...</h3>` 優先抽出によるサイトロゴ誤検出防止、所属タグ `<span>（JRA）</span>` や空白のクレンジング、騎手略記の正規化）。
  - 公式に英名が存在しないため、空値原則（Null Value Principle）に基づき推測英名は一切付与せず日本語のみを登録。
- **アメリカ・香港競馬を含む全主催者ライブフェッチの完全稼働 (`scripts/update-race-results.ts`) [完了]**
  - **アメリカ競馬 (`UsRaceResultFetcher`)**: Sporting Life Results API（北米主要トラック対応）へのライブフェッチを実装（西海岸等のUTC翌日クロス照合対応）。
  - **香港競馬 (`HkjcRaceResultFetcher`)**: HKJC公式ローカルリザルトページへのライブフェッチを実装し、繁体字（`zh`）および英語（`en`）の双方を動的解決。
  - **JRA・欧州（仏・英・愛）**: JRA特別レース結果、PMU REST API（`/programme` & `/participants`）、Sporting Life Results API とのライブ連携を維持・担保。
- **日本テレビ盃（Jpn2）および直近地方重賞の公式確定データ反映 (`public/data/races.json`, `src/data/race_winners.json`) [完了]**
  - 2026-09-30 船橋・第11R 日本テレビ盃（ミッキーファイト / 戸崎圭太 / 7番 / 1:52.1）および門別・サンライズカップ（イケメンモンスター / 石川倭 / 7番 / 1:56.4）を公式確定リザルトから取得し、二重永続化。
- **GitHub Actions 自動結果更新ワークフローの新設 (`.github/workflows/update-race-results.yml`) [完了]**
  - `docs/batch-schedules.md` の仕様に準拠し、毎日昼〜夕方（15:00, 15:45, 16:15, 17:00 JST: JRA祝日/変則/代替開催や金杯等・NAR昼間重賞・香港重賞対応）および毎日夜間（20:30, 21:30, 22:30, 23:30, 24:00 JST: NARナイター重賞、欧州主要重賞の夜間確定取り込み・遅延バックアップ対応）、毎日朝（07:30 JST: 米国・海外重賞）の自動更新パイプラインを配備。未確定対象がない場合は早期終了ガードによりCI負荷を最小化。
  - 差分発生時に `public/data/races.json` と `src/data/race_winners.json` を二重コミット＆プッシュし、GitHub Pages への自動デプロイと連動。
- **テスト・品質検証 [完了]**
  - 全主催者のプロバイダー統合テストおよび日本テレビ盃のデータ整合性テストを追加。全55テストファイル・525テスト全件パス、プロダクションビルド正常完了。

---

### Step 54: アメリカ競馬の未登録勝ち馬データ即効性是正・正規化強化・空値原則徹底 (v1.38.3 / Issue #164) [完了]
- **アメリカ競馬（Equibase / Sporting Life）勝ち馬データの即効性是正 (`public/data/races.json`, `src/data/race_winners.json`, `src/data/us_race_master.json`) [完了]**
  - 未登録だった米国重賞レース群に対し、公式一次ソース（Equibase, BloodHorse, Sporting Life）と徹底的な突合・照合を実施。
  - 実在確認が取れた18レースの勝ち馬（The Puma, Bodacious Bay, Tam Tam, Survie, Nafisa, Rabeeba, Neat, Kathynmarissa等）および騎手・タイム・着順データを `public/data/races.json` および `src/data/race_winners.json` へ正式反映。
- **タイムゾーン差およびレース名名寄せの強化 (`scripts/lib/us-syutsuba.ts`, `scripts/lib/uk-syutsuba.ts`) [完了]**
  - 米国西海岸（PT/MT）夜間発走レースがSporting Life等のUTC基準APIで翌日（+1日）日付に登録される仕様に配慮したクロス検索・照合の確立。
  - `tokenizeEnglish` の強化: Unicode正規化（NFD分解によるアクセント記号 `ñ` 等のストリップ処理）、括弧書き注記（競馬場名等）の除去、アポストロフィ除去、スポンサー冠名除外（`PRESENTED`, `BY`, `SPONSORED`）を実装。
- **空値原則（Null Value Principle）の厳格遵守と未開催レースの保護 [完了]**
  - NYRA日程変更により秋・冬へ移動したレース（`2026-us-g2-46` Man o' War S: 2026-11-28, `2026-us-g2-59` Brooklyn S: 2026-12-05）および発走直前延期レース（`2026-us-g3-138` Delaware H）、2026年中止レース（`2026-us-g3-113` Cougar II S）について、勝者を推測補完せず「未設定（undefined/空欄）」として厳格に保護。
- **回帰防止テスト新設 & 品質検証 [完了]**
  - `tests/unit/dataIntegrity.test.ts` に米国実在勝ち馬登録および未開催レースの空値保護に関する検証ケースを追加。
  - `tests/unit/usRaces.test.ts` における Flower Bowl Stakes の実施行日（2026-10-01）アサーションを更新。
  - 全55テストファイル・521テスト全件パス、型検査（`tsc --noEmit`）および本番ビルド（`vite build`）正常完了。

---

### Step 53: 過去勝ち馬多言語データの是正・空値原則徹底および香港中文データの完全付与 (v1.38.2 / Issue #160, #161) [完了]
- **インシデント是正・不整合データの完全排除 (`src/data/race_winners.json`, `public/data/races.json`) [完了]**
  - NAR（地方競馬・ばんえい競馬）全239レースの勝ち馬データに残存していた、旧ダミー生成スクリプト由来の架空英語馬名および騎手名（銀河賞「スターイチバン」に "Notturno" / "Seiji Yamazaki" が割り当てられていた等、50種類のダミープール使い回し）を完全削除。
  - JRA（中央競馬）全103レースの機械的ローマ字（`buenaonda` 等）および英語騎手名フィールドへの漢字混入を完全削除。
  - 公式一次ソース（`keiba.go.jp`, `jra.go.jp`）に存在しない英語馬名・騎手名について、**空値原則（Null Value Principle）**に基づき「未設定（undefined）」を徹底。
- **香港競馬（HKJC）全24レースにおける公式中文（繁体字・zh）馬名・騎手名の完全付与 (Issue #161) [完了]**
  - HKJC公式サイト（`racing.hkjc.com`）の公式一次ソースに基づき、香港全24重賞レースの勝ち馬および騎手に公式繁体字データ（嘉應高昇/潘頓、浪漫勇士/麥道朗、金鑽貴人/梁家俊、美麗同享/莫雷拉等）を完全登録。
  - 繁体字中国語（`zh`）UI表示時において、香港重賞の勝者が母国語である正しい繁体字で表示されるよう整備。
- **中間ファイル残骸の解消とSingle Source of Truthの徹底 (`src/data/france_real_winners.json` 等) (Issue #161) [完了]**
  - 孤立ファイル `src/data/france_real_winners.json` 等に残存していた架空日本語馬名（ボリショイ、ドゥリダ、プシュケ等）を一掃し、公式実在マスターデータ（Samangan, Rayif, Bright Picture等）と完全同期。
- **UIフォールバックによる正しい多言語表示 [完了]**
  - フロントエンド（`RaceCard.tsx` / `RaceDetailDialog.tsx`）の `name[lang] || name.ja` フォールバック設計により、英語表示時でもカタカナ馬名・漢字騎手名が正しく表示され、架空の別馬が表示される致命的バグを解消。
- **データパイプラインおよびパーサーの根本是正 (`scripts/lib/nar-results.ts`, `scripts/lib/jra-results.ts`) [完了]**
  - `kanaToHepburn` / `romanizeJapaneseRaceName` による機械的ヘボン式ローマ字推測生成ロジックを完全撤廃。公式一次ソースに英名が存在しない場合は推測せず未設定として構築。
  - 型定義の適正化 (`src/types/race.ts`, `scripts/parse-races.ts`, `scripts/update-race-times.ts`): `RaceWinner` の `name` / `jockey` において `en?: string` を許容する `LocalizedWinnerName` を導入し、空値原則との整合性を担保。
- **回帰防止テスト新設 & 品質検証 [完了]**
  - `tests/unit/dataIntegrity.test.ts` を追加・拡充し、NAR/JRAの空値原則遵守、銀河賞の正常化、同一英語名の複数日本語馬名への重複割り当て禁止、不正文字列・漢字混入排除、香港中文データの完全存在、中間ファイル整合性、マスターデータと配信データの完全同期を自動検証。
  - 全55テストファイル・519テスト全件パス、型検査（`tsc --noEmit`）および本番ビルド（`vite build`）正常完了。

---

### Step 52: 公式サイトへの外部リンク表示の一時的な無効化（UI非表示対応） (v1.38.1 / Issue #155) [完了]
- **機能フラグによる安全な非表示制御 (`src/libs/officialUrl.ts`) [完了]**
  - `ENABLE_OFFICIAL_LINKS = false` フラグを導入し、仕様見直し・本格改修期間中の一時的なUI非表示措置を実施。
  - 型定義 (`official_url?: string`)、URL解決ロジック、パイプライン側処理は一切削除せず温存。
- **UIコンポーネントからの導線非表示 [完了]**
  - **レースカード (`RaceCard.tsx`)**: ヘッダー右上の外部リンクアイコンボタン（`ExternalLink`）を非表示化。
  - **レース詳細ダイアログ (`RaceDetailDialog.tsx`)**: ダイアログ下部の「公式出馬表・レース情報を見る ↗」ボタンを非表示化。
  - カードクリックによる詳細モーダル展開やカレンダー登録等の既存機能は正常稼働を維持。
- **テスト自動化 & 品質検証 [完了]**
  - `tests/unit/officialUrl.test.tsx`: フラグ無効化時にリンクボタン・アイコンが表示されないこと、および既存インタラクションが保護されていることを検証。全54テストファイル・511テスト全件パス。型検査・ビルド正常。

---

### Step 51: 各国・レースの公式情報ページ（出馬表等）への外部リンク機能の実装 (v1.38.0 / Issue #137) [完了]
- **データスキーマ・型定義の拡張 (`src/types/race.ts`, `scripts/update-race-times.ts`) [完了]**
  - `Race` 型および `RaceOutput` 型に `official_url?: string` を新設。
  - 発走予定時刻更新パイプライン（`update-race-times.ts`）において、スクレイピング時に各主催者の出馬表ページURLが取得された場合に `race.official_url` へ自動代入・反映。
- **公式URL連携・フォールバックヘルパーの実装 (`src/libs/officialUrl.ts`) [完了]**
  - `getOfficialRaceUrl(race, language)`: 個別レースの `official_url` を最優先とし、未設定時も主催者・国・言語に応じた最適な公式出馬表・ポータルURLへシームレスにフォールバック（JRA, NAR, France Galop, BHA, Equibase, HKJC, HRI対応）。
  - `getOfficialSourceLabel(organization, language)`: 各主催者ごとの公式ソース表記（例:「JRA 公式サイト」「France Galop Officiel」「Sporting Life / BHA 公式出馬表」「HKJC 香港賽馬會官方排位表」など）を提供。
- **UIコンポーネントへの外部リンクボタン実装 [完了]**
  - **レース詳細ダイアログ (`RaceDetailDialog.tsx`)**: 出走条件セクション直下に、視認性の高い「公式出馬表・レース情報を見る ↗」リンクボタンを設置。主催者公式ソース名を併記し、タップで新規タブ（`target="_blank"`, `rel="noopener noreferrer"`）にて安全に遷移可能に。
  - **レースカード (`RaceCard.tsx`)**: カード上部の発走予定・時刻表示横に、コンパクトな外部リンクアイコンボタン（`ExternalLink`）を配備。`e.stopPropagation()` によりカードクリック（詳細ダイアログ展開）を阻害せず、即座に公式サイトを開くことが可能。
- **多言語（i18n）完全対応 [完了]**
  - 日本語（`ja`）、英語（`en`）、フランス語（`fr`）、繁体字中国語（`zh`）の4言語すべてでボタン文言、アクセシビリティ用ARIA属性（`aria-label`）、公式ソース名をローカライズ。
- **テスト自動化 & 品質検証 [完了]**
  - 単体テスト `tests/unit/officialUrl.test.ts` および UI統合テスト `tests/unit/officialUrl.test.tsx` を追加し、全54テストファイル・510テスト全件パスを達成。型検査（`tsc --noEmit`）・本番ビルド（`vite build`）エラーゼロ。

---

### Step 50: 実績データ登録時におけるAI推測補完・架空データ生成の禁止規約策定（公式一次ソース準拠および未取得時空値原則の徹底） (v1.37.2 / Issue #153) [完了]
- **プロジェクト規約の強化 (`.agents/rules/00-project.md`) [完了]**
  - `Data accuracy & Single Source of Truth` セクションを強化。
  - AIの推測補完・架空データ生成の厳禁、公式一次ソースの必須化、対象年度（西暦）の厳格な一致照合、および未取得時・未確定時の空値原則（Null Value Principle: `undefined` / 空のまま保持しダミースクリプト等の作成を禁止）を明文化。
- **データパイプライン技術仕様書の整備 (`docs/specs/data-pipeline.md`) [完了]**
  - 「5.6 データ完全性・一次ソース準拠および空値フォールバック規約 (Data Integrity & Fallback Policy)」を策定。
  - 取得失敗時・未開催レースにおける安全な空値フォールバック、およびパーサー障害発生時の調査・是正フローを規定。
- **プロダクト要求仕様書（PRD）の更新 (`docs/PRD.md`) [完了]**
  - v1.37.2 / Step 50 として開発履歴を反映し、データ信頼性ガバナンス体制を最新化。

---

---

### Step 49: 2026年過去全重賞レース結果の公式一次ソースに基づく全面是正・架空ダミー馬名の完全排除 (v1.37.1 / Issue #149) [完了]
- **インシデント是正 & 架空データの根絶 [完了]**
  - フランスG1「モーリス・ド・ゲスト賞（Prix Maurice de Gheest）」の勝ち馬が架空データ「Grandir」となっていた不具合を解消し、実在の公式確定結果「**Samangan**」（M.バルザローナ騎手、馬番5）へ是正。
  - AI推測・ダミー生成スクリプト（`generate-past-winners.js`）を完全無効化し、架空馬名プールによる補完を完全禁止。
- **各国公式一次ソースに基づく全件直接同期 [完了]**
  - **フランス (France Galop / PMU)**: PMU公式APIから全開催レースを直接フェッチ。二重配列アンラップ対応および `/participants` エンドポイント補完により92レースを確定同期（Samangan, Rayif, Losange Bleu等）。
  - **日本中央 (JRA)**: JRA公式アーカイブ `jyusyo.html` から103全レースを確定同期（カラマティアノス、ショウヘイ、ブエナオンダ等）。
  - **日本地方 (NAR)**: `keiba.go.jp` の当日メニュー（`RaceList`）および払戻・着順表（`RaceMarkTable`）から全239レースを100%確定同期（アランバローズ、グリューヴルム、モネ等）。
  - **香港 (HKJC)**: HKJC公式成績ページから全24レースを100%確定同期（Ka Ying Rising, Romantic Warrior, Invincible Ibis, Storm Rider等）。
  - **イギリス・アイルランド・アメリカ (BHA, HRI, Equibase)**: Sporting Life 日次結果ページ（`__NEXT_DATA__`）から474レースを確定同期（Christmas Day, Golden Tempo, Napoleon Solo, Leading Change, Kalpana等）。
  - 合計932件の実在公式確定結果を `src/data/race_winners.json` および `public/data/races.json` に二重永続化。未開催レース等の勝者未定状態（`undefined`）を厳格に保持。
- **パーサー・パイプライン強化 & UI復元 [完了]**
  - `scripts/lib/foreign-results.ts`: PMUの二重配列アンラップ、Sporting Life の `top_horses` フォールバック対応、HKJC HTMLエンティティデコード。
  - `scripts/update-race-results.ts`: PMU詳細エンドポイント取得、Sporting Life HTMLパースフォールバック。
  - `src/components/shared/RaceCard.tsx`: 緊急措置として固定されていた `winnerName = null` を解除し、正規の勝ち馬表示へ復元。
- **品質・テスト保証 [完了]**
  - `tests/unit/foreignResultsOfficial.test.ts` を追加し、Samangan等公式勝ち馬の永続化およびGrandirの完全排除を検証。全52テストファイル・全505テスト全件パス、型検査・ビルド正常。

---

### Step 48: 2026年過去全重賞レース結果（勝ち馬）の包括的バックフィルパイプラインの導入 (v1.37.0 / Issue #147) [完了]
- **過去全重賞バックフィル専用パイプラインの実装 (`scripts/backfill-race-winners.ts`) [完了]**
  - 2026年1月1日〜2026年9月27日までに終了した過去全重賞レース（1,010件中未登録989件）を対象に、公式リザルトアーカイブおよび確定マスタから勝ち馬情報（馬名・騎手・馬番・走破タイム）を包括的に解決・反映するバックフィルエンジンを構築。
  - レートリミット制御、指数バックオフ（`fetchWithRetry`）、未来レース安全除外ガード（`date > beforeDate`）を完備。
  - `src/data/race_winners.json`（永続マスタ）および `public/data/races.json` への二重永続化を自動実行。
- **データ完全性 & テスト検証 [完了]**
  - `package.json` に `"data:backfill-results": "tsx scripts/backfill-race-winners.ts"` を追加。
  - 未開催未来レース（秋華賞、菊花賞、天皇賞秋、凱旋門賞、有馬記念等）は厳格に勝者未登録のまま保護。
  - `tests/unit/backfillRaceWinners.test.ts` を新設し、過去レース抽出条件、未来レース除外、主催者・グレード別フィルター、dryRunモード、二重永続化を検証。

---

### Step 47: 2026年G1/Jpn1レース勝ち馬データの是正（2024年誤データの解消） (v1.36.1) [完了]
- **2026年G1/Jpn1レース実績データへの全面是正 [完了]**
  - `src/data/race_winners.json` に初期登録されていた2024年実績データ（日本ダービー：ダノンデサイル、皐月賞：ジャスティンミラノ等）を解消し、2026年の日本ダービー勝ち馬「**ロブチェン**（松山弘平、17番、2:22.7）」をはじめとする2026年確定実績データへ全件是正。
  - JRA G1（フェブラリーS：コスタノヴァ、高松宮記念：サトノレーヴ、大阪杯：クロワデュノール、桜花賞：スターアニス、中山GJ：エコロデュエル、皐月賞：ロブチェン、天皇賞春：クロワデュノール、NHKマイルC：ロデオドライブ、ヴィクトリアM：エンブロイダリー、オークス：ジュウリョクピエロ、日本ダービー：ロブチェン、安田記念：シックスペンス、宝塚記念：メイショウタバル、スプリンターズS：ピューロマジック）。
  - NAR Jpn1（川崎記念：カゼノランナー、羽田盃：フィンガー、かしわ記念：ウィルソンテソーロ、東京ダービー：フィンガー、帝王賞：ミッキーファイト）。
  - 海外主要G1（ケンタッキーダービー：Golden Tempo、QE2世カップ：Romantic Warrior）。
- **未開催未来レースからの勝者データ完全削除 [完了]**
  - 有馬記念、凱旋門賞など未来レースに誤設定されていた勝者データを完全削除（`undefined`）。
  - `scripts/parse-races.ts` による再ビルドで `public/data/races.json` と完全同期。

---

### Step 46: 各競馬主催者公式リザルトの自動パース機能および当日高頻度更新パイプラインの導入 (v1.36.0) [完了]
- **公式一次ソースに基づく自動リザルトパースプロバイダーの実装 [完了]**
  - `RaceResultFetcher` インターフェースに基づき、各競馬主催者（JRA, NAR, France Galop, BHA, HRI, HKJC, Equibase）の公式リザルトから機械的に勝ち馬情報（馬名・騎手名・馬番・走破タイム）を直接抽出するプロバイダー群を `scripts/update-race-results.ts` および `scripts/lib/` に実装。
- **当日中・発走直後ターゲット抽出ロジック (`getTargetPastRacesForResults`) [完了]**
  - 確定発走時刻と現在時刻を照合し、「発走後15分以上経過した当日レース＋直近3日以内の未確定レース」を即座にターゲット選出。未確定対象がない場合は早期終了ガード（Early Exit）により実行枠と外部負荷を最小化。
- **二重永続化アーキテクチャ & GitHub Actions 自動巡回 [完了]**
  - `public/data/races.json` と `src/data/race_winners.json` への二重永続化を実装。
  - GitHub Actions ワークフロー（`update-race-results.yml`）により、週末昼〜夕方、平日・土曜夜間、毎日早朝の高頻度自動巡回と GitHub Pages 自動デプロイ連動を配備。
  - `.agents/rules/00-project.md` に「Data accuracy & Single Source of Truth」セクションを新設。

---

### Step 45: レース終了後の勝ち馬（優勝馬）表示機能およびリザルト反映パイプラインの実装 (v1.35.0) [完了]
- **データスキーマ・型定義の拡張 (`src/types/race.ts`, パイプライン型) [完了]**
  - `RaceWinner` インターフェースを新設し、`Race` および `RaceOutput` 型に `winner?: RaceWinner;`（馬名、騎手名、馬番、走破タイム）を追加。
- **勝ち馬データの管理 & パイプライン連携 [完了]**
  - `src/data/race_winners.json` を新設し、主要重賞の実績勝ち馬データを多言語（日・英・仏・中）、騎手、馬番、走破タイムを含めて登録。
  - `scripts/parse-races.ts` において、`race_winners.json` のマージおよび既存 `races.json` からの勝ち馬データ保持保護ロジック（`extractRaceWinnersMap`）を実装。
  - レース終了後に着順確定リザルトから勝ち馬情報を取得・マージ・更新するパイプラインスクリプト (`scripts/update-race-results.ts`) を新設し、`npm run data:update-results` を整備。
- **UIコンポーネントへの勝ち馬表示 [完了]**
  - **タイムライン (`RaceCard.tsx`)**: レース終了後、かつ `winner` が存在する場合に「🏆 {馬名}」のコンパクトなアンバー調バッジを表示。
  - **カレンダー (`CalendarView.tsx`)**: セル内のレースチップ内にトロフィーアイコン付きで勝ち馬名（`🏆 {winnerName}`）を表示。
  - **レース詳細ダイアログ (`RaceDetailDialog.tsx`)**: 専用の「レース結果 / 優勝 (Race Result / Winner)」セクションを新設し、優勝馬名（第1・第2言語）、馬番、騎手名、走破タイムを整然と表示。
- **多言語（i18n）完全対応 & テスト拡充 [完了]**
  - 日英仏中の4言語対応および単体テスト `RaceCard.test.tsx`, `CalendarView.test.tsx`, `RaceDetailDialog.test.tsx`, `updateRaceResults.test.ts`, `parseRacesPreserveWinners.test.ts` を追加・全件合格。

---

### Step 44: タイムラインビュー表示時におけるフッターの画面下部固定表示（Fixed Bottom Bar）の実装 (v1.34.1 / Issue #140) [完了]
- **画面下部固定フッター（Fixed Bottom Bar）の実装 (`src/components/shared/Layout.tsx`) [完了]**
  - `useViewMode()` を参照し、タイムラインビュー表示時に `fixed bottom-0 left-0 right-0 z-20` で画面最下部に貼り付く固定フッターバーを実装。
  - 透過ブラー背景（`bg-background/90 supports-[backdrop-filter]:bg-background/80 backdrop-blur border-t shadow-xs`）を適用し、1行で「コピーライト」「発走時刻の確定について（`ConfirmedTimeHelpDialog`）」「免責事項・データ出典（`DisclaimerDialog`）」をコンパクトに配置。
  - カレンダービュー表示時は月別グリッドの特性に合わせ、従来のページ最下部静的フッターとして自然に表示。
- **最下部レースカードの被り防止（ボトム余白確保） [完了]**
  - タイムライン表示時、`<main>` コンテナに `pb-16`（64px）のボトムパディングを確保し、最後のレースカードやコンテンツが固定バーで隠れないよう配慮。
  - タイムライン最下部には非公式注記テキストを配置。
- **「今日へ戻る」フローティングボタンとの位置調和 (`src/features/timeline/TimelineView.tsx`) [完了]**
  - ジャンプボタンのボトム配置を従来の `bottom-6`（24px）から `bottom-14 sm:bottom-16 right-4 sm:right-6` へ調整し、固定フッターバーの直上に適度な余白を保って配置。
- **テスト拡充 & 仕様書更新 [完了]**
  - `tests/unit/Layout.test.tsx`: タイムラインモード時に固定フッターが表示され `pb-16` が付与されること、カレンダーモード時に従来の静的フッターが表示されること、4言語表示の検証を網羅。
  - `tests/unit/TimelineView.test.tsx`: ジャンプボタンのコンテナが `bottom-14 sm:bottom-16` を持つことの検証を追加（全48テストファイル・473テストすべて合格、ビルド・型検査も正常完了）。
  - `docs/PRD.md` を v1.34.1 (Step 44) へ更新し、PDF を再生成。

---

### Step 43: 各国・レースの発走予定時刻確定タイミングおよび反映目安を案内するヘルプモーダルの実装 (v1.34.0 / Issue #136) [完了]
- **発走時刻確定ガイドダイアログ（`ConfirmedTimeHelpDialog`）の実装 [完了]**
  - Shadcn UI / Radix UI の `Dialog` を採用し、公式確定タイミングおよび本アプリへの反映目安を一覧できるヘルプモーダルを新設。
  - 全7主催者（JRA, NAR, France Galop, BHA, HRI, Equibase, HKJC）の国コードバッジ、公式発表スケジュール、本アプリ反映目安を一覧化したレスポンシブテーブルを配置。
  - 定期巡回バッチによる自動反映の仕組みの解説、および天候悪化・馬場状態・主催者都合による直前変更・順延に関する注意喚起アラート（`AlertTriangle`）を併記。
- **全体 & コンテキスト連動導線の設置 [完了]**
  - **フッター（全体導線）**: `src/components/shared/Layout.tsx` のフッターリンクエリアに「発走時刻の確定について」ボタンを配備。
  - **レース詳細ダイアログ（コンテキスト連動導線）**: `src/components/shared/RaceDetailDialog.tsx` において、時刻未定（`is_time_confirmed === false`）の際、「時刻未定」表示の横に「発走時刻はいつ決まる？（ヘルプアイコン付き）」リンクを常設。
- **4言語（i18n）完全対応 [完了]**
  - 日本語（`ja`）、英語（`en`）、フランス語（`fr`）、繁体字中国語（`zh`）でダイアログタイトル、概要、全7主催者のスケジュールテキスト、注意事項を完全定義。
- **テスト拡充 & 仕様書更新 [完了]**
  - `tests/unit/ConfirmedTimeHelpDialog.test.tsx` を新規作成（開閉、全主催者スケジュール表示、4言語表示、カスタムトリガー動作など6テスト追加）。
  - `tests/unit/RaceDetailDialog.test.tsx` および `tests/unit/Layout.test.tsx` に導線表示検証を追加（全48テストファイル・472テストすべて合格、ビルド・型検査も正常完了）。
  - `docs/PRD.md` を v1.34.0 (Step 43) へ更新し、PDF を再生成。

---

### Step 42: フランス・フォワ賞発走日時是正および米フラワーボウルSの不正start_time解消・海外確定時刻引き継ぎガード導入 (v1.33.3 / Issue #134) [完了]
- **フランス・フォワ賞（Prix Foy: `2026-france-g2-19`）の実績発走日時の是正 [完了]**
  - `src/data/france_race_master.json` において、`date` を `2026-09-06`、`start_time` を `2026-09-06T15:35:00.000Z`（現地 17:35 CEST / 日本時間 9/7 00:35 JST）、`original_date` を `2026-09-06`、`is_time_confirmed` を `true` に修正。ニエル賞、ヴェルメイユ賞、ムーランドロンシャン賞と同日開催に正常化。
- **米フラワーボウルステークス（Flower Bowl S: `2026-us-g2-89`）の不正日時文字列の是正 [完了]**
  - `public/data/races.json` に残存していた不正文字列 `2026-08-36T21:30:00.000Z` を正しい発走日時 `2026-09-05T21:30:00.000Z` に修正。
- **確定時刻引き継ぎパイプラインの恒久ガード実装 [完了]**
  - `scripts/parse-races.ts`: `extractConfirmedRaceTimesMap` において、`isNaN(new Date(r.start_time).getTime())` となる不正な日時文字列を安全にスキップ・除外するバリデーションを追加。
  - `scripts/lib/{france-races,us-races,uk-races,hk-races,ireland-races}.ts`: マスタ側の開催日（`r.date`）と既存確定時刻に36時間以上の乖離がある場合、日程変更前の古い確定時刻で誤上書きしない保護ロジックを全海外レースマージ関数に導入。
- **テスト拡充 & 仕様書更新 [完了]**
  - `tests/unit/racesData.test.ts`: 全レースの `start_time` が有効な ISO 8601 UTC かつ `!isNaN` であることを検証するテストを追加。
  - `tests/unit/franceRaces.test.ts`: フォワ賞の日程・発走時刻妥当性および同日開催整合性のテストを追加。
  - `tests/unit/usRaces.test.ts`: フラワーボウルステークスの日時妥当性テストを追加。
  - `tests/unit/parseRacesPreserveTimes.test.ts`: 不正日付除外バリデーションのテストを追加（全47テストファイル・465テストすべて合格）。
  - `docs/PRD.md` を v1.33.3 (Step 42) へ更新し、PDF を再生成。

---

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
