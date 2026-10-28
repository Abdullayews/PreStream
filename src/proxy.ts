import { NextResponse, type NextRequest } from "next/server";

/**
 * HTTP cache-header policy.
 *
 * POLICY: movie/catalog data must NEVER be cached —
 * not in the browser, not in a shared proxy/CDN, not on the server.
 *
 *  - /api/account/* and /api/users/* are USER-SCOPED: `private, no-store`.
 *  - /api/primewire/* is movie/catalog data: `no-store, must-revalidate` —
 *    no layer may reuse a response; every view scrapes PrimeWire live.
 *  - /api/primewire/image (movie posters) is movie data too — same
 *    no-store policy, enforced here AND at the route for clarity.
 *
 * (Renamed middleware.ts → proxy.ts per the Next.js 16 convention;
 * see https://nextjs.org/docs/messages/middleware-to-proxy.)
 */
export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  if (path.startsWith("/api/account") || path.startsWith("/api/users")) {
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("Vary", "Accept-Encoding");
  } else if (path.startsWith("/api/primewire")) {
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    res.headers.set("Vary", "Accept-Encoding");
  }
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
