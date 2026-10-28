import { NextRequest, NextResponse } from 'next/server';
import { accountError, readJson, requireAccount } from '@/lib/account-auth';
import { updateLibraryItem } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

const STATUSES = new Set(['watched', 'in-progress', 'plan-to-watch', 'on-hold', 'dropped']);

/**
 * POST /api/account/library-item
 * { apiKey, showId, library?, status? ("" clears), favorite?, schedule? }
 * → { library, status, favorite, schedule } (new PrimeWire state)
 */
export async function POST(req: NextRequest) {
  const body = await readJson<{
    apiKey: string; showId: number; library?: boolean; status?: string | null; favorite?: boolean; schedule?: boolean;
  }>(req);
  const ctx = await requireAccount(body.apiKey);
  if (ctx instanceof NextResponse) return ctx;
  try {
    const showId = Number(body.showId);
    if (!Number.isFinite(showId) || showId <= 0) {
      return NextResponse.json({ error: 'Invalid show id' }, { status: 400 });
    }
    const update: Parameters<typeof updateLibraryItem>[2] = {};
    if (body.library !== undefined) update.library = Boolean(body.library);
    if (body.status !== undefined) {
      const s = (body.status ?? '').trim();
      update.status = s && STATUSES.has(s) ? s : null;
    }
    if (body.favorite !== undefined) update.favorite = Boolean(body.favorite);
    if (body.schedule !== undefined) update.schedule = Boolean(body.schedule);
    const state = await updateLibraryItem(ctx.session, showId, update);
    return NextResponse.json(state);
  } catch (err) {
    return accountError(err);
  }
}
