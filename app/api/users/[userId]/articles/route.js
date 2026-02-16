import { pool } from "../../../../../lib/db";

// Vercelでのビルドエラーを防ぐため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const userId = resolvedParams.userId;
  
  console.log('📄 GET /api/users/[userId]/articles called:', userId);

  try {
    const client = await pool.connect();

    try {
      // userIdがUUIDかINTEGERかを判定
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let articles;

      if (uuidRegex.test(userId)) {
        // UUIDの場合: auth_uidで検索
        console.log('🔍 Searching articles by auth_uid (UUID)');
        const result = await client.query(`
          SELECT 
            a.id, a.title, a.slug, a.excerpt, a.thumbnail_url, 
            a.likes_count, a.views_count, a.created_at, a.updated_at, a.status,
            u.username, u.display_name, u.avatar_url,
            ARRAY_AGG(
              json_build_object('id', t.id, 'name', t.name, 'color', t.color)
            ) FILTER (WHERE t.id IS NOT NULL) as tags
          FROM articles a
          INNER JOIN users u ON a.author_id = u.id
          LEFT JOIN article_tags at ON a.id = at.article_id
          LEFT JOIN tags t ON at.tag_id = t.id
          WHERE u.auth_uid = $1
          GROUP BY a.id, u.username, u.display_name, u.avatar_url
          ORDER BY a.updated_at DESC
        `, [userId]);
        articles = result.rows;
      } else {
        // INTEGERの場合: author_idで検索
        console.log('🔍 Searching articles by author_id (INTEGER)');
        const result = await client.query(`
          SELECT 
            a.id, a.title, a.slug, a.excerpt, a.thumbnail_url, 
            a.likes_count, a.views_count, a.created_at, a.updated_at, a.status,
            u.username, u.display_name, u.avatar_url,
            ARRAY_AGG(
              json_build_object('id', t.id, 'name', t.name, 'color', t.color)
            ) FILTER (WHERE t.id IS NOT NULL) as tags
          FROM articles a
          INNER JOIN users u ON a.author_id = u.id
          LEFT JOIN article_tags at ON a.id = at.article_id
          LEFT JOIN tags t ON at.tag_id = t.id
          WHERE a.author_id = $1
          GROUP BY a.id, u.username, u.display_name, u.avatar_url
          ORDER BY a.updated_at DESC
        `, [parseInt(userId, 10)]);
        articles = result.rows;
      }

      console.log('✅ Found articles:', articles.length);
      return Response.json({ articles });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ ユーザー記事取得エラー:", error);
    return Response.json(
      { error: "記事の取得に失敗しました" },
      { status: 500 }
    );
  }
}
