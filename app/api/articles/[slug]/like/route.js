import { pool } from "../../../../../lib/db";

// Vercelでのビルドエラーを防ぐため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const resolvedParams = await params;
  
  console.log('[DOC] POST /api/articles/[slug]/like called:', resolvedParams.slug);

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

      // 既にいいねしているかチェック
      const existingLike = await client.query(
        'SELECT id FROM likes WHERE user_id = $1 AND article_id = $2',
        [userId, articleId]
      );

      let liked;
      if (existingLike.rows.length > 0) {
        // いいねを削除（トグル）
        await client.query(
          'DELETE FROM likes WHERE user_id = $1 AND article_id = $2',
          [userId, articleId]
        );
        
        // いいね数をデクリメント
        await client.query(
          'UPDATE articles SET likes_count = likes_count - 1 WHERE id = $1',
          [articleId]
        );
        
        liked = false;
      } else {
        // いいねを追加
        await client.query(
          'INSERT INTO likes (user_id, article_id) VALUES ($1, $2)',
          [userId, articleId]
        );
        
        // いいね数をインクリメント
        await client.query(
          'UPDATE articles SET likes_count = likes_count + 1 WHERE id = $1',
          [articleId]
        );
        
        liked = true;
      }

      // 更新されたいいね数を取得
      const updatedArticle = await client.query(
        'SELECT likes_count FROM articles WHERE id = $1',
        [articleId]
      );

      return Response.json({
        liked,
        likesCount: updatedArticle.rows[0].likes_count
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[ERR] いいね処理エラー:", error);
    return Response.json(
      { error: "いいね処理に失敗しました" },
      { status: 500 }
    );
  }
}
