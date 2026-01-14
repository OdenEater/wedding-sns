# Git ブランチ運用ルール

> 最終更新: 2026年1月14日

## ブランチ戦略

このプロジェクトでは、シンプルなGit Flowを採用しています。

### ブランチ構成

```
main (本番環境)
  ↑
  └─ develop (開発環境)
       ↑
       └─ feature/* (機能開発ブランチ)
```

---

## ブランチの役割

### 1. `main` ブランチ
- **役割**: 本番環境に反映されるコード
- **保護**: 直接コミット禁止
- **デプロイ**: Vercelに自動デプロイ
- **マージ元**: `develop` ブランチのみ

### 2. `develop` ブランチ
- **役割**: 開発中の最新コード
- **用途**: 機能開発・バグ修正
- **テスト**: ローカル環境で動作確認
- **マージ元**: `feature/*` ブランチ、または直接コミット

### 3. `feature/*` ブランチ（オプション）
- **役割**: 大きな機能開発用
- **命名**: `feature/機能名` (例: `feature/realtime-update`)
- **用途**: 複数コミットが必要な機能
- **マージ先**: `develop` ブランチ

---

## 開発フロー

### 基本的な開発フロー

```bash
# 1. developブランチに切り替え
git checkout develop

# 2. 最新の状態に更新
git pull origin develop

# 3. コードを編集

# 4. ローカルで動作確認
npm run dev

# 5. ビルドテスト
npm run build

# 6. 変更をコミット
git add .
git commit -m "feat: 機能の説明"

# 7. developにプッシュ
git push origin develop

# 8. 動作確認完了後、mainにマージ
git checkout main
git merge develop
git push origin main
```

### 大きな機能を開発する場合

```bash
# 1. developブランチから新しいブランチを作成
git checkout develop
git checkout -b feature/新機能名

# 2. コードを編集・コミット
git add .
git commit -m "feat: 新機能の実装"

# 3. developにマージ
git checkout develop
git merge feature/新機能名

# 4. ローカルで動作確認
npm run dev
npm run build

# 5. developにプッシュ
git push origin develop

# 6. 動作確認完了後、mainにマージ
git checkout main
git merge develop
git push origin main

# 7. featureブランチを削除（オプション）
git branch -d feature/新機能名
```

---

## コミットメッセージ規約

### プレフィックス

| プレフィックス | 意味 | 例 |
|--------------|------|-----|
| `feat:` | 新機能 | `feat: リアルタイム更新を実装` |
| `fix:` | バグ修正 | `fix: いいねボタンの表示崩れを修正` |
| `docs:` | ドキュメント | `docs: READMEを更新` |
| `style:` | コードフォーマット | `style: インデントを修正` |
| `refactor:` | リファクタリング | `refactor: handlePost関数を整理` |
| `test:` | テスト追加 | `test: 投稿機能のテストを追加` |
| `chore:` | ビルド・設定変更 | `chore: 依存パッケージを更新` |

### 例

```bash
# 良い例
git commit -m "feat: 画像投稿機能を実装"
git commit -m "fix: ログアウト後にリダイレクトされない問題を修正"
git commit -m "docs: ブランチ運用ルールを追加"

# 悪い例
git commit -m "update"
git commit -m "fix bug"
git commit -m "変更"
```

---

## マージのタイミング

### developからmainへのマージ条件

以下の条件をすべて満たした場合のみ、`main` ブランチにマージします。

- ✅ ローカルで `npm run dev` が正常に動作
- ✅ `npm run build` がエラーなく完了
- ✅ 主要機能の動作確認完了
- ✅ コンソールエラーがない
- ✅ TypeScriptエラーがない

---

## ブランチ保護ルール（推奨）

GitHubリポジトリで以下の保護ルールを設定することを推奨します。

### mainブランチ

- ✅ 直接プッシュを禁止
- ✅ プルリクエスト必須
- ✅ レビュー1件以上必須（チーム開発時）
- ✅ ステータスチェック必須（CI/CD設定時）

### developブランチ

- ✅ 直接プッシュ許可
- ❌ プルリクエスト不要（個人開発時）

---

## トラブルシューティング

### コンフリクトが発生した場合

```bash
# 1. 現在のブランチを確認
git branch

# 2. mainの最新を取得
git checkout main
git pull origin main

# 3. developにマージ
git checkout develop
git merge main

# 4. コンフリクトを解決
# （エディタでコンフリクト箇所を修正）

# 5. 解決後、コミット
git add .
git commit -m "merge: mainの変更をdevelopにマージ"
```

### 誤ってmainに直接コミットした場合

```bash
# 1. コミットを取り消し（ローカルのみ）
git reset --soft HEAD~1

# 2. developに切り替え
git checkout develop

# 3. 変更を再コミット
git add .
git commit -m "feat: 機能の説明"
git push origin develop
```

---

## チェックリスト

### コミット前

- [ ] `npm run dev` で動作確認
- [ ] コンソールエラーがないか確認
- [ ] TypeScriptエラーがないか確認
- [ ] コミットメッセージが規約に従っているか

### mainにマージ前

- [ ] `npm run build` が成功するか
- [ ] developで十分にテスト済みか
- [ ] ドキュメントを更新したか
- [ ] 破壊的変更がないか

---

## 参考リンク

- [Git Flow公式](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://docs.github.com/ja/get-started/quickstart/github-flow)

---

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2026-01-14 | 初版作成 |
