import { Pool } from "pg";

// デバッグ用ログ
console.log('🔍 Database Configuration Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('- DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);

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

console.log('📊 Pool Config:', {
  useDATABASE_URL: !!process.env.DATABASE_URL,
  ssl: poolConfig.ssl ? 'enabled' : 'disabled',
  host: poolConfig.host || 'connection string',
});

const pool = new Pool(poolConfig);

// 接続エラーをハンドリング
pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// 接続テスト
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

export { pool };
