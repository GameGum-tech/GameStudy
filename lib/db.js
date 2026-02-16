import { Pool } from "pg";

// DATABASE_URLが設定されている場合（Vercel等）はそれを使用
// そうでない場合は個別の環境変数を使用（Docker等）
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
    }
  : {
      host: process.env.PGHOST || 'db',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'user',
      password: process.env.PGPASSWORD || 'password',
      database: process.env.PGDATABASE || 'gamestudy',
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

// 接続エラーをハンドリング
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export { pool };
