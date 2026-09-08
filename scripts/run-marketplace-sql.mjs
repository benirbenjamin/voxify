import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🚀 Connecting to Supabase Database via Pooler with Tenant ID...');

  const connectionStrings = [
    'postgresql://postgres.mdubljdeimlpntyzektn:1202%21birthDATE@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    'postgresql://postgres.mdubljdeimlpntyzektn:1202%21birthDATE@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
    'postgresql://postgres.mdubljdeimlpntyzektn:1202%21birthDATE@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ];

  let sql = null;
  for (const conn of connectionStrings) {
    try {
      console.log(`Testing ${conn.split('@')[1]}...`);
      const client = postgres(conn, { ssl: 'require', connect_timeout: 6 });
      await client`SELECT 1`;
      console.log(`✅ CONNECTED SUCCESSFULLY!`);
      sql = client;
      break;
    } catch (err) {
      console.log(`  ❌ Connection failed: ${err.message}`);
    }
  }

  if (!sql) {
    console.error('Could not connect to database pooler directly. Will also attempt fallback.');
    process.exit(1);
  }

  const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/00007_artist_marketplace_schema.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log('📦 Applying Artist & Marketplace Schema Migration 00007...');
  await sql.unsafe(sqlContent);
  console.log('🎉 ALL MARKETPLACE TABLES, GENRES, AND RLS POLICIES APPLIED SUCCESSFULLY!');

  await sql.end();
}

main();
