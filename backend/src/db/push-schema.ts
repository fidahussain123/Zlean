import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from project root (parent of backend/)
dotenv.config();
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set (e.g. in project root .env)');
}

const db = createClient({ url: url!, authToken: authToken! });

const SUPER_ADMIN_EMAIL = 'zlean314@gmail.com';
const SUPER_ADMIN_PASSWORD = 'NAELZ@123';

async function main() {
  const schemaPath = join(__dirname, '../../schema.sql');
  let schema = readFileSync(schemaPath, 'utf8');
  // Remove single-line comments so semicolons inside them don't break the split
  schema = schema.replace(/^--.*$/gm, '').trim();
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await db.execute({ sql: stmt + ';', args: [] });
      console.log('Executed:', stmt.slice(0, 50) + '...');
    } catch (e) {
      if (String(e).includes('already exists')) console.log('Skip (exists):', stmt.slice(0, 40));
      else throw e;
    }
  }

  const hash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
  await db.execute({
    sql: `INSERT OR IGNORE INTO users (id, name, email, role, password_hash, status)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['super_admin_1', 'Super Admin', SUPER_ADMIN_EMAIL, 'super_admin', hash, 'active'],
  });
  console.log('Seeded super_admin');
  console.log('Schema push done.');
}

main().catch(console.error);
