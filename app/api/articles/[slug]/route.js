import { pool } from "../../../../lib/db";

export async function GET(request, { params }) {
  const client = await pool.connect();

  try {
    const result = await client.query(
      "SELECT * FROM articles WHERE slug = $1",
      [params.slug]
    );

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
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return Response.json(
        { error: "タイトルとコンテンツは必須です" },
        { status: 400 }
      );
    }

    const result = await client.query(
      "UPDATE articles SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE slug = $3 RETURNING *",
      [title, content, params.slug]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: "記事が見つかりません" }, { status: 404 });
    }

    return Response.json({ article: result.rows[0] });
  } catch (error) {
    console.error("記事更新エラー:", error);
    return Response.json(
      { error: "記事の更新に失敗しました" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}