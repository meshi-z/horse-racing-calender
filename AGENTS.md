# Antigravity Rules: horse-racing-calendar

## 1. プロジェクト基本方針 & PRD参照
- 本プロジェクトは `PRD.md` を唯一の正解（Single Source of Truth）とします。
- UI/UXの実装において、**デジタル庁デザインシステム (DADS: https://design.digital.go.jp/dads/)** を全面的に採用・優先します。

## 2. UI/UX & アクセシビリティ（DADS厳守ルール）
コード（JSX / TSX / CSS）を生成・変更する際は、常に以下のDADSルールを適用してください。

### A. カラー & コントラスト (WCAG 2.1 AA)
- 通常テキストと背景のコントラスト比は **4.5:1 以上** を必須とします。
- 重賞グレードバッジ・タグの配色:
  - **G1 / J.G1:** `#1D4ED8` (Blue) + 白文字 `#FFFFFF`
  - **G2 / J.G2:** `#B91C1C` (Red) + 白文字 `#FFFFFF`
  - **G3 / J.G3:** `#15803D` (Green) + 白文字 `#FFFFFF`
- テキストのみに頼らず、色＋テキスト（ラベル）＋視覚的境界線（border）で情報を識別可能にしてください。

### B. キーボード操作 & フォーカス表示
- すべての対話型要素（`<button>`, `<a>`, `<input>`, `<select>` 等）はキーボード（Tab / Shift+Tab / Enter / Space）で完全操作可能にしてください。
- 独自コンポーネントを作成する場合は、必ず `tabIndex={0}` と `onKeyDown` ハンドラー（Enter/Space検出）を付与してください。
- **Focus Ring (フォーカスリング):** `:focus-visible` スタイルを消さず、3px相当の視認しやすいアウトライン（DADS標準: `focus:ring-4 focus:ring-blue-600 focus:outline-none`）を必ず適用してください。

### C. セマンティックHTML & WAI-ARIA
- `<div>` の濫用を避け、`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>` などの意味のあるHTML要素を使用してください。
- 動的表示（カレンダー/タイムラインの切替、フィルター適用）の際は、`aria-expanded`, `aria-selected`, `aria-current="page"`, `aria-label` などを適切に付与・更新してください。

## 3. データアーキテクチャ & TypeScript型定義
- データ構造は `public/data/races.json` の統合拡張スキーマに厳密に従ってください。
- フィールド名の標準化:
  - 競馬場名: `racecourse_jp` / `racecourse_en` （`venue` は使用不可）
  - 馬場種別: `surface_jp` / `surface_en`
  - 発走時刻: UTC ISO文字列（`start_time`）を受け取り、クライアントのローカルタイムゾーンへ変換して表示すること。

## 4. 品質 & コーディング規約
- コンポーネント作成時は、アクセシビリティを阻害する書き方（例: `outline-none` 単体指定、`aria-*` の省略）を行わないでください。
- 迷った場合は、常に DADS Guidelines (https://design.digital.go.jp/dads/) を優先して判断してください。