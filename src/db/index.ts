import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const isProd = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';
    const dbName = (isProd ? process.env.SQL_DB_NAME_PROD : process.env.SQL_DB_NAME_DEV) || process.env.SQL_DB_NAME;

    console.log(`[PostgreSQL] Inicializando conexión para entorno: ${isProd ? 'PRODUCCIÓN' : 'DESARROLLO'} (Base: ${dbName})`);

    const poolConfig: any = {
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: dbName,
      max: isProd ? 20 : 10,
      connectionTimeoutMillis: 15000,
    };

    if (process.env.DATABASE_URL) {
      poolConfig.connectionString = process.env.DATABASE_URL;
    }

    if (process.env.SQL_SSL === 'true' || (isProd && process.env.SQL_HOST && !process.env.SQL_HOST.includes('localhost'))) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
export { pool };
