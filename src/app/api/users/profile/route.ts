import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AUTO_THEME_ID, canonicalThemeId } from '@/themes/registry';

export const dynamic = 'force-dynamic';

const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;
/** Max serialized watchlist size (JSON string) */
const MAX_WATCHLIST_BYTES = 32 * 1024;

function toProfile(row: { apiKey: string; name: string | null; themeId: string; watchlist: string }) {
  let watchlist: unknown = [];
  try {
    watchlist = JSON.parse(row.watchlist || '[]');
  } catch {
    watchlist = [];
  }
  return { apiKey: row.apiKey, name: row.name, themeId: row.themeId, watchlist };
}

/** GET /api/users/profile?key=… → the cached profile for that API key. */
export async function GET(req: NextRequest) {
  const key = (req.nextUrl.searchParams.get('key') ?? '').trim();
  if (!KEY_RE.test(key)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
  }
  const row = await db.profile.findUnique({ where: { apiKey: key } });
  if (!row) return NextResponse.json({ error: 'Unknown API key' }, { status: 404 });
  return NextResponse.json(toProfile(row));
}

/**
 * PATCH /api/users/profile
 * Body: { apiKey, name?, themeId?, watchlist? } — partial update, all cached per user.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      apiKey?: string;
      name?: string | null;
      themeId?: string;
      watchlist?: unknown;
    } | null;

    if (!body?.apiKey || !KEY_RE.test(body.apiKey)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
    }
    const existing = await db.profile.findUnique({ where: { apiKey: body.apiKey } });
    if (!existing) return NextResponse.json({ error: 'Unknown API key' }, { status: 404 });

    const data: { name?: string | null; themeId?: string; watchlist?: string } = {};

    if (body.name !== undefined) {
      data.name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 40) : null;
    }
    if (body.themeId !== undefined) {
      const canonical = canonicalThemeId(body.themeId);
      if (!canonical) {
        return NextResponse.json(
          { error: `Unknown theme "${body.themeId}"` },
          { status: 400 },
        );
      }
      // store the CANONICAL id — legacy ids are migrated once on first save
      data.themeId = canonical;
    }
    if (body.watchlist !== undefined) {
      // accept the item array directly (preferred) or a pre-encoded JSON string
      const raw =
        typeof body.watchlist === 'string' ? body.watchlist : JSON.stringify(body.watchlist ?? []);
      if (raw.length > MAX_WATCHLIST_BYTES) {
        return NextResponse.json({ error: 'Watchlist too large' }, { status: 413 });
      }
      // validate it is a JSON array before storing
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length > 100) {
          return NextResponse.json(
            { error: 'Watchlist must be an array of at most 100 items' },
            { status: 400 },
          );
        }
        data.watchlist = raw;
      } catch {
        return NextResponse.json({ error: 'Watchlist must be valid JSON' }, { status: 400 });
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(toProfile(existing));
    }

    const updated = await db.profile.update({ where: { apiKey: body.apiKey }, data });
    return NextResponse.json(toProfile(updated));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Profile update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/users/profile?key=… → forget this profile's cached settings. */
export async function DELETE(req: NextRequest) {
  const key = (req.nextUrl.searchParams.get('key') ?? '').trim();
  if (!KEY_RE.test(key)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
  }
  await db.profile.deleteMany({ where: { apiKey: key } });
  return NextResponse.json({ ok: true, defaultTheme: AUTO_THEME_ID });
}
