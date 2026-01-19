-- 返信機能のためのマイグレーション
-- 作成日: 2026-01-19

-- 1. postsテーブルにparent_idカラムを追加
ALTER TABLE posts
ADD COLUMN parent_id UUID REFERENCES posts(id) ON DELETE CASCADE;

-- 2. parent_idにインデックスを作成（パフォーマンス向上）
CREATE INDEX idx_posts_parent_id ON posts(parent_id);

-- 3. 既存のposts_with_countsビューを削除
DROP VIEW IF EXISTS posts_with_counts;

-- 4. 返信数を含む新しいビューを作成
CREATE VIEW posts_with_counts AS
SELECT 
  p.*,
  COUNT(DISTINCT l.id) as likes_count,
  COUNT(DISTINCT r.id) as replies_count,
  CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM likes 
      WHERE post_id = p.id 
      AND user_id = auth.uid()
    )
  END as is_liked
FROM posts p
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN posts r ON p.id = r.parent_id
GROUP BY p.id;

-- 5. RLSポリシーは既存のpostsテーブルのものが自動適用される
-- （parent_idはpostsテーブルの一部なので追加のポリシー不要）

COMMENT ON COLUMN posts.parent_id IS '返信先の投稿ID（NULL=通常投稿、値あり=返信）';
COMMENT ON INDEX idx_posts_parent_id IS '返信検索のパフォーマンス向上用インデックス';
