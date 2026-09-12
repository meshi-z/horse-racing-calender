# Antigravity Agent Routing Index: horse-racing-calendar

このファイルは、本プロジェクトにおけるAIエージェント（Antigravity）用の目次およびルーティングガイドです。
具体的なルールや仕様は本ファイルには記載していません。タスクの内容に応じて、以下の関連ファイル（Single Source of Truth）を必ず読み込み、その指示に従って作業を開始してください。

## 1. プロダクト仕様・要件 (Product Requirements)

新機能の実装、データ構造の確認、システム全体の仕様を把握する場合は以下を参照してください。

- **`docs/PRD.md`**: プロジェクト概要、データパイプライン、JSONスキーマ、UI/UX仕様の正本。

## 2. プロジェクト開発規約 (Agent Rules)

コードを生成・変更する際の基本ルール、コマンド定義、正本の優先順位については以下を参照してください。

- **`.agents/rules/00-project.md`**: プロジェクトルールの正本（参照ドキュメントの優先順位、使用技術、変更スコープ）。

### A. AIコードコミット規約 (AI Code Commit Rules)

Gitコミットを行う際は、人間とAIの共同開発を正確に記録するため、コミットメッセージの最下部（フッター）に必ず以下の「`Co-authored-by`」表記を含めてください。

メッセージの構成ルール:

1. コミットメッセージ本文（通常の変更内容の記述）
2. 「必ず1行の空行」を入れる
3. 以下のテキストをそのまま記述する

```text
Co-authored-by: Antigravity <antigravity@example.com>
```

### B. AI GitHub規約 (AI GitHub Rules)

GitHubにPull Requestを出したり、Issueを出したりする際は、人間とAIの共同開発を正確に記録するため、必ず `--body`（または `-b`）の末尾に必ず以下の「`Co-authored-by`」表記を含めてください。

メッセージの構成ルール:

1. 本文（通常の変更内容の記述）
2. 「必ず1行の空行」を入れる
3. 以下のテキストをそのまま記述する

```text
Co-authored-by: Antigravity <antigravity@example.com>
```

## 3. UI/UX & デザインシステム要件 (Design System)

フロントエンド（Shadcn UI, Tailwind CSS, アクセシビリティ）の実装・変更を行う場合は以下を参照してください。

- **`.agents/rules/10-design-system.md`**: Shadcn UI の実装ルール、テーマリング、アクセシビリティ基準。
- **`docs/design-system-policy.md`**: コンポーネント管理方針、Shadcn UIの所有権モデルと更新ポリシー。
- **`components.json`**: Shadcn UI CLI の設定（エイリアス、ベースカラー等）の正本。

## 4. 品質・非機能要件 (Quality & Ops)

セキュリティ、パフォーマンス、またはタスクの完了確認を行う場合は以下を参照してください。

- **`.agents/rules/20-security.md`**: セキュリティ要件。
- **`.agents/rules/30-performance.md`**: パフォーマンス要件。
- **`.agents/rules/40-definition-of-done.md`**: タスクの完了定義 (Definition of Done)。