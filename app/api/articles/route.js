import { pool } from "../../../lib/db";
import { ARTICLE_IMAGES_BUCKET, extractStoragePathsFromContent, filterPathsOwnedByUser } from "../../../lib/articleImageUtils";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

// Vercelでのビルドエラーを防ぐため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

const cleanupUnusedUploadedImages = async ({ content, uploadedImagePaths, userId }) => {
  if (!Array.isArray(uploadedImagePaths) || uploadedImagePaths.length === 0 || !userId) {
    return { deleted: 0, skipped: true };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { deleted: 0, skipped: true };
  }

  const usedPaths = new Set(filterPathsOwnedByUser(extractStoragePathsFromContent(content), userId));
  const uploadedOwnedPaths = filterPathsOwnedByUser(uploadedImagePaths, userId);
  const deleteTargets = uploadedOwnedPaths.filter((path) => !usedPaths.has(path));

  if (deleteTargets.length === 0) {
    return { deleted: 0, skipped: false };
  }

  const { error } = await supabaseAdmin.storage
    .from(ARTICLE_IMAGES_BUCKET)
    .remove(deleteTargets);

  if (error) {
    console.error('未使用画像の削除失敗:', error);
    return { deleted: 0, skipped: false, warning: '一部画像の削除に失敗しました。' };
  }

  return { deleted: deleteTargets.length, skipped: false };
};

export async function GET() {
  console.log('[DOC] GET /api/articles called');
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_exists: !!process.env.DATABASE_URL,
  });

  try {
    console.log('[DB] Attempting to connect to database...');
    const client = await pool.connect();
    console.log('[OK] Database connection successful');

    try {
      const result = await client.query(`
        SELECT 
          a.id, a.title, a.slug, a.excerpt, a.thumbnail_url, 
          a.likes_count, a.views_count, a.created_at, a.updated_at, a.status,
          u.username, u.display_name, u.avatar_url,
          ARRAY_AGG(
            json_build_object('id', t.id, 'name', t.name, 'color', t.color)
          ) FILTER (WHERE t.id IS NOT NULL) as tags
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN article_tags at ON a.id = at.article_id
        LEFT JOIN tags t ON at.tag_id = t.id
        WHERE a.published = true AND (a.status = 'published' OR a.status IS NULL)
        GROUP BY a.id, u.username, u.display_name, u.avatar_url
        ORDER BY a.updated_at DESC
      `);
      console.log('[OK] Query successful, rows:', result.rows.length);
      return Response.json({ articles: result.rows });
    } catch (error) {
      console.error("[ERR] 記事一覧取得エラー:", error);
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
    console.error("[ERR] データベース接続エラー:", connectionError);
    console.error("Connection error details:", {
      message: connectionError.message,
      code: connectionError.code,
      name: connectionError.name,
    });
    
    // 環境変数のチェック
    if (!process.env.DATABASE_URL) {
      console.error('[WARN] DATABASE_URL is not set!');
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
  console.log('[NOTE] POST /api/articles called');

  try {
    const body = await request.json();
    console.log('Request body:', { 
      title: body.title?.substring(0, 50),
      slug: body.slug,
      authorId: body.authorId,
      status: body.status,
      tags: body.tags
    });

    const { title, content, excerpt, thumbnailUrl, slug, authorId, status, tags, uploadedImagePaths } = body;

    if (!title || !content || !slug) {
      console.error('[ERR] Validation error: missing required fields');
      return Response.json(
        { error: "タイトル、本文、スラッグは必須です" },
        { status: 400 }
      );
    }

    console.log('[DB] Attempting to connect to database...');
    const client = await pool.connect();
    console.log('[OK] Database connection successful');

    try {
      // authorIdの処理：UUIDの場合はauth_uidで検索、INTEGERの場合はそのまま使用
      let userId;
      
      if (authorId) {
        // UUIDの形式かチェック（UUID v4形式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(authorId)) {
          // UUIDの場合：auth_uidで検索
          console.log('[SEARCH] Searching user by auth_uid (UUID):', authorId);
          const userResult = await client.query(
            'SELECT id FROM users WHERE auth_uid = $1',
            [authorId]
          );
          
          if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
            console.log('[OK] Found user by auth_uid:', userId);
          } else {
            // auth_uidが見つからない場合はエラー
            console.error('[ERR] User not found with auth_uid:', authorId);
            return Response.json(
              { 
                error: "ユーザー情報が登録されていません。ページをリロードしてから再度お試しください。",
                code: "USER_NOT_FOUND",
                details: "Supabase Authでログインしていますが、アプリケーションのusersテーブルに登録されていません。"
              },
              { status: 404 }
            );
          }
        } else {
          // INTEGERの場合：そのまま使用
          userId = parseInt(authorId, 10);
          console.log('[STAT] Using provided user ID (INTEGER):', userId);
        }
      } else {
        // authorIdが未指定の場合：デフォルトユーザー
        userId = 1;
        console.log('[STAT] No authorId provided, using default user (id=1)');
      }

      // ユーザーが存在するか確認
      const userCheck = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        console.error('[ERR] User not found:', userId);
        return Response.json(
          { error: "ユーザーが見つかりません。Supabaseでusersテーブルを確認してください。" },
          { status: 404 }
        );
      }

      console.log('[STAT] Inserting article...');
      // statusのデフォルト値は'published'、指定されていれば使用（draft or published）
      const articleStatus = status === 'draft' ? 'draft' : 'published';
      
      const result = await client.query(
        `INSERT INTO articles (title, content, excerpt, thumbnail_url, slug, author_id, published, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          title, 
          content, 
          excerpt || content.substring(0, 200), 
          thumbnailUrl, 
          slug, 
          userId,
          articleStatus === 'published', // publishedフラグ（後方互換性のため）
          articleStatus
        ]
      );

      const createdArticle = result.rows[0];
      console.log('[OK] Article created successfully:', createdArticle.id, 'status:', articleStatus);

      // タグを保存
      if (tags && Array.isArray(tags) && tags.length > 0) {
        console.log('[TAG] Saving tags:', tags);
        for (const tagId of tags) {
          await client.query(
            `INSERT INTO article_tags (article_id, tag_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [createdArticle.id, tagId]
          );
        }
        console.log('[OK] Tags saved successfully');
      }

      let imageCleanup = { deleted: 0, skipped: true };

      if (articleStatus === 'published') {
        imageCleanup = await cleanupUnusedUploadedImages({
          content,
          uploadedImagePaths,
          userId: authorId,
        });
      }

      return Response.json({ article: createdArticle, imageCleanup }, { status: 201 });
    } catch (error) {
      console.error("[ERR] 記事作成エラー:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
      });
      
      // スラッグの重複エラーをチェック
      if (error.code === '23505') {
        return Response.json(
          { error: "同じスラッグの記事が既に存在します" },
          { status: 409 }
        );
      }

      // 外部キー制約エラー（ユーザーが存在しない）
      if (error.code === '23503') {
        return Response.json(
          { error: "指定されたユーザーが存在しません" },
          { status: 400 }
        );
      }

      return Response.json(
        { 
          error: "記事の作成に失敗しました",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (connectionError) {
    console.error("[ERR] データベース接続エラー:", connectionError);
    console.error("Connection error details:", {
      message: connectionError.message,
      code: connectionError.code,
      name: connectionError.name,
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
