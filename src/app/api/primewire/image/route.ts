import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Poster image proxy.
 * GET /api/primewire/image?path=<path>&size=w500
 *  - TMDB:   path=/t/p/w200/abc.jpg   (size rewrites the size segment)
 *  - TVMaze: path=/uploads/images/.../abc.jpg (size ignored)
 * Only these two hosts are allowed (PrimeWire uses both for posters).
 */
const ALLOWED_SIZES = new Set(['w200', 'w300', 'w400', 'w500', 'w780', 'w1280', 'original']);
const TMDB_PATH_RE = /^\/t\/p\/(w200|w300|w400|w500|w780|w1280|original)\/([A-Za-z0-9_-]+)\.(jpg|jpeg|png|webp|svg|gif)$/i;
const TVMAZE_PATH_RE = /^\/uploads\/images\/[a-z_]+\/\d+\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i;
/** PrimeWire avatars: /avatar/noavatar.jpg or /avatar/{5-char token}.jpg */
const AVATAR_PATH_RE = /^\/avatar\/(noavatar|[A-Za-z0-9_-]{3,20})\.(jpg|jpeg|png|webp|gif)$/i;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rawPath = sp.get('path') ?? '';
  const size = sp.get('size');

  let upstreamUrl: string | null = null;

  if (TMDB_PATH_RE.test(rawPath)) {
    let path = rawPath;
    if (size && ALLOWED_SIZES.has(size)) {
      path = rawPath.replace(/^\/t\/p\/[a-z0-9]+/i, `/t/p/${size}`);
    }
    upstreamUrl = `https://image.tmdb.org${path}`;
  } else if (TVMAZE_PATH_RE.test(rawPath)) {
    upstreamUrl = `https://static.tvmaze.com${rawPath}`;
  } else if (AVATAR_PATH_RE.test(rawPath)) {
    // cache-bust: PrimeWire keeps the same URL when the avatar changes
    const bust = sp.get('v');
    upstreamUrl = `https://primewire.pw${rawPath}${bust ? `?v=${encodeURIComponent(bust)}` : ''}`;
  }

  if (!upstreamUrl) {
    return NextResponse.json({ error: 'invalid image path' }, { status: 400 });
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { 'User-Agent': UA, Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' },
      cache: 'no-store',
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'image not found' }, { status: 404 });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
        // Posters are movie data — never cached anywhere.
        'Cache-Control': 'no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'image fetch failed' }, { status: 502 });
  }
}
