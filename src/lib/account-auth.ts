/**
 * Account route helpers — resolve our API key → Profile + PrimeWire session.
 */
import { randomBytes } from 'crypto';
import type { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SessionExpiredError } from '@/lib/primewire/session';

export const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function generateApiKey(): string {
  return `ps_${randomBytes(16).toString('hex')}`;
}

export interface AccountRow {
  id: string;
  apiKey: string;
  username: string | null;
  pwUserId: number | null;
  pwSession: string | null;
  pwApiKey: string | null;
  avatar: string | null;
  themeId: string;
  watchlist: string;
}

export interface AccountContext {
  profile: AccountRow;
  session: string;
}

/**
 * Resolve a request's API key to a profile with a live PrimeWire session.
 * Returns a NextResponse (error) when the key is invalid or there is no
 * PrimeWire session — callers should return it directly.
 */
export async function requireAccount(
  key: string | null | undefined,
): Promise<AccountContext | NextResponse> {
  const { NextResponse: NR } = await import('next/server');
  const k = (key ?? '').trim();
  if (!KEY_RE.test(k)) {
    return NR.json({ error: 'Invalid API key', code: 'bad-key' }, { status: 400 });
  }
  const row = await db.profile.findUnique({ where: { apiKey: k } });
  if (!row) {
    return NR.json({ error: 'Unknown API key — sign in again', code: 'unknown-key' }, { status: 401 });
  }
  if (!row.pwSession) {
    return NR.json(
      { error: 'Not signed in to PrimeWire', code: 'no-session' },
      { status: 401 },
    );
  }
  return { profile: row as unknown as AccountRow, session: row.pwSession };
}

/** Map account-service errors to clean JSON responses. */
export async function accountError(err: unknown): Promise<NextResponse> {
  const { NextResponse: NR } = await import('next/server');
  if (err instanceof SessionExpiredError) {
    return NR.json(
      { error: 'Your PrimeWire session expired — sign in again', code: 'session-expired' },
      { status: 401 },
    );
  }
  const message = err instanceof Error ? err.message : 'PrimeWire request failed';
  const status = /not found/i.test(message) ? 404 : 502;
  return NR.json({ error: message }, { status });
}

/** Small JSON parse helper for request bodies. */
export async function readJson<T extends Record<string, unknown>>(req: Request): Promise<Partial<T>> {
  try {
    const body = await req.json();
    return (body ?? {}) as Partial<T>;
  } catch {
    return {};
  }
}
