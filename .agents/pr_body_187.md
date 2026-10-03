## 概要 (Overview)
Closes #187

海外ユーザーへのSNS（X/Twitter、Facebook、Discord等）での拡散・共有体験を向上させるため、全言語のURLパス（`/ja/`, `/en/`, `/fr/`, `/zh/`）を導入し、**SNS投稿時に各言語に最適化された専用のOGP/Twitterカードが展開される仕組み**を構築しました。
グローバル標準およびIssue #172（PWA英語デフォルト化）に合わせて、**言語パスのないルート（`/`）のデフォルトOGPは「英語（Graded Races Calendar）」**とし、日本語専用パス `/ja/` では日本語カードを展開します。

---

## 主な変更点 (Key Changes)

### 1. 静的HTML・OGPタグの多言語出力 (`vite.config.ts`, `index.html`)
- **ルート (`index.html`) の英語デフォルト化**:
  - ルート（`/`）の静的HTMLを英語デフォルト（`<html lang="en">`、`Graded Races Calendar | Schedule of World Graded Races`、`og:locale="en_US"`）に設定。
- **Viteプラグインによる言語別静的HTML出力 (`generateLocalizedHtmlPlugin`)**:
  - ビルド時（`closeBundle`）に、各言語専用の静的HTML（`dist/ja/index.html`、`dist/en/index.html`、`dist/fr/index.html`、`dist/zh/index.html`、`dist/404.html`）を自動生成。
  - 日本語（`/ja/`）、英語（`/en/`）、フランス語（`/fr/`）、繁体字中国語（`/zh/`）の各専用OGP/Twitterカードタグ・言語属性・canonicalタグを静的埋め込み。

### 2. アクセス時の言語判定優先順位ルールの確立 (`src/store/useLanguageStore.ts`)
1. **第1優先（最優先）: URLパス（`/ja/`, `/en/`, `/fr/`, `/zh/`）**: SNS共有や外部リンク経由の言語指定を100%尊重。
2. **第2優先: 手動選択履歴（`localStorage`）**: ルートアクセス時に過去の手動選択を復元。
3. **第3優先: 端末ブラウザ設定（`navigator.language`）**: ルートへの初回訪問時に端末言語で自動判定。
4. **第4優先: 英語デフォルト（`en`）**。

### 3. 言語切り替え時のURL同期 (`history.replaceState`)
- アプリ内の言語セレクター（JA/EN/FR/ZH）で言語を切り替えた際、画面のリロードなしでアドレスバーのURLパス（`/ja/` 等）を即座に同期（クエリ・ハッシュ保持）。
- ブラウザの「戻る」「進む」（`popstate` イベント）をリスンし、履歴遷移時もストアの言語を自動追従。

### 4. シェア用URL生成ユーティリティ (`src/libs/share.ts`)
- 現在の言語パス（`/ja/`, `/en/` 等）を付与した共有用URLを取得する共通関数を配備。

### 5. テスト・ドキュメント更新
- `tests/unit/useLanguageStore.test.ts`: URLパス最優先判定、localStorage判定、navigator.language判定、replaceState同期、popstate連動テスト。
- `tests/unit/share.test.ts`: シェアURL生成テスト。
- `tests/unit/localizedHtml.test.ts`: ビルド後の `dist/index.html` および各言語HTMLのOGP/title検証テスト。
- `tests/unit/seo.test.ts`: ルート英語デフォルト仕様に合わせてテストを更新。
- `package.json`（v1.42.0）、`docs/PRD.md`（Step 68完了）、`docs/CHANGELOG.md`（Step 63完了）を更新しPRD PDFを再生成。

---

## 検証結果 (Verification)
- `npm test`: 全62テストファイル・587テスト全件パス
- `npm run type-check`: 型エラーなし
- `npm run build`: プロダクションビルド成功、`dist/{ja,en,fr,zh}/index.html` 生成確認済み

Co-authored-by: Antigravity <antigravity@example.com>
