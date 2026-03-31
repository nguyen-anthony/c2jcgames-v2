import { Pool } from "pg";

// Singleton pool instance to avoid exhausting connections in serverless environments
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export const db = {
  query: (text: string, params?: unknown[]) => getPool().query(text, params),
};
