import { NextRequest, NextResponse } from 'next/server';
import { getPlaylists } from '@/lib/primewire';
import { PrimeWireError } from '@/lib/primewire/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get('page') ?? '1';
    const page = Math.max(1, Math.min(50, parseInt(raw, 10) || 1));
    const data = await getPlaylists(page);
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof PrimeWireError ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Failed to load playlists';
    return NextResponse.json({ error: message }, { status });
  }
}
