# Project rules

## Sources of truth

優先順位は次のとおり。

1. `docs/prd.md`
2. `docs/non-functional-requirements.md`
3. `docs/adr/`
4. `docs/design-system-policy.md`
5. `components.json`
6. 既存のソースコードとテスト
7. Shadcn UI公式ドキュメント

- 要件と実装が矛盾する場合、黙って一方を採用せず報告する。
- 公式最新版とプロジェクトの採用状態が異なる場合タスクのついでに更新しない。
- 仕様が確認できない場合は、推測でプロジェクト標準を変更しない。

## Technology

- UIの基盤としてShaden UIを採用する。
- 実際のフレームワーク、スタイル、RSC、TypeScript、 Tailwind CSS、エイリアスの設定は、`components.json`を正本とする。
- ランタイムとパッケージマネージャーのバージョンは、`package.json`、ロックファイル、バージョン管理ファイルに従う。
- 対応ブラウザは`docs/browser-support.md`を参照する。

## Change scope

- 依頼範囲を超えてShadcn UIコンポーネントを更新しない。
- `components.json'の初期化時設定を無断で変更しない。
- 新しいUI依存関係やRegistryを追加する前に承認を得る。
- ロックファイルを意図せず全面更新しない。
- 自動生成コマンド実行後は、生成されたコードと依存関係の差分を確認する。

## Commands

プロジェクトで定義されたコマンドを使用する。

- Install: `{install command}`
- Development: `{development command}`
- Lint: `{lint command}`
- Type check: `{type-check command}`
- Unit test: `{unit-test command}`
- E2E test: `{e2e-test command}`
- Build: `{build command}`
- Accessibility test: `{accessibility-test command}`

存在しないコマンドを推測で実行しない。