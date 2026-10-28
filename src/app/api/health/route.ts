import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health — lightweight liveness probe.
 * No DB access, no external calls, no-store: safe to hit once per minute
 * (the keep-alive self-ping in src/instrumentation.ts) and cheap enough
 * to double as a PaaS health-check path.
 */
export function GET() {
  return NextResponse.json(
    { ok: true, uptimeSec: Math.round(process.uptime()) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
