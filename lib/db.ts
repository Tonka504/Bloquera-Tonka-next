import 'server-only';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

// La BD local (Docker) no tiene SSL; producción sí lo requiere.
const isLocal =
  connectionString.includes('localhost') ||
  connectionString.includes('127.0.0.1');

export const sql = postgres(connectionString, {
  ssl: isLocal ? false : 'require',
});