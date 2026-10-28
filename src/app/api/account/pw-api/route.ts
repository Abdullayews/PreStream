import { NextRequest, NextResponse } from 'next/server';
import { accountError, readJson, requireAccount } from '@/lib/account-auth';
import { apiShow, apiSources, submitLink } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/**
 * GET /api/account/pw-api?key=…
 *   &op=show&id=|imdb=|tvmaze=          → /api/v1/show
 *   &op=sources&type=movie|tv[&imdb=&tmdb=&tvmaze=&season=&episode=] → /api/v1/s
 */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const sp = req.nextUrl.searchParams;
    const op = sp.get('op');
    if (op === 'show') {
      const result = await apiShow(ctx.session, {
        id: parseInt(sp.get('id') ?? '', 10) || undefined,
        imdbId: sp.get('imdb') ?? undefined,
        tvmazeId: parseInt(sp.get('tvmaze') ?? '', 10) || undefined,
        apiKey: ctx.profile.pwApiKey,
      });
      return NextResponse.json(result);
    }
    if (op === 'sources') {
      const type = sp.get('type') === 'tv' ? 'tv' : 'movie';
      const result = await apiSources(ctx.session, {
        type,
        imdb: sp.get('imdb') ?? undefined,
        tmdb: sp.get('tmdb') ?? undefined,
        tvmaze: sp.get('tvmaze') ?? undefined,
        season: parseInt(sp.get('season') ?? '', 10) || undefined,
        episode: parseInt(sp.get('episode') ?? '', 10) || undefined,
      });
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: 'Unknown op — use show|sources' }, { status: 400 });
  } catch (err) {
    return accountError(err);
  }
}

/**
 * POST /api/account/pw-api  { apiKey, op: "submit-link",
 *   type, pwShowId, link, quality?, season?, episode?, pwVideoId?,
 *   audioLanguage?, audioType? } — the PrimeWire /api/v1/submit_link API.
 */
export async function POST(req: NextRequest) {
  const body = await readJson<{
    apiKey: string; op?: string; type?: string; pwShowId?: number; link?: string;
    quality?: string; season?: number; episode?: number; pwVideoId?: number;
    audioLanguage?: string; audioType?: string;
  }>(req);
  const ctx = await requireAccount(body.apiKey);
  if (ctx instanceof NextResponse) return ctx;
  try {
    if (body.op !== 'submit-link') {
      return NextResponse.json({ error: 'Unknown op — use submit-link' }, { status: 400 });
    }
    const pwShowId = Number(body.pwShowId);
    const link = (body.link ?? '').trim();
    const type = body.type === 'tv' ? 'tv' : 'movie';
    if (!pwShowId || !/^https?:\/\//i.test(link)) {
      return NextResponse.json({ error: 'pwShowId and a valid link URL are required' }, { status: 400 });
    }
    const result = await submitLink(ctx.session, ctx.profile.pwApiKey, {
      type,
      pwShowId,
      link,
      quality: body.quality,
      season: Number(body.season) || undefined,
      episode: Number(body.episode) || undefined,
      pwVideoId: Number(body.pwVideoId) || undefined,
      audioLanguage: body.audioLanguage,
      audioType: body.audioType,
    });
    return NextResponse.json(result);
  } catch (err) {
    return accountError(err);
  }
}
