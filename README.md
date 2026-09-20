# horse-racing-calendar

JRA（日本中央競馬会）の重賞レース（G1, G2, G3等）スケジュールを、時系列のタイムラインおよび月間カレンダー形式で視覚的かつ軽快に確認できるオープン型 Web アプリケーション（SPA / PWA）です。

モバイル閲覧時は直近のレースを追いやすい「タイムラインビュー」、PC/タブレット閲覧時は月全体の開催日程を俯瞰できる「月間カレンダービュー（月曜始まり・土日連続）」を自動選択し、オフライン環境でも快適にアクセスできる体験を提供します。

---

## 主な特徴 (Features)

- **レスポンシブ・マルチビュー:**
  - **タイムラインビュー:** 開催日昇順にグループ化された時系列リスト表示（モバイル最適化）。
  - **月間カレンダービュー:** 競馬の土日開催を直感的に把握できる「月曜始まり」の7列グリッド表示。
  - **ユーザー設定の永続化:** 選択した表示モードは `localStorage` に保存され、次回訪問時にも復元。
- **高アクセシビリティ & モダンデザイン:**
  - **Shadcn UI (Radix UI + Tailwind CSS)** による設計。
  - WAI-ARIA 準拠（キーボード操作対応、適切なロール・ARIA 属性）。
  - WCAG 2.1 AA 基準を満たすセマンティックカラー（G1/G2/G3 グレードバッジ）。
- **リアルタイム絞り込み (FilterBar):**
  - キーワード検索（日英）、グレード（G1〜G3/J.G1〜J.G3）、馬場種別（芝/ダート/障害）の複合フィルタリング。
- **詳細ダイアログ (RaceDetailDialog):**
  - 発走時刻（確定/予定ステータス）、開催場、距離、出走資格（性別・年齢制限）、負担重量種別を網羅。
- **オフライン・PWA 対応:**
  - 静的ホスティング（GitHub Pages）と Service Worker による軽快な動作。

---

## 技術スタック (Tech Stack)

| カテゴリ | 採用技術 |
| :--- | :--- |
| **Framework / Library** | React 19, Vite, TypeScript |
| **Styling & UI** | Tailwind CSS, Shadcn UI, Radix UI Primitives, Lucide Icons |
| **State Management** | Zustand |
| **Testing** | Vitest, Testing Library (@testing-library/react, @testing-library/jest-dom) |
| **Code Tooling** | TypeScript (`tsc --noEmit`), PostCSS, Autoprefixer |

---

## 開発の始め方 (Getting Started)

### 前提条件 (Prerequisites)

- **Node.js:** `v20.x` 以上推奨 (LTS)
- **npm:** `v10.x` 以上

### 1. リポジトリのクローン & ディレクトリ移動

