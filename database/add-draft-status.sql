-- articlesテーブルにstatusカラムを追加
-- 'draft' = 下書き, 'published' = 公開済み

-- statusカラムを追加（存在しない場合）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'status'
    ) THEN
        ALTER TABLE articles 
        ADD COLUMN status VARCHAR(20) DEFAULT 'published' NOT NULL;
        
        -- インデックスを追加（検索パフォーマンス向上）
        CREATE INDEX idx_articles_status ON articles(status);
        
        RAISE NOTICE '✅ statusカラムとインデックスを追加しました';
    ELSE
        RAISE NOTICE '⚠️ statusカラムは既に存在します';
    END IF;
END $$;

-- 既存のすべての記事を'published'にする
UPDATE articles SET status = 'published' WHERE status IS NULL;

COMMENT ON COLUMN articles.status IS '記事のステータス: draft（下書き）, published（公開済み）';
