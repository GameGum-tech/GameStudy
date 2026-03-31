import { pool } from "../../../../lib/db";
import { ARTICLE_IMAGES_BUCKET, extractStoragePathsFromContent, filterPathsOwnedByUser } from "../../../../lib/articleImageUtils";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

// Vercelでのビルドエラーを防ぐため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

const cleanupUnusedImagesForPublish = async ({ previousContent, nextContent, uploadedImagePaths, userId }) => {
  if (!userId) {
    return { deleted: 0, skipped: true };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { deleted: 0, skipped: true };
  }

  const previousOwnedPaths = filterPathsOwnedByUser(extractStoragePathsFromContent(previousContent), userId);
  const nextOwnedPathSet = new Set(filterPathsOwnedByUser(extractStoragePathsFromContent(nextContent), userId));
  const removedFromMarkdown = previousOwnedPaths.filter((path) => !nextOwnedPathSet.has(path));
  const uploadedButUnused = filterPathsOwnedByUser(uploadedImagePaths || [], userId).filter(
    (path) => !nextOwnedPathSet.has(path)
  );

  const deleteTargets = [...new Set([...removedFromMarkdown, ...uploadedButUnused])];

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

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const client = await pool.connect();

  try {
    // クエリパラメータで下書きも含めるかどうかを判定
    const { searchParams } = new URL(request.url);
    const includeDrafts = searchParams.get('includeDrafts') === 'true';

    // ビュー数を増加（公開済み記事のみ）
    if (!includeDrafts) {
      await client.query(
        "UPDATE articles SET views_count = views_count + 1 WHERE slug = $1 AND published = true",
        [resolvedParams.slug]
      );
    }

    // 下書きも含める場合はpublishedチェックを外す
    const publishedFilter = includeDrafts ? '' : 'AND a.published = true';

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
      WHERE a.slug = $1 ${publishedFilter}
      GROUP BY a.id, u.username, u.display_name, u.avatar_url, u.bio
    `, [resolvedParams.slug]);

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
  const resolvedParams = await params;
  
  console.log('[NOTE] PUT /api/articles/[slug] called:', resolvedParams.slug);

  try {
    const body = await request.json();
    const { title, content, excerpt, thumbnailUrl, authorId, status, tags, uploadedImagePaths } = body;

    console.log('Request body:', { 
      title: title?.substring(0, 50),
      authorId,
      status,
      tags
    });

    if (!title || !content) {
      return Response.json({ error: "タイトルと本文は必須です" }, { status: 400 });
    }

    if (!authorId) {
      return Response.json({ error: "認証が必要です" }, { status: 401 });
    }

    const client = await pool.connect();

    try {
      // 記事の現在の作成者を確認
      const articleCheck = await client.query(
        'SELECT a.id, a.author_id, a.content, a.status, u.auth_uid FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE a.slug = $1',
        [resolvedParams.slug]
      );

      if (articleCheck.rows.length === 0) {
        return Response.json({ error: "記事が見つかりません" }, { status: 404 });
      }

      const article = articleCheck.rows[0];
      console.log('[STAT] Article author_id:', article.author_id, 'auth_uid:', article.auth_uid);

      // authorIdがUUIDの場合とINTEGERの場合で権限チェック
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let isAuthor = false;

      if (uuidRegex.test(authorId)) {
        // UUIDの場合: auth_uidと比較
        isAuthor = article.auth_uid === authorId;
        console.log('[SEARCH] Checking UUID authorization:', { provided: authorId, expected: article.auth_uid, match: isAuthor });
      } else {
        // INTEGERの場合: author_idと比較
        isAuthor = article.author_id === parseInt(authorId, 10);
        console.log('[SEARCH] Checking INTEGER authorization:', { provided: authorId, expected: article.author_id, match: isAuthor });
      }

      if (!isAuthor) {
        console.error('[ERR] Unauthorized: User is not the author');
        return Response.json(
          { error: "この記事を編集する権限がありません" },
          { status: 403 }
        );
      }

      // 記事を更新
      const articleStatus = status === 'draft' ? 'draft' : (status === 'published' ? 'published' : undefined);
      
      let updateQuery, updateParams;
      
      if (articleStatus !== undefined) {
        // statusが指定されている場合
        updateQuery = `UPDATE articles 
         SET title = $1, content = $2, excerpt = $3, thumbnail_url = $4, status = $5, published = $6, updated_at = CURRENT_TIMESTAMP
         WHERE slug = $7
         RETURNING *`;
        updateParams = [title, content, excerpt, thumbnailUrl, articleStatus, articleStatus === 'published', resolvedParams.slug];
        console.log('[NOTE] Updating article with status:', articleStatus);
      } else {
        // statusが指定されていない場合（既存の動作を維持）
        updateQuery = `UPDATE articles 
         SET title = $1, content = $2, excerpt = $3, thumbnail_url = $4, updated_at = CURRENT_TIMESTAMP
         WHERE slug = $5
         RETURNING *`;
        updateParams = [title, content, excerpt, thumbnailUrl, resolvedParams.slug];
      }
      
      const result = await client.query(updateQuery, updateParams);
      const updatedArticle = result.rows[0];

      // タグを更新
      if (tags !== undefined) {
        console.log('[TAG] Updating tags:', tags);
        
        // 既存のタグを削除
        await client.query(
          'DELETE FROM article_tags WHERE article_id = $1',
          [article.id]
        );
        
        // 新しいタグを追加
        if (Array.isArray(tags) && tags.length > 0) {
          for (const tagId of tags) {
            await client.query(
              `INSERT INTO article_tags (article_id, tag_id)
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [article.id, tagId]
            );
          }
        }
        console.log('[OK] Tags updated successfully');
      }

      const finalStatus = articleStatus !== undefined ? articleStatus : (updatedArticle.status || article.status);
      let imageCleanup = { deleted: 0, skipped: true };

      if (finalStatus === 'published') {
        imageCleanup = await cleanupUnusedImagesForPublish({
          previousContent: article.content,
          nextContent: content,
          uploadedImagePaths,
          userId: article.auth_uid,
        });
      }

      console.log('[OK] Article updated successfully');
      return Response.json({ article: updatedArticle, imageCleanup });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[ERR] 記事更新エラー:", error);
    return Response.json({ error: "記事の更新に失敗しました" }, { status: 500 });
  }
}
