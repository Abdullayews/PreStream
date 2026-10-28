import { NextResponse } from 'next/server';
import { getSchedule } from '@/lib/primewire';
import { PrimeWireError } from '@/lib/primewire/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getSchedule();
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof PrimeWireError ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Failed to load schedule';
    return NextResponse.json({ error: message }, { status });
  }
}
