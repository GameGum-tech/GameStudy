import { pool } from "../../../lib/db";

// Vercelでのビルドエラーを防ぐため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('📄 GET /api/articles called');
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_exists: !!process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Attempting to connect to database...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');

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
      console.log('✅ Query successful, rows:', result.rows.length);
      return Response.json({ articles: result.rows });
    } catch (error) {
      console.error("❌ 記事一覧取得エラー:", error);
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
    console.error("❌ データベース接続エラー:", connectionError);
    console.error("Connection error details:", {
      message: connectionError.message,
      code: connectionError.code,
      name: connectionError.name,
    });
    
    // 環境変数のチェック
    if (!process.env.DATABASE_URL) {
      console.error('⚠️ DATABASE_URL is not set!');
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
  console.log('📝 POST /api/articles called');

  try {
    const body = await request.json();
    console.log('Request body:', { 
      title: body.title?.substring(0, 50),
      slug: body.slug,
      authorId: body.authorId 
    });

    const { title, content, excerpt, thumbnailUrl, slug, authorId } = body;

    if (!title || !content || !slug) {
      console.error('❌ Validation error: missing required fields');
      return Response.json(
        { error: "タイトル、本文、スラッグは必須です" },
        { status: 400 }
      );
    }

    console.log('🔌 Attempting to connect to database...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');

    try {
      // authorIdの処理：UUIDの場合はauth_uidで検索、INTEGERの場合はそのまま使用
      let userId;
      
      if (authorId) {
        // UUIDの形式かチェック（UUID v4形式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(authorId)) {
          // UUIDの場合：auth_uidで検索
          console.log('🔍 Searching user by auth_uid (UUID):', authorId);
          const userResult = await client.query(
            'SELECT id FROM users WHERE auth_uid = $1',
            [authorId]
          );
          
          if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
            console.log('✅ Found user by auth_uid:', userId);
          } else {
            // auth_uidが見つからない場合、新しいユーザーを自動作成
            console.log('🆕 Creating new user with auth_uid:', authorId);
            
            // リクエストボディから追加のユーザー情報を取得（存在する場合）
            const username = body.username || `user_${authorId.substring(0, 8)}`;
            const email = body.email || `${authorId}@temp.local`;
            const displayName = body.displayName || username;
            const avatarUrl = body.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorId}`;
            
            const newUserResult = await client.query(
              `INSERT INTO users (auth_uid, username, email, display_name, avatar_url)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (auth_uid) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
               RETURNING id`,
              [authorId, username, email, displayName, avatarUrl]
            );
            
            userId = newUserResult.rows[0].id;
            console.log('✅ New user created with id:', userId);
          }
        } else {
          // INTEGERの場合：そのまま使用
          userId = parseInt(authorId, 10);
          console.log('📊 Using provided user ID (INTEGER):', userId);
        }
      } else {
        // authorIdが未指定の場合：デフォルトユーザー
        userId = 1;
        console.log('📊 No authorId provided, using default user (id=1)');
      }

      // ユーザーが存在するか確認
      const userCheck = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        console.error('❌ User not found:', userId);
        return Response.json(
          { error: "ユーザーが見つかりません。Supabaseでusersテーブルを確認してください。" },
          { status: 404 }
        );
      }

      console.log('📊 Inserting article...');
      const result = await client.query(
        `INSERT INTO articles (title, content, excerpt, thumbnail_url, slug, author_id, published)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING *`,
        [title, content, excerpt || content.substring(0, 200), thumbnailUrl, slug, userId]
      );

      console.log('✅ Article created successfully:', result.rows[0].id);
      return Response.json({ article: result.rows[0] }, { status: 201 });
    } catch (error) {
      console.error("❌ 記事作成エラー:", error);
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
    console.error("❌ データベース接続エラー:", connectionError);
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
