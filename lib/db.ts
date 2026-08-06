import 'server-only';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

// Los proveedores de Postgres en producción (Neon, Vercel Postgres, etc.)
// exigen SSL. La base local de pruebas (Docker) no lo tiene configurado.
const isLocalDb = /localhost|127\.0\.0\.1/.test(connectionString);

export const sql = postgres(connectionString, {
  ssl: isLocalDb ? false : 'require',
});