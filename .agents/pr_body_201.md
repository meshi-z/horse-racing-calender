## 概要 (Overview)
Issue #201 に対応し、定期バッチ（`update-race-times.yml`, `update-race-results.yml`）による発走時刻・勝ち馬データ更新時に、本番サイト（GitHub Pages）が自動的に再ビルド・再デプロイされるパイプラインを構築しました。

これにより、バッチによってデータが更新された際、人間の手動介入（PRマージ等）なしに数分以内に本番サイト（GitHub Pages）へ確定時刻や最新の勝ち馬が即時反映されます。

---

## 主な変更内容 (Changes)

### 1. `deploy.yml` の再利用可能ワークフロー（`workflow_call`）化
- `on:` に `workflow_call:` を追加し、他ワークフローから直接呼び出し可能に改修。
- `actions/checkout@v4` で、`workflow_call` 実行時も確実に最新の `main` HEAD（バッチがpushしたコミット）をチェックアウトするよう `ref: ${{ github.event_name == 'workflow_call' && 'main' || '' }}` を設定。
- `BASE_URL` 環境変数の抽出を `${GITHUB_REPOSITORY#*/}` から動的取得する形に改善し、`schedule` や `workflow_call` など `github.event.repository.name` が空になるイベント契機でも常に正しい `/horse-racing-calender/` が設定されるように堅牢化。

### 2. 定期バッチワークフローからの自動デプロイ連動 (`update-race-times.yml`, `update-race-results.yml`)
- ワークフローレベルのパーミッションに `pages: write`, `id-token: write` を追加。
- 差分検知を `git status --porcelain public/data/ src/data/` に統一し、結合版 `races.json` だけでなく Sharding ファイル（`races-*.json`, `index.json`）やマスタファイルも確実に包括ステージング・コミット。
- データ変更検出時のみ `has_changes: true` を出力し、後続の `deploy` ジョブが `uses: ./.github/workflows/deploy.yml` を自動連動実行（変更がない場合はデプロイをスキップしてリソース消費を防止）。

### 3. ドキュメント整備
- `docs/batch-schedules.md`: バッチスケジュール一覧および自動デプロイ処理フロー図（mermaid）を最新化。
- `docs/specs/data-pipeline.md`: パイプライン全体アーキテクチャ図の自動デプロイ連動を更新。
- `docs/PRD.md` (Step 70-9 完了記録, v1.43.1) および `docs/CHANGELOG.md` (Step 65 記録) を更新。
- `docs/Horse_Racing_Calendar_PRD.pdf` を再生成。

---

## 検証結果 (Verification)
- `npm run type-check`: TypeScript エラー 0 件。
- `npm test`: 全66テストファイル・623テスト全件合格。
- `npm run build`: プロダクションビルド・PWA Service Worker 生成成功。
- `npm run docs:pdf`: PDF 再生成成功。

Closes #201

Co-authored-by: Antigravity <antigravity@example.com>
