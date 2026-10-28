import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { accountError, readJson, requireAccount } from '@/lib/account-auth';
import {
  changePassword, fetchSettings, logoutEverywhere, resetApiKey, updateSettings,
} from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** GET /api/account/settings?key=… → current PrimeWire settings + API key + countries. */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const settings = await fetchSettings(ctx.session);
    return NextResponse.json({ settings });
  } catch (err) {
    return accountError(err);
  }
}

/**
 * POST /api/account/settings
 * { apiKey, action: update|password|reset-key|logout-everywhere, … }
 */
export async function POST(req: NextRequest) {
  const body = await readJson<{
    apiKey: string; action?: string;
    gender?: string; birthdayYear?: string; birthdayMonth?: string; birthdayDay?: string;
    countryId?: string; city?: string; bio?: string; hobbies?: string; pmMessage?: string;
    wallViewAccess?: string; wallPostAccess?: string;
    currentPassword?: string; newPassword?: string;
  }>(req);
  const ctx = await requireAccount(body.apiKey);
  if (ctx instanceof NextResponse) return ctx;
  try {
    switch (body.action) {
      case 'update': {
        await updateSettings(ctx.session, {
          gender: body.gender,
          birthdayYear: body.birthdayYear,
          birthdayMonth: body.birthdayMonth,
          birthdayDay: body.birthdayDay,
          countryId: body.countryId,
          city: (body.city ?? '').slice(0, 120),
          bio: (body.bio ?? '').slice(0, 4000),
          hobbies: (body.hobbies ?? '').slice(0, 2000),
          pmMessage: (body.pmMessage ?? '').slice(0, 2000),
          wallViewAccess: body.wallViewAccess,
          wallPostAccess: body.wallPostAccess,
        });
        return NextResponse.json({ ok: true });
      }
      case 'password': {
        const current = body.currentPassword ?? '';
        const next = body.newPassword ?? '';
        if (!current || next.length < 6) {
          return NextResponse.json({ error: 'Current and new password (min 6 chars) are required' }, { status: 400 });
        }
        await changePassword(ctx.session, current, next);
        return NextResponse.json({ ok: true });
      }
      case 'reset-key': {
        const newKey = await resetApiKey(ctx.session);
        if (newKey) {
          await db.profile.update({ where: { apiKey: ctx.profile.apiKey }, data: { pwApiKey: newKey } });
        }
        return NextResponse.json({ ok: true, apiKey: newKey });
      }
      case 'logout-everywhere': {
        await logoutEverywhere(ctx.session);
        // our stored session is now dead too
        await db.profile.update({ where: { apiKey: ctx.profile.apiKey }, data: { pwSession: null, pwApiKey: null } });
        return NextResponse.json({ ok: true, signedOut: true });
      }
      default:
        return NextResponse.json({ error: 'Unknown settings action' }, { status: 400 });
    }
  } catch (err) {
    return accountError(err);
  }
}
