import { pool } from "../../../lib/db";

export const dynamic = 'force-dynamic';

// タグ一覧を取得（記事数付き）
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          t.id, 
          t.name, 
          t.color, 
          t.created_at,
          COUNT(at.article_id) as article_count
        FROM tags t
        LEFT JOIN article_tags at ON t.id = at.tag_id
        GROUP BY t.id, t.name, t.color, t.created_at
        ORDER BY article_count DESC, t.name ASC
      `);
      return Response.json({ tags: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ タグ取得エラー:", error);
    return Response.json(
      { error: "タグの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 新しいタグを作成
export async function POST(request) {
  try {
    const { name, color } = await request.json();

    if (!name) {
      return Response.json(
        { error: "タグ名は必須です" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // 重複チェック（大文字小文字を区別しない）
      const existingTag = await client.query(
        `SELECT id, name, color FROM tags WHERE LOWER(name) = LOWER($1)`,
        [name]
      );

      if (existingTag.rows.length > 0) {
        // 既存のタグを返す
        return Response.json({ tag: existingTag.rows[0] }, { status: 200 });
      }

      // 新規作成
      const result = await client.query(
        `INSERT INTO tags (name, color)
         VALUES ($1, $2)
         RETURNING *`,
        [name, color || '#5271ff']
      );

      return Response.json({ tag: result.rows[0] }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ タグ作成エラー:", error);
    return Response.json(
      { error: "タグの作成に失敗しました" },
      { status: 500 }
    );
  }
}
