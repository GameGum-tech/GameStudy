import { pool } from "../../../../../lib/db";

// Vercelでのビルドエラーを防ぐため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const resolvedParams = await params;
  
  console.log('[DOC] POST /api/articles/[slug]/bookmark called:', resolvedParams.slug);

  try {
    const { userId } = await request.json();

    if (!userId) {
      return Response.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // 記事IDを取得
      const articleResult = await client.query(
        'SELECT id FROM articles WHERE slug = $1',
        [resolvedParams.slug]
      );

      if (articleResult.rows.length === 0) {
        return Response.json(
          { error: "記事が見つかりません" },
          { status: 404 }
        );
      }

      const articleId = articleResult.rows[0].id;

      // 既にブックマークしているかチェック
      const existingBookmark = await client.query(
        'SELECT id FROM bookmarks WHERE user_id = $1 AND article_id = $2',
        [userId, articleId]
      );

      let bookmarked;
      if (existingBookmark.rows.length > 0) {
        // ブックマークを削除（トグル）
        await client.query(
          'DELETE FROM bookmarks WHERE user_id = $1 AND article_id = $2',
          [userId, articleId]
        );
        bookmarked = false;
      } else {
        // ブックマークを追加
        await client.query(
          'INSERT INTO bookmarks (user_id, article_id) VALUES ($1, $2)',
          [userId, articleId]
        );
        bookmarked = true;
      }

      return Response.json({ bookmarked });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[ERR] ブックマーク処理エラー:", error);
    return Response.json(
      { error: "ブックマーク処理に失敗しました" },
      { status: 500 }
    );
  }
}
