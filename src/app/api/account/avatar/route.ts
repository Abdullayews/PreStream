import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireAccount } from '@/lib/account-auth';
import { authedUpload } from '@/lib/primewire/session';
import { fetchMe } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

/**
 * POST /api/account/avatar — multipart { apiKey, file }
 * Uploads a new profile picture to PrimeWire.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const key = String(form.get('apiKey') ?? '');
    const file = form.get('file');
    const ctx = await requireAccount(key);
    if (ctx instanceof NextResponse) return ctx;
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: 'Avatar must be under 4 MB' }, { status: 413 });
    }
    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, GIF or WebP images are allowed' }, { status: 415 });
    }
    const bytes = await file.arrayBuffer();
    await authedUpload(
      ctx.session,
      '/registrations',
      { bytes, filename: file.name || 'avatar.jpg', type: file.type || 'image/jpeg' },
      { 'registration[bla]': '' },
    );
    // refresh avatar reference (custom avatars live at /avatar/{hash}.jpg — a
    // cache-busted variant of the previous URL usually works)
    let avatar = ctx.profile.avatar;
    try {
      const me = await fetchMe(ctx.session);
      avatar = me.avatar ?? avatar;
    } catch {
      // keep previous
    }
    await db.profile.update({ where: { apiKey: ctx.profile.apiKey }, data: { avatar } });
    return NextResponse.json({ ok: true, avatar });
  } catch (err) {
    return accountError(err);
  }
}
