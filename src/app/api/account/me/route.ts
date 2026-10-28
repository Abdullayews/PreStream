import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accountError, requireAccount } from '@/lib/account-auth';
import { fetchMe } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** GET /api/account/me?key=… → live PrimeWire identity + unread counts. */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const me = await fetchMe(ctx.session);
    // opportunistically refresh cached avatar
    if (me.avatar && me.avatar !== ctx.profile.avatar) {
      await db.profile.update({ where: { apiKey: ctx.profile.apiKey }, data: { avatar: me.avatar } });
    }
    return NextResponse.json({
      user: {
        username: me.username,
        userId: me.userId,
        avatar: me.avatar,
        pwApiKey: ctx.profile.pwApiKey,
        gender: me.gender,
        from: me.from,
        joined: me.joined,
        lastActive: me.lastActive,
        online: me.online,
        profileViews: me.profileViews,
        kudos: me.kudos,
        about: me.about,
        hobbies: me.hobbies,
        sourceUrl: me.sourceUrl,
      },
      sidebar: me.sidebar,
    });
  } catch (err) {
    return accountError(err);
  }
}
