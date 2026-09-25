# Antigravity Agent Routing Index: horse-racing-calendar

このファイルは、本プロジェクトにおけるAIエージェント（Antigravity）用の目次およびルーティングガイドです。
具体的なルールや仕様は本ファイルには記載していません。タスクの内容に応じて、以下の関連ファイル（Single Source of Truth）を必ず読み込み、その指示に従って作業を開始してください。

## 1. プロダクト仕様・要件ルーティング (Product Specifications Routing)

タスクの目的に応じて、以下のドキュメントを参照・更新してください。

| タスクの対象・目的 | 参照先ドキュメント (Single Source of Truth) | 内容・用途 |
| :--- | :--- | :--- |
| **プロダクト全体要件・UI/UX・共通仕様** | **`docs/PRD.md`** | プロダクト概要、ビジョン、デザインシステム方針、UI/UXコンポーネント仕様、共通スキーマ概要、ロードマップ |
| **データパイプライン共通仕様** | **`docs/specs/data-pipeline.md`** | ビルド・更新パイプライン全体構成、共通スキーマ（`races.json`）、確定時刻保護ロジック、`RaceTimeFetcher` 共通仕様 |
| **各国・団体のデータ仕様（How）** | **`docs/specs/data-sources/`** | 各国一次ソース、スクレイピングロジック、馬場コード、タイムゾーン・夏時間、出馬表API仕様 |
| ├─ JRA（中央競馬） | `docs/specs/data-sources/jra.md` | JRA公式ICS、`jyusyo.html`、出馬表スクレイパー、JST |
| ├─ NAR（地方競馬・ばんえい） | `docs/specs/data-sources/nar.md` | NAR公式スケジュール、15場馬場コード、当日出馬表（RaceList） |
| ├─ フランス競馬（France Galop） | `docs/specs/data-sources/france.md` | IFHA Part I、PMU出馬表API、CET/CEST（夏時間）、PSF（AW） |
| ├─ イギリス競馬（BHA） | `docs/specs/data-sources/uk.md` | IFHA Part I、Sporting Life出馬表API、GMT/BST（英国夏時間） |
| ├─ アメリカ競馬（Equibase） | `docs/specs/data-sources/us.md` | IFHA Part I、Equibase出馬表、北米4タイムゾーン（ET/CT/MT/PT）、DST |
| └─ 香港競馬（HKJC） | `docs/specs/data-sources/hk.md` | IFHA Part I、HKJC出馬表、香港時間（HKT）、4歳クラシック、中文（`zh`） |
| **新国の追加手順** | **`docs/guides/adding-new-country.md`** | 新規国・地域の競馬を追加する際の標準開発・運用手順書 |
| **定期バッチ運用・スケジュール** | **`docs/batch-schedules.md`** | GitHub Actions 定期cronバッチ一覧、CLIフラグ、トラブルシューティング |
| **過去の変更履歴・開発実績** | **`docs/CHANGELOG.md`** | 過去の全バージョン・ステップ（Step 1〜34）の完了履歴 |

---

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

---

## 3. UI/UX & デザインシステム要件 (Design System)

フロントエンド（Shadcn UI, Tailwind CSS, アクセシビリティ）の実装・変更を行う場合は以下を参照してください。

- **`.agents/rules/10-design-system.md`**: Shadcn UI の実装ルール、テーマリング、アクセシビリティ基準。
- **`docs/design-system-policy.md`**: コンポーネント管理方針、Shadcn UIの所有権モデルと更新ポリシー。
- **`components.json`**: Shadcn UI CLI の設定（エイリアス、ベースカラー等）の正本。

---

## 4. 品質・非機能要件 (Quality & Ops)

セキュリティ、パフォーマンス、またはタスクの完了確認を行う場合は以下を参照してください。

- **`.agents/rules/20-security.md`**: セキュリティ要件。
- **`.agents/rules/30-performance.md`**: パフォーマンス要件。
- **`.agents/rules/40-definition-of-done.md`**: タスクの完了定義 (Definition of Done)。