import { NextRequest, NextResponse } from 'next/server';
import { checkHostHealth } from '@/lib/primewire/hosts';

export const dynamic = 'force-dynamic';

/**
 * GET /api/primewire/hosts?hosts=Voe,Dood,Filemoon
 *
 * Health check for the video hosts behind a title's source list:
 *  - ready    — domain alive and its player pages allow framing
 *  - external — alive, but sends X-Frame-Options / restrictive
 *               frame-ancestors, so it can never play inside the embedded
 *               player (offer "open in new tab" instead)
 *  - dead     — canonical domain unreachable
 *  - unknown  — host not in PrimeWire's approved-hosts registry
 *
 * Results are probed in parallel. Stable verdicts (ready/external) are
 * cached server-side for 10 minutes; failure verdicts (dead/unknown) only
 * for one minute, so a transient host hiccup can't label a healthy host
 * "Offline" for long.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('hosts') ?? '';
  const hosts = raw
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 20);

  if (hosts.length === 0) {
    return NextResponse.json({ hosts: [] });
  }

  const results = await checkHostHealth(hosts);
  return NextResponse.json({ hosts: results });
}
