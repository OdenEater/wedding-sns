-- セットリスト機能のためのマイグレーション
-- 作成日: 2026-01-21

-- 1. setlistテーブルを作成
CREATE TABLE setlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_num INTEGER NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  scene TEXT NOT NULL,
  comment TEXT,
  is_public BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. order_numにインデックスを作成（並び順検索のパフォーマンス向上）
CREATE INDEX idx_setlist_order_num ON setlist(order_num);

-- 3. updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_setlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. updated_at自動更新トリガー
CREATE TRIGGER trigger_setlist_updated_at
  BEFORE UPDATE ON setlist
  FOR EACH ROW
  EXECUTE FUNCTION update_setlist_updated_at();

-- 5. RLS (Row Level Security) を有効化
ALTER TABLE setlist ENABLE ROW LEVEL SECURITY;

-- 6. RLSポリシー: 誰でも閲覧可能
CREATE POLICY "setlist_select_policy" ON setlist
  FOR SELECT
  USING (true);

-- 7. RLSポリシー: 認証済みユーザーのみ更新可能
-- （アプリ側で管理者チェックを行う）
CREATE POLICY "setlist_update_policy" ON setlist
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 8. RLSポリシー: 認証済みユーザーのみ挿入可能
CREATE POLICY "setlist_insert_policy" ON setlist
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 9. RLSポリシー: 認証済みユーザーのみ削除可能
CREATE POLICY "setlist_delete_policy" ON setlist
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 10. Realtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE setlist;

-- コメント
COMMENT ON TABLE setlist IS '結婚式のセットリスト（BGM一覧）';
COMMENT ON COLUMN setlist.order_num IS '曲順';
COMMENT ON COLUMN setlist.title IS '曲名';
COMMENT ON COLUMN setlist.artist IS 'アーティスト名';
COMMENT ON COLUMN setlist.scene IS 'シーン（入場、乾杯など）';
COMMENT ON COLUMN setlist.comment IS '短いコメント';
COMMENT ON COLUMN setlist.is_public IS '公開フラグ（true=ゲストに曲情報を表示）';
