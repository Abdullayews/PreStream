import { NextRequest, NextResponse } from 'next/server';
import { accountError, readJson, requireAccount } from '@/lib/account-auth';
import { episodeAction, fetchDetailState } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/**
 * POST /api/account/episode
 * { apiKey, action: watch|unwatch|watch-season|unwatch-season|prev,
 *   episodeId?, showId?, season?, episode? }
 * watch/unwatch need PrimeWire's numeric episode (video) id. When the caller
 * only knows the show/season/episode triple, it is resolved from the show's
 * tracker page so every documented parameter combination works.
 */
export async function POST(req: NextRequest) {
  const body = await readJson<{
    apiKey: string; action: string; episodeId?: number; showId?: number; season?: number; episode?: number;
  }>(req);
  const ctx = await requireAccount(body.apiKey);
  if (ctx instanceof NextResponse) return ctx;
  try {
    const action = body.action;
    if (!['watch', 'unwatch', 'watch-season', 'unwatch-season', 'prev'].includes(action ?? '')) {
      return NextResponse.json({ error: 'Unknown episode action' }, { status: 400 });
    }
    const showId = Number(body.showId) || undefined;
    const season = Number(body.season) || undefined;
    const episode = Number(body.episode) || undefined;
    let episodeId = Number(body.episodeId) || undefined;

    if ((action === 'watch' || action === 'unwatch') && !episodeId) {
      if (!showId || !season || !episode) {
        return NextResponse.json(
          { error: 'watch/unwatch needs episodeId, or showId + season + episode' },
          { status: 400 },
        );
      }
      const state = await fetchDetailState(ctx.session, 'tv', showId);
      episodeId = state.episodes.find((e) => e.season === season && e.number === episode)?.videoId;
      if (!episodeId) {
        return NextResponse.json(
          { error: `Episode S${season}E${episode} not found for this show` },
          { status: 404 },
        );
      }
    }

    const result = await episodeAction(ctx.session, action as 'watch', {
      episodeId,
      showId,
      season,
      episode,
    });
    return NextResponse.json({ ok: true, result: result.slice(0, 200) });
  } catch (err) {
    return accountError(err);
  }
}
