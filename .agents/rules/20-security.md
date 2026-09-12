
# Security implementation rules

詳細な要件と脅威モデルは、`docs/security/`を正本とする。

## Input and output

- すべての外部入力を信頼境界として扱う。
- 入力値検証はクライアント側だけでなくサーバー側でも実施する。
- SQL、HTML、URL、シェルなど、出力先に応じた安全なAPIを使用する。
- `dangerouslySetInnerHTML`は、承認されたサニタイズ処理なしで使用しない。
- ユーザー入力からクラス名、URL、リダイレクト先、ファイルパスを無制限に構築しない。

## Authentication and authorization

- 認証と認可を別の処理として扱う。
- UI上で操作を非表示にするだけで認可を実現しない。
- 保護対象ごとにサーバー側で認可を確認する。
- セキュリティ関連コードを変更した場合は、 未認証、権限不足、他ユーザー、境界値のテストを追加する。

## Secrets and privacy

- 秘密情報、認証トークン、個人情報をログへ出力しない。
- 秘密情報をソースコード、`components.json`クライアントバンドルへ直接記述しない。
- Registry認証情報は環境変数から参照する。
- クライアントへ公開される環境変数と、サーバー専用環境変数を区別する。
- エラーメッセージから内部構造や秘密情報を漏らさない。

## Dependencies and registries

- Shaden UIのRegistryから取得するコードも外部コードとしてレビューする。
- 未承認のRegistryを`components.json`に追加しない。
- Registry URLの変更を通常のUI変更として扱わない。
- 追加されたnpm依存関係について、用途、保守状況、ライセンス、既知の脆弱性を確認する。
- ロックファイルをコミットし、再現可能なインストールを維持する。
- 独自の暗号方式、認証方式、CSRF対策を実装しない。

## Browser security

- 外部リンクには用途に応じた安全な属性を設定する。
- URL、iframe、画像、ファイルアップロードの許可元を制限する。
- Content Security Policyを無効化してUIを動作させない。
- CookieのSecure、HttpOnly、SameSite方針を維持する。
