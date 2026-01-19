# マイグレーションの本番反映手順

> 作成日: 2026年1月19日

## 📋 概要

Supabaseのマイグレーションファイルを本番環境に反映する方法を解説します。

---

## 🔷 方法A: Supabase Dashboard（推奨）

最も簡単で安全な方法です。

### 手順

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にアクセス
   - プロジェクト `fgwwqglaaappyaziudgl` を選択

2. **SQL Editorを開く**
   - 左メニューから「SQL Editor」をクリック
   - または、「Database」→「SQL Editor」

3. **マイグレーションSQLを貼り付け**
   - `+ New query` をクリック
   - `supabase/migrations/20260119141917_add_replies.sql` の内容をコピペ

4. **実行**
   - 右下の「Run」ボタンをクリック
   - 成功メッセージが表示されればOK ✅

5. **確認**
   - 左メニューから「Table Editor」→「posts」を開く
   - `parent_id` カラムが追加されているか確認
   - 「Views」から `posts_with_counts` を開く
   - `replies_count` カラムが追加されているか確認

---

## 🔶 方法B: Supabase CLI（上級者向け）

ローカル開発環境とSupabaseを完全に同期したい場合に使用します。

### 前提条件

```powershell
# Supabase CLIがインストールされていない場合
npm install -g supabase

# ログイン
supabase login
```

### 手順

```powershell
# 1. プロジェクトディレクトリに移動
cd c:\Users\KattaMiyamoto\Desktop\work\sns\wedding-sns

# 2. Supabaseプロジェクトとリンク
supabase link --project-ref fgwwqglaaappyaziudgl

# 3. マイグレーションを本番環境にプッシュ
supabase db push

# 4. 確認
supabase db diff
```

### ⚠️ 注意点

- **本番データが変更される**ため、慎重に実行
- ロールバックが難しいため、事前にバックアップ推奨
- 初回は`supabase link`で認証情報を入力する必要あり

---

## 🎯 どちらを選ぶ？

| 項目 | 方法A (Dashboard) | 方法B (CLI) |
|------|-------------------|-------------|
| **難易度** | ⭐ 簡単 | ⭐⭐⭐ 難しい |
| **セットアップ** | 不要 | CLI インストール必要 |
| **安全性** | ⭐⭐⭐ 高い | ⭐⭐ 中 |
| **確認しやすさ** | ⭐⭐⭐ GUIで確認 | ⭐ コマンドのみ |
| **推奨ケース** | 小規模プロジェクト | 大規模プロジェクト |

**このプロジェクトでは方法A（Dashboard）を推奨します。**

---

## ✅ 反映後の確認チェックリスト

- [ ] `posts` テーブルに `parent_id` カラムが追加されている
- [ ] `posts_with_counts` ビューに `replies_count` カラムが追加されている
- [ ] 既存の投稿データが消えていない
- [ ] `likes_count`, `is_liked` が正常に動作している

---

## 🆘 トラブルシューティング

### エラー: "relation posts_with_counts already exists"

**原因**: ビューが既に存在している

**解決策**:
```sql
-- 既存のビューを強制削除してから再作成
DROP VIEW IF EXISTS posts_with_counts CASCADE;
-- その後、マイグレーションファイルの残りを実行
```

### エラー: "column parent_id already exists"

**原因**: カラムが既に存在している

**解決策**:
```sql
-- parent_idの追加部分をスキップして、
-- ビューの再作成のみ実行
```

---

## 📚 参考リンク

- [Supabase SQL Editor](https://supabase.com/docs/guides/database/sql-editor)
- [Supabase CLI ドキュメント](https://supabase.com/docs/guides/cli)
- [PostgreSQL マイグレーション](https://www.postgresql.org/docs/current/ddl-alter.html)
