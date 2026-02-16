import { pool } from "../../../lib/db";

// Vercelでのビルドエラーを防ぐため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await pool.connect();

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
      return Response.json({ articles: result.rows });
    } catch (error) {
      console.error("記事一覧取得エラー:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
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
    console.error("データベース接続エラー:", connectionError);
    console.error("Connection error details:", {
      message: connectionError.message,
      code: connectionError.code,
    });
    return Response.json(
      { 
        error: "データベースに接続できません",
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
