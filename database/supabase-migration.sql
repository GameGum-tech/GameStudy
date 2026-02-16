-- ==========================================
-- Supabase用マイグレーションSQL
-- ==========================================
-- このSQLをSupabase SQL Editorで実行してください
-- Dashboard → SQL Editor → New Query

-- ユーザーテーブルの作成
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth_uid UUID UNIQUE,  -- Supabase AuthのユーザーIDを保存
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- タグテーブルの作成
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#5271ff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 記事テーブルの作成
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    thumbnail_url VARCHAR(500),
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 記事タグ関連テーブル
CREATE TABLE IF NOT EXISTS article_tags (
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- いいねテーブル
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, article_id)
);

-- ブックマークテーブル
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, article_id)
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(auth_uid);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
CREATE INDEX IF NOT EXISTS idx_article_tags_article_id ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_article_id ON likes(article_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article_id ON bookmarks(article_id);

-- サンプルユーザーの作成
INSERT INTO users (username, email, display_name, bio, avatar_url) VALUES 
('demo_user', 'demo@gamestu.dy', 'Demo User', 'デモユーザーです。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo_user')
ON CONFLICT (username) DO NOTHING;

-- サンプルタグの作成
INSERT INTO tags (name, color) VALUES 
('Roblox', '#FF6B35'),
('ゲーム開発', '#5271ff'),
('Lua', '#000080'),
('初心者', '#28a745'),
('チュートリアル', '#17a2b8'),
('Unity', '#000000'),
('Unreal Engine', '#0E1128')
ON CONFLICT (name) DO NOTHING;

-- サンプル記事の作成（オプション）
INSERT INTO articles (title, slug, content, excerpt, thumbnail_url, author_id) VALUES 
(
    'Robloxゲーム開発入門ガイド',
    'roblox-game-development-guide',
    '# Robloxゲーム開発入門ガイド

このガイドでは、Robloxでゲーム開発を始めるための基本的な手順を解説します。

## 必要なもの
- Roblox Studio（無料）
- Robloxアカウント
- やる気！

## 開始手順

1. Roblox Studioをダウンロード
2. 新しいプロジェクトを作成
3. 基本的なパーツを配置
4. Luaスクリプトを追加

詳しくは別の記事で解説します！',
    'Robloxでゲーム開発を始めるための入門ガイド。必要なツールと基本的な手順を解説します。',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop',
    (SELECT id FROM users WHERE username = 'demo_user' LIMIT 1)
)
ON CONFLICT (slug) DO NOTHING;

-- サンプル記事にタグを追加
INSERT INTO article_tags (article_id, tag_id) 
SELECT a.id, t.id FROM articles a, tags t 
WHERE a.slug = 'roblox-game-development-guide' 
AND t.name IN ('Roblox', 'ゲーム開発', '初心者', 'チュートリアル')
ON CONFLICT DO NOTHING;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'マイグレーション完了！テーブルが正常に作成されました。';
END $$;
