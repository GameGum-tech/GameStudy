import { pool } from "../../../lib/db";

// Vercelでのビルドエラーを防ぐため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

// ユーザー情報取得（GETのみ）
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const auth_uid = searchParams.get('auth_uid');
  const email = searchParams.get('email');

  if (!auth_uid && !email) {
    return Response.json(
      { error: "auth_uid or email is required" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  
  try {
    let query, params;
    
    if (auth_uid) {
      query = 'SELECT id, auth_uid, username, email, display_name, avatar_url, created_at FROM users WHERE auth_uid = $1';
      params = [auth_uid];
    } else {
      query = 'SELECT id, auth_uid, username, email, display_name, avatar_url, created_at FROM users WHERE email = $1';
      params = [email];
    }

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return Response.json(
      { user: result.rows[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    return Response.json(
      { 
        error: "Failed to fetch user",
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ユーザー作成（POSTのみ）
export async function POST(request) {
  const client = await pool.connect();
  
  try {
    const body = await request.json();
    const { auth_uid, email, username, display_name, avatar_url } = body;

    console.log('👤 Creating user:', { auth_uid, email, username });

    if (!auth_uid || !email) {
      return Response.json(
        { error: "auth_uid and email are required" },
        { status: 400 }
      );
    }

    // 既にauth_uidが存在するか確認
    const existingUser = await client.query(
      'SELECT id, auth_uid, username, email FROM users WHERE auth_uid = $1',
      [auth_uid]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ User already exists:', existingUser.rows[0]);
      return Response.json(
        { 
          message: "User already exists",
          user: existingUser.rows[0]
        },
        { status: 200 }
      );
    }

    // usernameの生成（重複チェック付き）
    let finalUsername = username || `user_${auth_uid.substring(0, 8)}`;
    const usernameCheck = await client.query(
      'SELECT username FROM users WHERE username = $1',
      [finalUsername]
    );

    if (usernameCheck.rows.length > 0) {
      // 重複している場合はタイムスタンプを追加
      finalUsername = `${finalUsername}_${Date.now()}`;
      console.log('⚠️ Username conflict, using:', finalUsername);
    }

    // 新しいユーザーを作成
    const result = await client.query(
      `INSERT INTO users (auth_uid, username, email, display_name, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, auth_uid, username, email, display_name, avatar_url, created_at`,
      [
        auth_uid,
        finalUsername,
        email,
        display_name || finalUsername,
        avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth_uid}`
      ]
    );

    console.log('✅ User created successfully:', result.rows[0]);

    return Response.json(
      {
        message: "User created successfully",
        user: result.rows[0]
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return Response.json(
      { 
        error: "Failed to create user",
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
