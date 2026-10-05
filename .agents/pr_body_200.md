## 概要 (Overview)
Issue #200 に対応し、JRA公式データベース（`accessS.html`）を一次ソースとする恒久的な勝ち馬自動取得パイプラインを構築しました。
併せて、2026年10月4日（日）開催のJRA重賞（毎日王冠・京都大賞典）の公式確定結果を反映し、PWA/Service Workerのタブ復帰時における最新データ再検証（キャッシュ更新）を強化しました。

---

## 主な変更内容 (Changes)

### 1. `JraRaceResultFetcher` の刷新と多層データベースフェッチ導入 (`scripts/lib/jra-results.ts`, `scripts/update-race-results.ts`)
- **一次ソースの転換**: レース展望ページ（`thisweek`）から、直近1ヶ月分以上の公式記録を常時保持する JRA公式データベース `https://www.jra.go.jp/JRADB/accessS.html`（POST `cname=pw01sli00/AF`）へ一次ソースを変更。
- **多層フェッチ構造の実装**:
  - `parseAccessSTopHtml`: accessS トップから各開催日（YYYYMMDD）および開催場別CNAME（`pw01srl...`）を抽出。
  - `parseMeetingRacesHtml`: 開催場ページから全レース一覧および対象重賞の詳細CNAME（`pw01sde...`）を特定。
  - レース詳細ページから `parseJraRaceResultHtml` により1着馬・馬番・騎手・タイムを抽出。
- **Shift_JISデコードの安全性向上**:
  - `decodeShiftJis` に `{ fatal: true }` を追加し、無効バイト検出時に安全にUTF-8フォールバックするよう改修（モックテスト環境や文字化け防止）。
- **効果**:
  - レース当日夕方の速報取得はもちろん、月曜早朝に次週番組予告へ切り替わった後（週明け）の定期バッチでも過去アーカイブから漏れなく自動取得可能に。

### 2. 10/4開催JRA重賞（毎日王冠・京都大賞典）の勝ち馬データ反映
- 公式一次ソースの実績値に基づき `src/data/race_winners.json` へ登録:
  - **毎日王冠 (`2026-jra-g2-29`)**: セイウンハーデス（幸 英明, 1番, 1:45.5）
  - **京都大賞典 (`2026-jra-g2-28`)**: エコロディノス（田口 貫太, 12番, 2:24.0）
- `syncShardedRaceFiles` により `public/data/races-2026.json`, `public/data/races.json`, `public/data/index.json` に完全同期。

### 3. PWA / Service Worker のタブ復帰時キャッシュ再検証強化 (`src/hooks/useRaces.ts`)
- `handleVisibilityChange` において、ドキュメントが表示状態（`visible`）に切り替わった際に `reloadLatestRaces()` を明示的に呼び出すよう改善。
- ユーザーが別タブ等から戻った際、Workboxの `StaleWhileRevalidate` キャッシュ再検証と最新データへのStore更新が自動実行されるように強化。

### 4. 単体テスト・ドキュメント整備
- `tests/unit/updateRaceResults.test.ts`: accessS トップ解析、全レース成績抽出、およびモック通信による多層フェッチの単体テストを追加。全66テストファイル・627テスト全件パス。
- `docs/specs/data-sources/jra.md`: Section 6 に RaceResultFetcher 仕様を追記。
- `docs/specs/data-pipeline.md`: JraRaceResultFetcher 記載を更新。
- `docs/PRD.md` (Step 70-10 完了記録, v1.44.4) および `docs/CHANGELOG.md` (Step 66 記録) を更新。
- `docs/Horse_Racing_Calendar_PRD.pdf` を再生成。

---

## 検証結果 (Verification)
- `npm run type-check`: TypeScript エラー 0 件。
- `npm test`: 全66テストファイル・627テスト全件パス。
- `npm run build`: プロダクションビルド・PWA Service Worker 生成成功。
- `npm run docs:pdf`: PDF 再生成成功。

Closes #200

Co-authored-by: Antigravity <antigravity@example.com>
