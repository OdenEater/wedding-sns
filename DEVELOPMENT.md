# 開発ガイド (Development Guide)

このプロジェクト「Wedding SNS」の開発環境セットアップと起動方法の手引きです。

## 1. 前提条件 (Prerequisites)

開発を始める前に、以下のツールがインストールされていることを確認してください。

- **Node.js**: v20以上推奨
- **Git**: バージョン管理用

※ 本プロジェクトでは、開発効率化のためローカルDB(Docker)は使用せず、クラウド上のSupabase本番環境に直接接続して開発を行います。

## 2. セットアップ (Setup)

プロジェクトをクローンした後、依存パッケージをインストールします。

```bash
npm install
```

## 3. 環境変数の設定 (Environment Variables)

プロジェクトルートに `.env.local` ファイルを作成し、Supabase本番環境のキーを設定します。
キー情報は [Supabase Dashboard](https://supabase.com/dashboard) の `Project Settings > API` から取得できます。

**`.env.local` の例:**

```env
# Supabase API Keys (本番環境)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Drive Folder URL (任意)
NEXT_PUBLIC_GOOGLE_DRIVE_URL=https://drive.google.com/...
```

## 4. 開発サーバーの起動 (Start Development Server)

開発を始める際は、以下の手順でサーバーを起動します。

### Next.js (フロントエンド) の起動

ターミナルで以下のコマンドを実行します。

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスすると、アプリが表示されます。
データベースはクラウド上の本番環境に接続されます。

## 5. 開発終了時

開発を終了する際は、ターミナルで `Ctrl + C` を押してNext.jsサーバーを停止します。

## 6. その他便利なコマンド

- **Lintチェック**: `npm run lint`
- **型定義の生成**: `npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts` (要ログイン: `npx supabase login`)

## 7.本番環境

- **vercel**: `https://wedding-rj81pnzn4-odeneaters-projects.vercel.app/login`
- **statusチェックコマンド**: `npx vercel list`