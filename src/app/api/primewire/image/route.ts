import { NextRequest, NextResponse } from 'next/server';

import { MIRRORS, PRIMARY_MIRROR } from '@/lib/primewire/mirrors';

export const dynamic = 'force-dynamic';

/**
 * Poster image proxy.
 * GET /api/primewire/image?path=<path>&size=w500
 *  - Mirror posters: path=/poster/small/10746-show-token.jpg (size ignored —
 *    PrimeWire publishes only the "small" variant on its own mirrors)
 *  - TMDB:   path=/t/p/w200/abc.jpg   (size rewrites the size segment)
 *  - TVMaze: path=/uploads/images/.../abc.jpg (size ignored)
 *  - Avatars: path=/avatar/{token}.jpg (PrimeWire origin)
 */
const ALLOWED_SIZES = new Set(['w200', 'w300', 'w400', 'w500', 'w780', 'w1280', 'original']);
const TMDB_PATH_RE = /^\/t\/p\/(w200|w300|w400|w500|w780|w1280|original)\/([A-Za-z0-9_-]+)\.(jpg|jpeg|png|webp|svg|gif)$/i;
const TVMAZE_PATH_RE = /^\/uploads\/images\/[a-z_]+\/\d+\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i;
/** PrimeWire avatars: /avatar/noavatar.jpg or /avatar/{5-char token}.jpg */
const AVATAR_PATH_RE = /^\/avatar\/(noavatar|[A-Za-z0-9_-]{3,20})\.(jpg|jpeg|png|webp|gif)$/i;
/** PrimeWire self-hosted posters: /poster/small/<id>-<slug>-<token>.<ext> */
const MIRROR_POSTER_RE = /^\/poster\/[a-z]+\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp|gif)$/i;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rawPath = sp.get('path') ?? '';
  const size = sp.get('size');

  // Upstream candidates, tried in order (mirror posters fail over across
  // every known mirror; the other kinds have a single origin).
  const candidates: string[] = [];

  if (TMDB_PATH_RE.test(rawPath)) {
    let path = rawPath;
    if (size && ALLOWED_SIZES.has(size)) {
      path = rawPath.replace(/^\/t\/p\/[a-z0-9]+/i, `/t/p/${size}`);
    }
    candidates.push(`https://image.tmdb.org${path}`);
  } else if (TVMAZE_PATH_RE.test(rawPath)) {
    candidates.push(`https://static.tvmaze.com${rawPath}`);
  } else if (AVATAR_PATH_RE.test(rawPath)) {
    // cache-bust: PrimeWire keeps the same URL when the avatar changes
    const bust = sp.get('v');
    candidates.push(`${PRIMARY_MIRROR}${rawPath}${bust ? `?v=${encodeURIComponent(bust)}` : ''}`);
  } else if (MIRROR_POSTER_RE.test(rawPath)) {
    for (const base of MIRRORS) candidates.push(`${base}${rawPath}`);
  }

  if (candidates.length === 0) {
    return NextResponse.json({ error: 'invalid image path' }, { status: 400 });
  }

  let lastStatus = 0;
  for (const upstreamUrl of candidates) {
    try {
      const upstream = await fetch(upstreamUrl, {
        headers: { 'User-Agent': UA, Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' },
        cache: 'no-store',
      });

      if (!upstream.ok || !upstream.body) {
        lastStatus = upstream.status;
        continue; // next candidate origin
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
      // network error — try the next candidate origin
    }
  }

  return NextResponse.json(
    { error: lastStatus === 404 ? 'image not found' : 'image fetch failed' },
    { status: lastStatus === 404 ? 404 : 502 },
  );
}
