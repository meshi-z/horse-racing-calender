## 概要 (Overview)
Issue #181 に対応し、2027年以降の番組追加や新規国（UAE・サウジアラビア・オーストラリア）拡張を見据えた**年度別データ分割（Sharding）アーキテクチャ**および**オンデマンド取得機構**を導入しました。

これにより、レースデータ総数が数千件規模へスケールした場合でも、初回起動時のデータ転送量を最小限（100KB前後）に抑え、オフライン・PWAでの高速な起動と軽快なカレンダー操作を両立します。

---

## 主な変更内容 (Changes)

### 1. パイプライン共通 Sharding 出力ユーティリティの配備 (`scripts/lib/race-sharding.ts`)
- `syncShardedRaceFiles(races, dataDir)` を実装:
  - `public/data/races-YYYY.json`: 西暦年度ごとに分割されたレースデータ
  - `public/data/index.json`: 提供年度一覧（`years`）、デフォルト年度（`defaultYear`）、総件数（`totalRaces`）、年度別内訳（`yearCounts`）
  - `public/data/races.json`: 完全な後方互換性を担保する結合版（常時同期出力）
- 以下の全データパイプラインへ自動同期を組み込み:
  - `scripts/parse-races.ts` (`npm run data:build`)
  - `scripts/update-race-times.ts` (`npm run data:update-times`)
  - `scripts/update-race-results.ts` (`npm run data:update-results`)

### 2. クライアント側オンデマンド取得 & シームレスマージ (`src/hooks/useRaces.ts`, `src/store/useRaceStore.ts`)
- `useRaceStore`:
  - `loadedYears: number[]` を管理。
  - `addRacesForYear(year, races)` により、レースID重複排除および日付・時刻順ソートを自動適用して既存データにマージ。
- `useRaces`:
  - 初回起動時は現在年度（例: 2026年）の shard のみを高速取得。
  - カレンダー・タイムラインの年送り操作で未取得年度（`loadedYears` 外）に遷移した際、バックグラウンドで該当年度 shard をオンデマンド取得（レイアウトシフトやブランク画面を防止）。
  - 万が一 shard が 404 の場合は結合版 `races.json` へ安全にフォールバック。
  - `forceRefreshRaces` / `refreshRaces` によるキャッシュ強制更新も loadedYears を尊重して追従。

### 3. PWA Workbox キャッシュ設定の拡張 (`vite.config.ts`)
- Service Worker ランタイムキャッシュの URL パターンを `/\/data\/(races(-[0-9]{4})?|index)\.json$/` に更新。
- `StaleWhileRevalidate` および BroadcastChannel 自動更新が全 shard と index に適用。

### 4. ドキュメント & テスト拡充
- `docs/PRD.md` (Step 69 完了記録, v1.43.0), `docs/specs/data-pipeline.md` (Section 2.3 Sharding仕様追加), `docs/CHANGELOG.md` (Step 64 記録)。
- `docs/Horse_Racing_Calendar_PRD.pdf` 再生成。
- `tests/unit/raceSharding.test.ts`: Sharding 出力・ソート順整合性テスト。
- `tests/unit/useRaces.test.ts` & `tests/unit/useRaceStore.test.ts`: Shard フェッチ・404フォールバック・オンデマンドフェッチ・ストアマージテスト。

---

## 検証結果 (Verification)
- `npm run data:build`: `races-2026.json` (1336件), `index.json`, `races.json` が正常同期出力。
- `npm test`: 全63テストファイル・594テスト全件合格。
- `npm run type-check`: TypeScript エラー 0 件。
- `npm run build`: プロダクションビルド・PWA Service Worker 生成成功。
- `npm run docs:pdf`: PDF 再生成成功。

Closes #181

Co-authored-by: Antigravity <antigravity@example.com>
