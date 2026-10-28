import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireAccount } from '@/lib/account-auth';
import { exportLibraryCsv } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** GET /api/account/export-library?key=… → the user's PrimeWire library as CSV. */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const csv = await exportLibraryCsv(ctx.session);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="primewire-library.csv"',
      },
    });
  } catch (err) {
    return accountError(err);
  }
}
