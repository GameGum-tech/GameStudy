import { pool } from "../../../lib/db";

// Vercelでのビルドエラーを防ぐため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('📄 GET /api/articles called');
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_exists: !!process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Attempting to connect to database...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');

    try {
      const result = await client.query(`
        SELECT 
          a.id, a.title, a.slug, a.excerpt, a.thumbnail_url, 
          a.likes_count, a.views_count, a.created_at, a.updated_at,
          u.username, u.display_name, u.avatar_url,
          ARRAY_AGG(
            json_build_object('id', t.id, 'name', t.name, 'color', t.color)
          ) FILTER (WHERE t.id IS NOT NULL) as tags
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN article_tags at ON a.id = at.article_id
        LEFT JOIN tags t ON at.tag_id = t.id
        WHERE a.published = true
        GROUP BY a.id, u.username, u.display_name, u.avatar_url
        ORDER BY a.updated_at DESC
      `);
      console.log('✅ Query successful, rows:', result.rows.length);
      return Response.json({ articles: result.rows });
    } catch (error) {
      console.error("❌ 記事一覧取得エラー:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
      });
      return Response.json(
        { 
          error: "記事の取得に失敗しました",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (connectionError) {
    console.error("❌ データベース接続エラー:", connectionError);
    console.error("Connection error details:", {
      message: connectionError.message,
      code: connectionError.code,
      name: connectionError.name,
    });
    
    // 環境変数のチェック
    if (!process.env.DATABASE_URL) {
      console.error('⚠️ DATABASE_URL is not set!');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PG')));
    }
    
    return Response.json(
      { 
        error: "データベースに接続できません",
        hint: !process.env.DATABASE_URL ? "DATABASE_URL環境変数が設定されていません" : undefined,
        details: process.env.NODE_ENV === 'development' ? connectionError.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const client = await pool.connect();

  try {
    const { title, content, excerpt, thumbnailUrl, slug, authorId } = await request.json();

    if (!title || !content || !slug) {
      return Response.json(
        { error: "タイトル、本文、スラッグは必須です" },
        { status: 400 }
      );
    }

    // デフォルトのユーザーID（認証実装後は実際のユーザーIDを使用）
    const userId = authorId || 1;

    const result = await client.query(
      `INSERT INTO articles (title, content, excerpt, thumbnail_url, slug, author_id, published)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [title, content, excerpt || content.substring(0, 200), thumbnailUrl, slug, userId]
    );

    return Response.json({ article: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("記事作成エラー:", error);
    
    // スラッグの重複エラーをチェック
    if (error.code === '23505') {
      return Response.json(
        { error: "同じスラッグの記事が既に存在します" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "記事の作成に失敗しました" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
