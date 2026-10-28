import { NextRequest, NextResponse } from 'next/server';
import { accountError, readJson, requireAccount } from '@/lib/account-auth';
import {
  addShowToPlaylist, createPlaylist, deletePlaylist, deletePlaylistItem,
  editPlaylist, favoritePlaylist, fetchMyPlaylists, fetchPlaylistItems, movePlaylistItem,
} from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** GET /api/account/playlists?key=… → my playlists + favorited playlists.
 *  GET /api/account/playlists?key=…&items={id} → editable items (real item ids) of one of MY playlists. */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const itemsFor = parseInt(req.nextUrl.searchParams.get('items') ?? '', 10);
    if (Number.isFinite(itemsFor) && itemsFor > 0) {
      const items = await fetchPlaylistItems(ctx.session, itemsFor);
      return NextResponse.json({ items });
    }
    const result = await fetchMyPlaylists(ctx.session, ctx.profile.pwUserId);
    return NextResponse.json(result);
  } catch (err) {
    return accountError(err);
  }
}

/**
 * POST /api/account/playlists
 * { apiKey, action: create|edit|delete|add-show|remove-item|move-item|favorite, … }
 */
export async function POST(req: NextRequest) {
  const body = await readJson<{
    apiKey: string;
    action?: string;
    id?: number;           // playlist id
    title?: string;
    description?: string;
    private?: boolean;
    allowComments?: boolean;
    showId?: number;       // add-show
    itemId?: number;       // remove-item / move-item
    nextItemId?: number;   // move-item (id of the item below — PrimeWire moves down by moving the next one up)
    up?: boolean;          // move-item direction
    on?: boolean;          // favorite toggle
  }>(req);
  const ctx = await requireAccount(body.apiKey);
  if (ctx instanceof NextResponse) return ctx;
  try {
    switch (body.action) {
      case 'create': {
        const title = (body.title ?? '').trim();
        if (!title) return NextResponse.json({ error: 'Playlist title is required' }, { status: 400 });
        await createPlaylist(ctx.session, {
          title: title.slice(0, 120),
          description: (body.description ?? '').slice(0, 2000),
          private: Boolean(body.private),
          allowComments: body.allowComments !== false,
        });
        return NextResponse.json({ ok: true });
      }
      case 'edit': {
        const id = Number(body.id);
        const title = (body.title ?? '').trim();
        if (!Number.isFinite(id) || id <= 0 || !title) {
          return NextResponse.json({ error: 'Playlist id and title are required' }, { status: 400 });
        }
        await editPlaylist(ctx.session, {
          id,
          title: title.slice(0, 120),
          description: (body.description ?? '').slice(0, 2000),
          private: Boolean(body.private),
          allowComments: body.allowComments !== false,
        });
        return NextResponse.json({ ok: true });
      }
      case 'delete': {
        const id = Number(body.id);
        if (!Number.isFinite(id) || id <= 0) {
          return NextResponse.json({ error: 'Playlist id is required' }, { status: 400 });
        }
        await deletePlaylist(ctx.session, id);
        return NextResponse.json({ ok: true });
      }
      case 'add-show': {
        const playlistId = Number(body.id);
        const showId = Number(body.showId);
        if (!playlistId || !showId) {
          return NextResponse.json({ error: 'Playlist and show ids are required' }, { status: 400 });
        }
        await addShowToPlaylist(ctx.session, playlistId, showId);
        return NextResponse.json({ ok: true });
      }
      case 'remove-item': {
        const itemId = Number(body.itemId);
        if (!itemId) return NextResponse.json({ error: 'Item id is required' }, { status: 400 });
        await deletePlaylistItem(ctx.session, itemId);
        return NextResponse.json({ ok: true });
      }
      case 'move-item': {
        const itemId = Number(body.itemId);
        if (!itemId) return NextResponse.json({ error: 'Item id is required' }, { status: 400 });
        await movePlaylistItem(
          ctx.session,
          itemId,
          body.up !== false,
          Number(body.nextItemId) || undefined,
        );
        return NextResponse.json({ ok: true });
      }
      case 'favorite': {
        const playlistId = Number(body.id);
        if (!playlistId) return NextResponse.json({ error: 'Playlist id is required' }, { status: 400 });
        await favoritePlaylist(ctx.session, playlistId, body.on !== false);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: 'Unknown playlist action' }, { status: 400 });
    }
  } catch (err) {
    return accountError(err);
  }
}
