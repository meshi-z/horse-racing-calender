# Project rules

## Sources of truth

優先順位は次のとおり。

1. `docs/PRD.md`（全体プロダクト要求仕様書）
2. `docs/specs/`（データパイプラインおよび各国データ技術仕様書）
3. `docs/non-functional-requirements.md`
4. `docs/adr/`
5. `docs/design-system-policy.md`
6. `components.json`
7. 既存のソースコードとテスト
8. Shadcn UI公式ドキュメント

- 要件と実装が矛盾する場合、黙って一方を採用せず報告する。
- 公式最新版とプロジェクトの採用状態が異なる場合タスクのついでに更新しない。
- 仕様が確認できない場合は、推測でプロジェクト標準を変更しない。
- 新規国・データソース追加時は `docs/PRD.md` を直接肥大化させず、`docs/specs/data-sources/{country}.md` を作成・追記する。

## Data accuracy & Single Source of Truth

- **公式一次ソースの厳格な準拠**: レース結果（勝ち馬・着順）および確定発走予定時刻は、必ず各競馬主催者の公式情報（公式サイト・公式API等の一次ソース）を正とする。
- **事実データ・実績値の推測補完・架空生成の厳禁**:
  - AIの内部記憶、連想知識、外部検索エンジンの不確実な情報による推測値や、架空のダミーデータを本番データやマスターデータに登録してはならない。
- **一次ソース原則と空値原則（Null Value Principle）**:
  - 実在する公式一次ソースで直接確認できないデータ、または未確定・未開催のデータは、推測で補完せず「未設定／空（null, undefined等）」のまま保持・登録する。
  - 「欠損を埋めなければならない」という独断でダミー生成スクリプト等を作成・実行してはならない。
- **年次（西暦）の厳密な照合**: レース名が同一であっても、対象レースの年度（`race.date` の西暦年）と取得したリザルトの年次が一致していることを必ず照合・検証し、過去年度データの混入を防止する。
- **パーサー障害・未取得時の安全フォールバック**: 公式パーサーの不備等で勝ち馬データが取得できなかった場合、架空データや別年度データを補完せず未取得（空値）のまま維持し、原因調査およびパーサー修正を行うこと。

## Technology

- UIの基盤としてShadcn UIを採用する。
- 実際のフレームワーク、スタイル、RSC、TypeScript、Tailwind CSS、エイリアスの設定は、`components.json`を正本とする。
- ランタイムとパッケージマネージャーのバージョンは、`package.json`、ロックファイル、バージョン管理ファイルに従う。
- 対応ブラウザは`docs/browser-support.md`を参照する。

## Change scope

- 依頼範囲を超えてShadcn UIコンポーネントを更新しない。
- `components.json`の初期化時設定を無断で変更しない。
- 新しいUI依存関係やRegistryを追加する前に承認を得る。
- ロックファイルを意図せず全面更新しない。
- 自動生成コマンド実行後は、生成されたコードと依存関係の差分を確認する。

## Commands

プロジェクトで定義されたコマンドを使用する。

- Install: `npm install`
- Development: `npm run dev`
- Lint / Type check: `npm run type-check`
- Unit test: `npm test`
- Build: `npm run build`
- PRD PDF: `npm run docs:pdf`

存在しないコマンドを推測で実行しない。