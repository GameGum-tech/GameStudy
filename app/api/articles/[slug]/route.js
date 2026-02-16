import { pool } from "../../../../lib/db";

// Vercelでのビルドエラーを防ぐため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const client = await pool.connect();

  try {
    // ビュー数を増加
    await client.query(
      "UPDATE articles SET views_count = views_count + 1 WHERE slug = $1",
      [params.slug]
    );

    const result = await client.query(`
      SELECT 
        a.*, 
        u.username, u.display_name, u.avatar_url, u.bio,
        ARRAY_AGG(
          json_build_object('id', t.id, 'name', t.name, 'color', t.color)
        ) FILTER (WHERE t.id IS NOT NULL) as tags
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE a.slug = $1 AND a.published = true
      GROUP BY a.id, u.username, u.display_name, u.avatar_url, u.bio
    `, [params.slug]);

    if (result.rows.length === 0) {
      return Response.json({ error: "記事が見つかりません" }, { status: 404 });
    }

    return Response.json({ article: result.rows[0] });
  } catch (error) {
    console.error("記事取得エラー:", error);
    return Response.json(
      { error: "記事の取得に失敗しました" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function PUT(request, { params }) {
  const client = await pool.connect();
  try {
    const { title, content, excerpt, thumbnailUrl } = await request.json();

    if (!title || !content) {
      return Response.json({ error: "タイトルと本文は必須です" }, { status: 400 });
    }

    const result = await client.query(
      `UPDATE articles 
       SET title = $1, content = $2, excerpt = $3, thumbnail_url = $4, updated_at = CURRENT_TIMESTAMP
       WHERE slug = $5
       RETURNING *`,
      [title, content, excerpt, thumbnailUrl, params.slug]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: "記事が見つかりません" }, { status: 404 });
    }

    return Response.json({ article: result.rows[0] });
  } catch (error) {
    console.error("記事更新エラー:", error);
    return Response.json({ error: "記事の更新に失敗しました" }, { status: 500 });
  } finally {
    client.release();
  }
}
