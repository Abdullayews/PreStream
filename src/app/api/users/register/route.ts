import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** API keys: 8–64 chars of [A-Za-z0-9_-]. */
const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;

function generateKey(): string {
  return `pw_${randomBytes(16).toString('hex')}`;
}

function toProfile(row: { apiKey: string; name: string | null; themeId: string; watchlist: string }) {
  let watchlist: unknown = [];
  try {
    watchlist = JSON.parse(row.watchlist || '[]');
  } catch {
    watchlist = [];
  }
  return { apiKey: row.apiKey, name: row.name, themeId: row.themeId, watchlist };
}

/**
 * POST /api/users/register
 * Body: { apiKey?: string, name?: string }
 * - With apiKey: logs the user in (returns their cached profile) or 404 if unknown.
 * - Without apiKey: generates a fresh key and creates a new profile.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      apiKey?: string;
      name?: string;
    };

    const key = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 40) : null;

    if (key) {
      if (!KEY_RE.test(key)) {
        return NextResponse.json(
          { error: 'API key must be 8–64 characters (letters, digits, - or _)' },
          { status: 400 },
        );
      }
      const existing = await db.profile.findUnique({ where: { apiKey: key } });
      if (existing) {
        // login — refresh the display name if provided
        if (name && name !== existing.name) {
          const updated = await db.profile.update({
            where: { apiKey: key },
            data: { name },
          });
          return NextResponse.json({ ...toProfile(updated), isNew: false });
        }
        return NextResponse.json({ ...toProfile(existing), isNew: false });
      }
      // unknown key → register a new profile with it
      const created = await db.profile.create({ data: { apiKey: key, name } });
      return NextResponse.json({ ...toProfile(created), isNew: true }, { status: 201 });
    }

    // no key provided → generate one
    const created = await db.profile.create({
      data: { apiKey: generateKey(), name },
    });
    return NextResponse.json({ ...toProfile(created), isNew: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