```bash
git clone https://github.com/meshi-z/horse-racing-calender.git
cd horse-racing-calender
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. ローカル開発サーバーの起動

```bash
npm run dev
```

起動後、コンソールに表示されるローカルURL（通常は [http://localhost:5173](http://localhost:5173)）をブラウザで開いてください。

---

## 利用可能なスクリプト (Available Scripts)

プロジェクトで定義されている主要な npm スクリプトは以下のとおりです。

| コマンド | 説明 |
| :--- | :--- |
| `npm run dev` | ローカル開発サーバーを起動 (Vite) |
| `npm run build` | TypeScript の型検査およびプロダクションビルドを実行 |
| `npm run preview` | ビルド成果物（`dist/`）をローカルでプレビュー |
| `npm run test` | Vitest による単体・統合テストを実行 |
| `npm run type-check` | `tsc --noEmit` による TypeScript 型検査 |
| `npm run data:build` | 公式データ（JRA/NAR/フランス）をパースし、レースマスター JSON を生成 |
| `npm run data:update-times` | JRA・NAR公式出馬表から確定発走時刻・代替開催日を取得・更新 |
| `npm run icons:generate` | PWA 用アプリアイコン（PNG/SVG）を一括生成 |
| `npm run docs:pdf` | PRD仕様書から公式PDF（`Horse_Racing_Calendar_PRD.pdf`）を生成 |

> [!TIP]
> 各バッチスクリプトの詳細なコマンドオプション（`--force`, `--dry-run`, `--org` 等）や、GitHub Actions による確定時刻自動更新の定期スケジュール（cron）については、[バッチ処理・定期実行パイプライン スケジュール & 運用ガイド](docs/batch-schedules.md) をご覧ください。

---

## デプロイ & CI/CD パイプライン (Deployment & CI/CD)

本プロジェクトは **GitHub Pages** による静的ホスティングに対応しており、GitHub Actions ワークフロー（`.github/workflows/deploy.yml`）によって自動ビルド・デプロイが行われます。また、毎週木〜日曜に確定発走時刻を自動取得するワークフロー（`.github/workflows/update-race-times.yml`）も稼働しています。

### 自動配信パイプラインの構成

1. **トリガー条件:**
   - `main` ブランチへの `push`: 自動ビルド、テスト、および GitHub Pages へのデプロイ（PRマージ時やデータ自動更新コミット時）
   - `pull_request` (対象: `main`): 型検査・テスト・ビルド検証（デプロイはスキップ）
   - 手動実行 (`workflow_dispatch`): GitHub Web UI からのオンデマンドデプロイ
2. **サブディレクトリ配信 (`BASE_URL`) 対応:**
   - GitHub Pages のリポジトリ名サブディレクトリ（`/<repo-name>/`）に対応するため、ビルド時に環境変数 `BASE_URL` が動的に注入されます。
   - レースデータ (`data/races.json`)、PWA マニフェスト (`manifest.webmanifest`)、各種アセットパスは `BASE_URL` に自動追従します。
   - SPA ルーティングのフォールバックとして `dist/404.html` がビルド時に自動生成されます。

### GitHub Pages 初期設定手順

初回デプロイを行う際は、GitHub リポジトリ設定で以下を一度だけ有効化してください。

1. GitHub リポジトリの **Settings** > **Pages** を開く。
2. **Build and deployment** > **Source** で **「GitHub Actions」** を選択する。
3. `main` ブランチにコミットをプッシュするか、Actions タブからワークフローを手動実行すると自動的に配信が完了します。

---

## ディレクトリ構成 (Directory Structure)

主要なディレクトリの役割は次のとおりです。

```text
src/
|- components/
|  |- ui/       # Shadcn UI 由来の汎用UIプリミティブ
|  `- shared/   # 複数機能で利用する合成コンポーネント (RaceCard, FilterBar 等)
|- features/    # 機能・ドメイン固有の実装 (timeline, calendar 等)
|- hooks/       # カスタム React Hooks (useViewMode, useRaces 等)
|- libs/        # UIに依存しない共通処理・日付/カレンダー計算
|- store/       # Zustand による状態管理
|- styles/      # グローバルスタイルと Tailwind デザイントークン
`- types/       # レースおよびフィルターのドメイン型定義
```

* 実際のファイル構造を正本とします。
* 新しいトップレベルディレクトリを追加した場合は、この説明を更新してください。
* ツリーには主要ディレクトリのみを記載しています。

---

## 動作確認・検証について

ローカル環境での機能検証や実機ブラウザでの確認手順については、開発サーバー起動後に以下の観点でご確認いただけます。

1. **レスポンシブ表示:** 画面幅 768px を境にタイムラインと月間カレンダーの初期表示が切り替わること。
2. **モード永続化:** ヘッダーのタブで表示モードを変更後、リロードしても選択状態が維持されること（`localStorage`）。
3. **カレンダー挙動:** 月曜始まりで土日開催が連続して確認でき、年月ナビゲーション（前月・翌月・今月）が正常に動作すること。
4. **詳細モーダル:** タイムラインのカードおよびカレンダー内のレースバッジから詳細ダイアログが開閉できること。
5. **免責事項モーダル:** フッターの「免責事項・データ出典」からダイアログが開き、利用規約や免責文言が確認できること。
6. **アクセシビリティ:** キーボード（Tab, Enter, Space, Esc）による操作が可能であること。

---

## 免責事項・データ出典 (Disclaimer & Data Source)

- **非公式ファンサイト:** 本サービス（`horse-racing-calendar`）は、個人が開発・運営する非公式のファンサイトです。日本中央競馬会（JRA）およびその他の競馬主催団体、関連機関とは一切関係ありません。
- **データの出典:** 本アプリに掲載されているレース日程、発走時刻、出走条件等のデータは、JRA（日本中央競馬会）公式サイト等で一般公開されている情報（カレンダーデータ、重賞日程、出馬表等）を取得・加工して提供しています。
- **開催変更と免責規定:** レースの日程、発走時刻、出走馬、斤量等の情報は、天候悪化・自然災害や主催者の都合等により、予告なく変更・中止・延期（代替開催・続行競馬等）となる場合があります。情報の正確性・完全性には細心の注意を払っておりますが、リアルタイム性や完全性を保証するものではありません。**馬券の購入、現地観戦、遠征等の際は、必ず主催者（JRA等）公式発表の最新情報をご確認ください。** 本サービスの利用により生じたいかなる損害・トラブル等についても、開発者および運営者は一切の責任を負いません。
- **商標・権利の帰属:** 本サービスに掲載されているレース名、競馬場名、主催団体名等の名称、商標およびロゴ等の知的財産権は、各権利者に帰属します。

---

## コントリビューション・コミット規約 (Commit Convention)

Git コミットやプルリクエストを作成する際は、AI と人間の共同開発を正確に記録するため、コミットメッセージおよび PR 本文の末尾に以下のフッターを含めてください。

```text
Co-authored-by: Antigravity <antigravity@example.com>
```