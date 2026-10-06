## 概要 (Overview)
Issue #207 に対応し、スマートフォン実機および幅360px〜390px前後のモバイル画面において、ヘッダーのサービス名称が不自然に3段改行される問題およびタブ切替テキストが重なり合う表示崩れを解消しました。

---

## 主な変更内容 (Changes)

### 1. タイトル領域のスマート化 (`src/components/shared/Header.tsx`)
- サービス名称 `h1` に `whitespace-nowrap` を付与し、右側コントロール群の幅に押されて「重賞カ」「レンダ」「ー」と縦3段に分割される問題を完全解消。
- モバイル時の文字サイズを `text-sm sm:text-base md:text-lg` にレスポンシブ調整。
- タイトル・ロゴのラッパーに `shrink-0` を付与し、右側要素に押し潰されない最小幅を確保。

### 2. 表示モード切替（Tabs）のモバイル最適化 (`src/components/shared/Header.tsx`)
- 画面幅 `sm:` 未満（モバイル）では、テキストラベルを `hidden sm:inline` としてアイコン（`ListFilter` / `Calendar`）のみをコンパクトに表示（タブ幅を約200px $\rightarrow$ 約70px へ約65%圧縮）。
- 各 `TabsTrigger` に `aria-label={t("nav.timeline")}`、`title={t("nav.timeline")}`、および `whitespace-nowrap` を付与し、スクリーンリーダー対応（アクセシビリティ）および文字重なりの完全防止を両立。
- タブレット・PC画面（`sm:` 以上）では従来どおりアイコン＋テキストを表示。

### 3. コンテナおよび右側コントロール群の省スペース化 (`src/components/shared/Header.tsx`)
- ヘッダー内コンテナのパディングを `px-3 sm:px-8`、左右要素間のギャップを `gap-2 sm:gap-4` に最適化。
- 右側コントロール群の gap を `gap-1 sm:gap-1.5`、言語セレクターのパディングを `px-1.5 sm:px-2` に調整し、幅360px（Galaxy S等）の狭小端末でも全要素が1行で快適に収まるUIを実現。

### 4. 単体テスト・ドキュメント整備
- `tests/unit/Header.test.tsx` にモバイル最適化クラス（`whitespace-nowrap`、`hidden sm:inline`）およびアクセシビリティ検証テストを追加（全66テストファイル・628テスト全件パス）。
- `docs/PRD.md` (Step 70-11, v1.44.5) および `docs/CHANGELOG.md` (Step 67) を更新。
- `docs/Horse_Racing_Calendar_PRD.pdf` を再生成。

---

## 検証結果 (Verification)
- `npm run type-check`: TypeScript エラー 0 件。
- `npm test`: 全66テストファイル・628テスト全件パス。
- `npm run build`: プロダクションビルド・PWA Service Worker 生成成功。
- `npm run docs:pdf`: PDF 再生成成功。

Closes #207

Co-authored-by: Antigravity <antigravity@example.com>
