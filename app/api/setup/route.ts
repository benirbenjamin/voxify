import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

export async function POST() {
  try {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!dbUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_URL environment variable is missing. Please add DATABASE_URL=postgres://... in your .env or Vercel settings.',
        },
        { status: 400 }
      );
    }

    const sql = postgres(dbUrl, { ssl: 'require' });

    const migrationFiles = [
      'supabase/migrations/00001_initial_schema.sql',
      'supabase/migrations/00002_rls_policies.sql',
      'supabase/migrations/00003_storage_buckets.sql',
      'supabase/migrations/00004_announcement_comments_reactions.sql',
      'supabase/seed.sql',
    ];

    const results: string[] = [];

    for (const relPath of migrationFiles) {
      const fullPath = path.join(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const sqlContent = fs.readFileSync(fullPath, 'utf8');
        await sql.unsafe(sqlContent);
        results.push(`Executed: ${relPath}`);
      }
    }

    await sql.end();

    return NextResponse.json({
      success: true,
      message: 'All Supabase database tables, Row Level Security policies, storage buckets, announcement comments/reactions, and initial SaaS plans created successfully!',
      details: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize database.',
      },
      { status: 500 }
    );
  }
}
