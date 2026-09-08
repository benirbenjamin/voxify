import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

const password = '1202!birthDATE';
const projRef = 'mdubljdeimlpntyzektn';

const poolerHosts = [
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-ca-central-1.pooler.supabase.com',
  'db.mdubljdeimlpntyzektn.supabase.co',
];

async function main() {
  const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/00007_artist_marketplace_schema.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log(`🚀 Executing migration 00007 against Supabase DB (${projRef})...`);
  let connected = false;

  for (const host of poolerHosts) {
    for (const port of [6543, 5432]) {
      for (const user of [`postgres.${projRef}`, 'postgres']) {
        console.log(`Testing ${host}:${port} as ${user}...`);
        const client = new Client({
          host,
          port,
          user,
          password,
          database: 'postgres',
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000,
        });

        try {
          await client.connect();
          console.log(`\n✅ CONNECTED SUCCESSFULLY TO SUPABASE via ${host}:${port}!`);
          console.log('📦 Executing SQL Migration 00007...');
          await client.query(sqlContent);
          console.log('🎉 ALL TABLES (artist_profiles, marketplace_songs, user_purchases, etc.), GENRES, AND RLS POLICIES APPLIED SUCCESSFULLY TO SUPABASE DATABASE!');
          await client.end();
          connected = true;
          break;
        } catch (err) {
          console.log(`  ❌ Failed (${host}:${port}): ${err.message}`);
          await client.end().catch(() => {});
        }
      }
      if (connected) break;
    }
    if (connected) break;
  }

  if (!connected) {
    console.error('❌ Could not connect to Supabase DB via any pooler host.');
    process.exit(1);
  }
}

main();
