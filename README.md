# Wedding SNS (Project Name)

結婚式の写真共有とゲスト同士の交流を目的とした、招待制のWebアプリケーションです。

## 🚀 主な機能

### 1. タイムライン (Timeline)
- ゲストによるテキスト投稿機能
- リアルタイムでの投稿反映 (Supabase Realtime)
- 「いいね」機能

### 2. 写真共有 (Photos)
- Google Drive連携を採用
- アプリ内のタブから新郎新婦が用意したGoogle Drive共有フォルダへ直接遷移
- ゲストは自身のGoogleアカウント権限で、高画質な写真をアップロード/閲覧可能

### 3. ユーザー認証
- **Google OAuth 2.0** によるシングルサインオン (SSO)
- ログイン時にGoogleアカウントのプロフィール（名前・アイコン）を自動取得

## 🛠 技術スタック

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend:** Supabase
  - **Database:** PostgreSQL
  - **Auth:** Google OAuth
  - **Realtime:** WebSocket (DB変更監視)
- **Storage:** Google Drive (画像本体の保存先)

## 📂 データベース設計

### Tables

#### `profiles` (ユーザー情報)
- Googleログイン時に自動生成
- `id` (PK, FK -> auth.users)
- `username`
- `avatar_url`

#### `posts` (投稿)
- `id` (PK)
- `user_id` (FK -> profiles.id)
- `content` (テキスト)
- `parent_id` (返信機能用 / 自己参照FK)
- `created_at`

#### `likes` (いいね)
- `id` (PK)
- `user_id` (FK)
- `post_id` (FK)

### Views
- **`posts_with_counts`**: 投稿一覧取得用。プロフィール情報の結合、いいね数、返信数、自分のいいね状態を含んだ効率的なビュー。

## 💻 開発環境セットアップ

### 必須ツール
- Node.js
- Docker Desktop (ローカル検証用)
- VS Code

### 環境変数 (.env.local)
以下の変数を設定すること。
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_DRIVE_URL=
```