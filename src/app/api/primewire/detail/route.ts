import { NextRequest, NextResponse } from 'next/server';
import { getDetail } from '@/lib/primewire';
import { PrimeWireError } from '@/lib/primewire/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type');
    const idRaw = req.nextUrl.searchParams.get('id');
    const slug = req.nextUrl.searchParams.get('slug') ?? '';

    if (type !== 'movie' && type !== 'tv') {
      return NextResponse.json({ error: 'type must be movie or tv' }, { status: 400 });
    }
    const id = parseInt(idRaw ?? '', 10);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    }

    const data = await getDetail(type, id, slug.slice(0, 200));
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof PrimeWireError ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Failed to load detail';
    return NextResponse.json({ error: message }, { status });
  }
}
