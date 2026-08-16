import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSql();
    const result = await sql`select version() as v`;
    return NextResponse.json({ ok: true, version: result[0]?.v ?? 'unknown' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ ok: false, error: msg, stack }, { status: 500 });
  }
}