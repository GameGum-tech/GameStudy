-- ==========================================
-- 既存のusersテーブルにauth_uidカラムを追加
-- ==========================================
-- このSQLをSupabase SQL Editorで実行してください
-- すでにusersテーブルが存在する場合に使用します

-- auth_uidカラムを追加（既に存在する場合はスキップ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'auth_uid'
    ) THEN
        ALTER TABLE users ADD COLUMN auth_uid UUID UNIQUE;
        RAISE NOTICE 'auth_uidカラムを追加しました';
    ELSE
        RAISE NOTICE 'auth_uidカラムは既に存在します';
    END IF;
END $$;

-- auth_uidのインデックスを作成
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(auth_uid);

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '✅ auth_uidカラムの追加が完了しました';
END $$;
