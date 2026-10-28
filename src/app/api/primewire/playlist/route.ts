import { NextRequest, NextResponse } from 'next/server';
import { getPlaylistDetail } from '@/lib/primewire';
import { PrimeWireError } from '@/lib/primewire/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const idRaw = sp.get('id') ?? '';
    if (!/^\d+$/.test(idRaw)) {
      return NextResponse.json({ error: 'Invalid playlist id' }, { status: 400 });
    }
    const slug = (sp.get('slug') ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 120);
    const data = await getPlaylistDetail(parseInt(idRaw, 10), slug);
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof PrimeWireError ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Failed to load playlist';
    return NextResponse.json({ error: message }, { status });
  }
}
