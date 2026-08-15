import { NextRequest, NextResponse } from 'next/server';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, {
    status: 200,
    ...init,
  });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}