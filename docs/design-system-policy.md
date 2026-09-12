# Design system policy

## Adopted system

- UI基盤としてShadcn UIを採用する。
- Shaden UI公式ドキュメント: https://ui.shadcn.com/docs
- Shadcn UI公式Registryを標準の取得元とする。
- プロジェクト固有の構成は、`components.json`を正本とする。

## Ownership model

Shadcn UIから追加したコンポーネントは、外部パッケージの内部実装ではなく、このプロジェクトが所有するソースコードである。

そのため、プロジェクトは次の責任を負う。

- コードレビュー
- セキュリティ確認
- アクセシビリティ確認
- テスト
- 不具合修正
- 上流変更の取り込み判断
- プロジェクト固有カスタマイズの保守

## Project configuration

次の値は、`components.json`に記録する。

- Style: `{configured style}`
- Base color: `{configured base color}`
- CSS variables: `{true or false}`
- React Server Components: `{true or false}`
- TypeScript/TSX: `{true or false}`
- Tailwind CSS file: `{path}`
- UI component alias: `{alias}`
- Approved registries: `{registries}`

`components.json`と本書が矛盾する場合は、実装を変更する前に差異を確認する。

## Theming policy

- CSS変数が有効な場合、セマンティックトークンを使用する。
- ブランドカラーや状態色をコンポーネントへ直接記述しない。
- ライトテーマとダークテーマを同じトークン体系で管理する。
- 新しいトークンは用途を表す名前で追加する。
- テーマ変更ではコントラストとフォーカス表示を確認する。

## Component layers

- `components/ui/`: 汎用UIプリミティブ
- 共通コンポーネント領域: 複数機能で利用する合成コンポーネント
- 機能領域: ビジネスルールを含むドメイン固有コンポーネント

ビジネスロジックを`components/ui/`に配置しない。

## Accessibility target

- 適合目標:`{例:WCAG 2.2 AA)`
- Shaden UIの初期実装だけで適合したとは判断しない。
- プロジェクトで行った変更と画面全体を検証対象とする。
- 自動検査に加えてキーボード操作とフォーカス管理を確認する。

## Update policy

Shadcn UIコンポーネントは自動的に最新版へ更新しない。

更新時は次を実施する。

1. 上流との差分を確認する。
2. プロジェクト固有の変更を特定する。
3. 依存関係の変更を確認する。
4. アクセシビリティと操作方法の変更を確認する。
5. 対象コンポーネントのテストを実行する。
6. 更新理由と影響範囲を記録する。

## Exceptions

標準方針から逸脱する場合は次を記録する。

- 対象
- 理由
- 代替案を採用しなかった理由
- アクセシビリティへの影響
- セキュリティへの影響
- 保守上の影響
- 承認者
- 見直し時期
