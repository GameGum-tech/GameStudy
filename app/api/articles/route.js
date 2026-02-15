import { pool } from "../../../lib/db";

export async function GET() {
  const client = await pool.connect();

  try {
    const result = await client.query(
      "SELECT id, title, slug, created_at, updated_at FROM articles ORDER BY updated_at DESC"
    );
    return Response.json({ articles: result.rows });
  } catch (error) {
    console.error("記事一覧取得エラー:", error);
    return Response.json(
      { error: "記事の取得に失敗しました" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function POST(request) {
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { title, slug, content } = body;

    if (!title || !slug || !content) {
      return Response.json(
        { error: "タイトル、スラッグ、コンテンツは必須です" },
        { status: 400 }
      );
    }

    const result = await client.query(
      "INSERT INTO articles (title, slug, content) VALUES ($1, $2, $3) RETURNING *",
      [title, slug, content]
    );

    return Response.json({ article: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("記事作成エラー:", error);
    if (error.code === "23505") {
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