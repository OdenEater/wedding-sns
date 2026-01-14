## 1. システム概要

### 1.1 システム名
Wedding SNS

### 1.2 システムの目的
結婚式のゲストが短文投稿（140文字）を行い、他ゲストの投稿を閲覧・いいね・写真共有できるSNS機能を提供する。

### 1.3 想定ユーザー
- 結婚式のゲスト（ログイン必須）
- 新郎新婦

### 1.4 開発環境
- フロント：Next.js 16 (App Router) + React 19 + TypeScript
- スタイリング：Tailwind CSS 4
- バックエンド：Supabase（Auth / DB / Storage / Edge Functions）  
- デプロイ：Vercel + Supabase Hosting

### 1.5 デザインコンセプト
- **カラーパレット**: 花束のラナンキュラスのような温かいオレンジ系
  - Primary: Orange-500 (#f97316)
  - Secondary: Orange-50 (#fff7ed)
  - Background: 真っ白より少し温かみのある白 (#ffffff)
  - Foreground: Stone-900 (#1c1917)
  - Border: Stone-200 (#e7e5e4)
- **フォント**: 
  - Sans: Geist Sans
  - Mono: Geist Mono
  - ※デザインプロポーザルでは Bodoni Moda (英語) + Shippori Mincho (日本語) を使用
- **UIスタイル**: 温かみのある、親しみやすいデザイン


---

## 2. 画面設計

### 2.1 画面一覧
- Login画面  
- Timeline（投稿一覧）画面  
- Post作成画面  
- プロフィール画面（必要に応じて）

### 2.2 画面詳細

#### 2.2.1 Login画面
- メール/パスワード入力  
- Loginボタン  
- SignUpリンク  
- エラー表示エリア  

#### 2.2.2 Timeline画面
- 投稿一覧表示  
  - 投稿者名  
  - 本文  
  - 投稿日時  
  - いいね数  
  - いいねボタン  
- 投稿作成欄（140文字フォーム）  
- ログアウトボタン

#### 2.2.3 Post作成画面
- 本文入力（140文字制限）  
- 投稿ボタン


---

## 3. 機能要件

### 3.1 認証機能
- メール+パスワードでアカウント作成
- メール+パスワードでログイン
- Google OAuth（ソーシャルログイン）
- ログアウト  
- ログイン状態の保持（Supabase Auth）
- 認証コールバック処理（/auth/callback）  

### 3.2 投稿機能
- テキスト投稿（140文字）  
- 作成日時の自動付与  

### 3.3 投稿一覧表示
- 最新順で取得  
- 投稿者名表示  

### 3.4 いいね機能
- 1ユーザー1回まで  
- いいね済み状態の表示  
- いいね数カウント表示  


---

## 4. 非機能要件

### 4.1 パフォーマンス
- 投稿一覧取得は最大50件  
- レスポンス1秒以内（ローカル想定）

### 4.2 セキュリティ
- Supabase Authを利用  
- RLS（Row Level Security）によるアクセス制御  
  - 自分の投稿のみ編集・削除可能  
  - 自分のいいねのみ削除可能

### 4.3 可用性
- Supabase標準の可用性に依存

### 4.4 保守性
- Reactのコンポーネントはページ単位で管理  
- Supabase Client をAPI層として利用する  


---

## 5. テーブル設計（DB設計）

### 5.1 posts テーブル
| カラム名 | 型 | NotNull | 説明 |
|---------|----|---------|------|
| id | uuid | ○ | 主キー |
| user_id | uuid | ○ | 投稿者（auth.users.id） |
| content | text | ○ | 本文（140文字） |
| created_at | timestamptz | ○ | 自動付与 |

**RLSポリシー**
- SELECT → 認証済み・匿名ユーザー（`authenticated`, `anon`）
- INSERT → ログインユーザーのみ（`authenticated`）
- UPDATE/DELETE → user_id が自分のもののみ  

**備考**
- 返信機能（parent_id）は現在未実装（拡張機能として計画中）


### 5.2 likes テーブル
| カラム名 | 型 | NotNull | 説明 |
|---------|------|---------|------|
| id | uuid | ○ | 主キー |
| post_id | uuid | ○ | posts.id |
| user_id | uuid | ○ | auth.users.id |
| created_at | timestamptz | ○ | 自動付与 |

**RLSポリシー**
- SELECT → 認証済み・匿名ユーザー（`authenticated`, `anon`）
- INSERT → ログインユーザーのみ（`authenticated`）
- DELETE → user_id が自分のもののみ  

**備考**
- リアルタイム更新が有効化されている（`supabase_realtime` publication）


### 5.3 profiles テーブル
| カラム名 | 型 | NotNull | 説明 |
|---------|------|---------|------|
| id | uuid | ○ | 主キー（auth.users.id） |
| username | text | - | ユーザー名 |
| avatar_url | text | - | アバター画像URL |
| updated_at | timestamptz | ○ | 更新日時（デフォルト: now()） |

**RLSポリシー**
- SELECT → 全ユーザー
- INSERT/UPDATE → 自分のプロフィールのみ


### 5.4 posts_with_counts ビュー
投稿といいね数を結合したビュー

**カラム**
- id, user_id, content, created_at (posts テーブルから)
- username, avatar_url (profiles テーブルから)
- likes_count: いいね数
- is_liked_by_me: 現在のユーザーがいいね済みか

**備考**
- 返信数（replies_count）は現在含まれていない（将来の拡張機能）  


---

## 6. API仕様（Supabase使用前提）

### 6.1 投稿一覧取得
- Method: GET  
- Path: /posts?order=created_at.desc  
- 認証: 必須  

### 6.2 投稿作成
- Method: POST  
- Body: { content }  
- 認証: 必須  

### 6.3 いいね追加
- Method: POST  
- Body: { post_id }  
- 認証: 必須  

### 6.4 いいね解除
- Method: DELETE  
- Path: /likes?id={like_id}  
- 認証: 必須  


---

## 7. 画面遷移図

```
[Login] → (成功) → [Timeline (ホーム)]
[Timeline] → [フローティング+ボタン] → [Post作成 (/post/new)] → (投稿成功) → [Timeline]
[Timeline] → [ギャラリータブ] → (実装予定)
```

**認証ルール:**
- `/login`: 未認証のみ
- `/`: 全員閲覧可能（投稿・いいねは認証必須）
- `/post/new`: 認証必須（未認証は `/login` にリダイレクト）



---

## 8. コンポーネント構成（Next.js App Router）

```
wedding-sns/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # トップページ（Timeline）
│   ├── globals.css        # グローバルスタイル
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts   # 認証コールバック
│   ├── login/
│   │   ├── page.tsx       # ログインページ
│   │   └── content.json   # ログインページコンテンツ
│   └── post/
│       └── new/
│           └── page.tsx   # 新規投稿ページ
├── components/            # 再利用可能なコンポーネント
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── types/                 # TypeScript型定義
│   └── supabase.ts       # Supabase生成型
├── utils/                 # ユーティリティ
│   └── supabase/
│       └── client.ts     # Supabaseクライアント
├── public/               # 静的ファイル
│   └── images/
│       └── honeymoon/
└── design_proposals/     # デザインプロトタイプ（HTML）
```

**設計方針**
- Next.js App Router を使用（pages/ ディレクトリは使用しない）
- Server Components と Client Components を適切に使い分け
- カスタムフックは必要に応じて作成（hooks/ ディレクトリ）  


---

## 9. 拡張機能案（上から順に優先度が高い）
1. **画像投稿** - Supabase Storage連携
2. **返信機能** - posts.parent_id カラム追加、ツリー表示
3. **プロフィールページ** - ユーザー詳細・投稿履歴
4. **検索** - 投稿内容の全文検索
5. **通知** - いいね・返信の通知機能
6. **Google Drive 連携** - 写真ギャラリーからGoogle Driveへ直接遷移

**実装済み機能**
- ✅ リアルタイム更新（posts, likes テーブルで有効化済み）
- ✅ Google OAuth 認証
- ✅ メール/パスワード認証


---

## 10. 開発コマンド

### 🔴 重要: プロジェクトディレクトリについて
**必ずプロジェクトルートディレクトリで実行してください**

- **プロジェクトルート**: `c:\Users\KattaMiyamoto\Desktop\work\sns\wedding-sns`
- **ワークスペースルート**: `c:\Users\KattaMiyamoto\Desktop\work\sns`

ターミナルを開いた際の初期ディレクトリは `c:\Users\KattaMiyamoto\Desktop\work\sns` ですが、
npm コマンドは `wedding-sns` ディレクトリ内で実行する必要があります。

**コマンド実行前に必ずディレクトリを確認・移動してください:**
```powershell
# 現在のディレクトリを確認
pwd

# プロジェクトルートに移動
cd c:\Users\KattaMiyamoto\Desktop\work\sns\wedding-sns

# または相対パスで移動（ワークスペースルートにいる場合）
cd wedding-sns
```

### 10.1 ローカル開発
```bash
# 開発サーバー起動（wedding-sns ディレクトリで実行）
npm run dev

# 同一Wi-Fi上のデバイスからアクセス可能にする
npm run dev -- --hostname 0.0.0.0
# または
next dev --hostname 0.0.0.0
```

**アクセスURL**
- ローカル: http://localhost:3000
- 同一ネットワーク: http://192.168.x.x:3000 (実際のIPアドレスに置き換え)

### 10.2 ビルド・起動
```bash
# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# Lint実行
npm run lint
```

### 10.3 ファイアウォール設定（Windows）
同一Wi-Fiからのアクセスを許可する場合:
```powershell
# 管理者権限でPowerShellを開いて実行
netsh advfirewall firewall add rule name="Next.js Dev Server" dir=in action=allow protocol=TCP localport=3000
```


---

## 11. コーディング規約

### 11.1 TypeScript
- 型定義を明示的に行う（`any` は原則禁止）
- Supabase生成型（`types/supabase.ts`）を活用
- 関数の戻り値の型を明示

### 11.2 React/Next.js
- 関数コンポーネントを使用（クラスコンポーネント禁止）
- Server Components と Client Components を適切に使い分け
  - `"use client"` は必要な場所のみに記述
- カスタムフックで状態管理ロジックを分離

### 11.3 Tailwind CSS
- ユーティリティクラスを優先
- カスタムCSSは `globals.css` に最小限
- レスポンシブデザイン必須（mobile-first）
  - `sm:`, `md:`, `lg:` などのブレークポイントを活用
- カラーは CSS変数を使用
  - `bg-primary`, `text-foreground` など

### 11.4 命名規則
- コンポーネント: PascalCase (`PostItem.tsx`)
- 関数・変数: camelCase (`getUserPosts`)
- 定数: UPPER_SNAKE_CASE (`MAX_POST_LENGTH`)
- ファイル名: kebab-case または PascalCase

### 11.5 アクセシビリティ
- セマンティックHTMLを使用（`<button>`, `<nav>`, `<main>` など）
- ARIA属性を適切に設定
- キーボードナビゲーションをサポート
- 画像には必ず `alt` 属性を設定
