import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getMySQLPool(): mysql.Pool | null {
  if (pool) return pool;

  const url = process.env.DATABASE_URL;
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  // If no config provided, return null (fallback storage active)
  if (!url && !host) {
    return null;
  }

  try {
    if (url) {
      pool = mysql.createPool(url);
    } else {
      pool = mysql.createPool({
        host: host || 'localhost',
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: user || 'root',
        password: password || '',
        database: database || 'fourdisco',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }
    return pool;
  } catch (error) {
    console.error('Falha ao conectar com MySQL:', error);
    return null;
  }
}

export async function queryMySQL<T = unknown>(sql: string, params: any[] = []): Promise<T[] | null> {
  const p = getMySQLPool();
  if (!p) return null;
  try {
    const [rows] = await p.execute(sql, params);
    return rows as T[];
  } catch (error) {
    console.warn('MySQL Query Error (usando modo contingência):', error);
    return null;
  }
}
