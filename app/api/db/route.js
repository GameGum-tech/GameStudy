import { pool } from "../../../lib/db";

export async function GET() {
  const client = await pool.connect();

  try {
    const result = await client.query("SELECT 1 AS ok");
    return Response.json({ ok: true, db: result.rows[0].ok });
  } catch (error) {
    return Response.json(
      { ok: false, error: error.message || "db error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
