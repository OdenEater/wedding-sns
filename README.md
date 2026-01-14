# Wedding SNS (Project Name)

結婚式の写真共有とゲスト同士の交流を目的とした、招待制のWebアプリケーションです。

## 🚀 主な機能

### 1. タイムライン (Timeline)
- ✅ ゲストによるテキスト投稿機能（140文字制限）
- ✅ 投稿一覧表示（最新50件）
- ✅ いいね機能（トグル、楽観的UI更新）
- ✅ 未認証ユーザーも閲覧可能（投稿・いいねは認証必須）
- ⏳ リアルタイムでの投稿反映 (Supabase Realtime) - 実装予定

### 2. 投稿機能
- ✅ フローティング新規投稿ボタン（認証済みのみ表示）
- ✅ 専用の新規投稿ページ (`/post/new`)
- ✅ 投稿後は自動的にタイムラインに遷移
- ⏳ 画像投稿 - 実装予定
- ⏳ 返信機能 - 実装予定

### 3. 写真共有 (Photos)
- ⏳ Google Drive連携を採用（実装予定）
- ⏳ アプリ内のタブから新郎新婦が用意したGoogle Drive共有フォルダへ直接遷移
- ⏳ ゲストは自身のGoogleアカウント権限で、高画質な写真をアップロード/閲覧可能

### 4. ユーザー認証
- ✅ **Google OAuth 2.0** によるシングルサインオン (SSO)
- ✅ ゲストログイン（メール/パスワード）
- ✅ ログアウト機能
- ✅ ログイン時にGoogleアカウントのプロフィール（名前・アイコン）を自動取得

## 🛠 技術スタック

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend:** Supabase
  - **Database:** PostgreSQL
  - **Auth:** Google OAuth + Email/Password
  - **Realtime:** WebSocket (DB変更監視) - 実装予定
  - **Storage:** Supabase Storage - 実装予定
- **Deployment:** Vercel
- **Icons:** Lucide React

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
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_GOOGLE_DRIVE_URL=https://drive.google.com/... (オプション)
```

### 開発サーバーの起動
```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス。

### ビルド・デプロイ
```bash
npm run build  # 本番ビルド
npm run deploy # Vercelにデプロイ
```

## 🌐 本番環境

- **URL**: https://wedding-sns.vercel.app
- **デプロイ**: GitHubにプッシュすると自動デプロイ

## 📊 プロジェクト進捗

- **Phase 1 (認証・基本機能)**: 100% 完了 ✅
- **Phase 2 (投稿機能)**: 100% 完了 ✅
- **Phase 3 (画像・ギャラリー)**: 0% 実装予定 ⏳
- **Phase 4 (拡張機能)**: 0% 実装予定 ⏳

詳細は [ROADMAP.md](ROADMAP.md) を参照してください。