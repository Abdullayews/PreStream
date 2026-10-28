/**
 * PrimeWire account-surface HTML parsers (authenticated pages).
 */
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import type * as T from './account-types';
import { tmdbPath } from './parser';

type El = Element;
type ElCollection = cheerio.Cheerio<Element>;

function textOf($: cheerio.CheerioAPI, el: ElCollection | El | null | undefined): string {
  if (!el) return '';
  return $(el as El).text().replace(/\s+/g, ' ').trim();
}

/** Inner *rendered* markdown HTML of an element (used for comment bodies). */
function markdownHtml($: cheerio.CheerioAPI, $el: ElCollection): string {
  return ($el.find('.markdown').first().html() ?? $el.html() ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseIntSafe(v: string | undefined | null): number | null {
  if (!v) return null;
  const n = parseInt(v.replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------------------------------------------ */
/* Sidebar (who is signed in — present on every authed page)           */
/* ------------------------------------------------------------------ */

export interface SidebarUser {
  username: string;
  avatar: string | null;
  messageCount: number;
  notificationCount: number;
}

export function parseSidebarUser(html: string): SidebarUser | null {
  const $ = cheerio.load(html);
  const $box = $('div.logged_in').first();
  if (!$box.length) return null;
  const username = $box.find('.logged_username a[href^="/user/"]').first().text().trim();
  if (!username) return null;
  const avatar = $box.find('.profile_avatar img').first().attr('src') ?? null;
  return {
    username,
    avatar,
    messageCount: parseIntSafe($box.find('#message_count').first().text()) ?? 0,
    notificationCount: parseIntSafe($box.find('#notification_count').first().text()) ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* Profile page (/user/{name})                                         */
/* ------------------------------------------------------------------ */

export function parseUserProfile(html: string): T.PwUserProfile {
  const $ = cheerio.load(html);
  const $page = $('div.profile_page').first();

  const username = $('h1.titles span[style*="float:left"]').first().text().trim()
    || $('h1.titles').first().text().trim();
  const avatar = $page.find('.profile_avatar img').first().attr('src') ?? null;

  // Info rows keyed by header cell text
  const info: Record<string, string> = {};
  $page.find('td.profile_info_header').each((_, td) => {
    const label = $(td).text().replace(/[:\s]+$/, '').trim();
    if (!label) return;
    const value = textOf($, $(td).next('td'));
    if (value) info[label] = value;
  });

  const statusText = info['Status'] ?? '';
  const online = /online/i.test(statusText);
  const lastActive = /\(Last accessed\s+([^)]+)\)/i.exec(statusText)?.[1]?.trim() ?? null;

  // Kudos row header contains a link — normalize
  let kudos: number | null = null;
  let profileViews: number | null = null;
  $page.find('td.profile_info_header').each((_, td) => {
    const t = $(td).text();
    if (/^Kudos/i.test(t)) kudos = parseIntSafe(textOf($, $(td).next('td')));
    if (/^Profile Views/i.test(t)) profileViews = parseIntSafe(textOf($, $(td).next('td')));
  });

  const aboutRaw = $page.find('td.markdown').first().text().replace(/\s+/g, ' ').trim();
  const hobbiesRaw = $page.find('td.markdown').eq(1).text().replace(/\s+/g, ' ').trim();
  const notEntered = (v: string) => (!v || /^not entered$/i.test(v) ? null : v);

  // user id from the spiderman span or the add_friend link
  const userId =
    parseIntSafe($('span#spiderman').first().attr('u')) ??
    parseIntSafe(/\/add_friend\?id=(\d+)/.exec(html)?.[1] ?? null) ??
    parseIntSafe(/\/playlists\/user\?user_id=(\d+)/.exec(html)?.[1] ?? null);

  // Wall posts
  const wall: T.WallPost[] = [];
  $('div.wall_post').each((i, el) => {
    const $el = $(el);
    const author = $el.find('.wall_post_info a[href^="/user/"]').first().text().trim() || null;
    const postedAgo = /Posted by\s+.*?\s+(\d[^.]*?)\.\s*$/i
      .exec($el.find('.wall_post_info').first().text().replace(/\s+/g, ' ').trim())?.[1] ?? null;
    wall.push({
      id: `wall-${i}`,
      author,
      authorAvatar: $el.find('.wall_post_avatar img').first().attr('src') ?? null,
      body: markdownHtml($, $el.find('.wall_post_info')),
      postedAgo,
    });
  });

  return {
    username,
    userId,
    avatar,
    gender: info['Gender'] ?? null,
    from: info['From'] ?? null,
    joined: info['Joined'] ?? null,
    lastActive,
    online,
    profileViews,
    kudos,
    about: notEntered(aboutRaw),
    hobbies: notEntered(hobbiesRaw),
    wall,
    userIdForActions: userId,
    sourceUrl: '',
  };
}

/* ------------------------------------------------------------------ */
/* Friends page (/user/{name}/friends)                                 */
/* ------------------------------------------------------------------ */

export function parseFriendsPage(html: string): T.FriendsResponse {
  const $ = cheerio.load(html);
  const out: T.FriendsResponse = { confirmed: [], unconfirmed: [] };

  const readBlock = ($block: ElCollection, into: T.FriendSummary[]) => {
    $block.find('.profile_friends_item_detailed').each((_, item) => {
      const $a = $(item).find('a[href^="/user/"]').first();
      const name = $a.contents().filter((__, n) => n.type === 'text').text().replace(/\s+/g, ' ').trim();
      if (!name) return;
      into.push({ username: name, avatar: $a.find('img').first().attr('src') ?? null, online: false });
    });
  };

  // Two sections, each: <strong>Header</strong> + div.profile_friends_block
  $('div.regular_page strong, div.main-body strong').each((_, strong) => {
    const label = $(strong).text().trim().toLowerCase();
    if (label !== 'friends' && !label.includes('unconfirmed')) return;
    const $block = $(strong).nextAll('.profile_friends_block').first();
    if (!$block.length) return;
    readBlock($block, label.includes('unconfirmed') ? out.unconfirmed : out.confirmed);
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Library (/library/{name})                                           */
/* ------------------------------------------------------------------ */

function paginationOf($: cheerio.CheerioAPI): { page: number; pages: number[]; hasNext: boolean } {
  const page = parseIntSafe($('div.pagination span.current').first().text()) ?? 1;
  const pages = new Set<number>([page]);
  $('div.pagination a').each((_, el) => {
    const p = parseIntSafe($(el).text()) ?? parseIntSafe(/[?&]page=(\d+)/.exec($(el).attr('href') ?? '')?.[1] ?? null);
    if (p) pages.add(p);
  });
  const sorted = [...pages].sort((a, b) => a - b);
  return { page, pages: sorted, hasNext: sorted.includes(page + 1) };
}

export function parseLibraryPage(html: string): T.LibraryResponse {
  const $ = cheerio.load(html);
  const items: T.LibraryItem[] = [];
  const owner = $('h1.titles').first().text().replace(/'s\s+Library.*$/i, '').replace(/^.*Library\s+>\s*/i, '').trim()
    || /\/library\/([^/"'?]+)/.exec(html)?.[1]
    || '';

  $('div.library-item-g').each((_, el) => {
    const $el = $(el);
    const id = parseIntSafe(($el.attr('id') ?? '').replace('library-item-', ''));
    const $a = $el.find('a[href^="/movie/"], a[href^="/tv/"]').first();
    const href = $a.attr('href') ?? '';
    const m = /^\/(movie|tv)\/(\d+)-([^/?#]*)/.exec(href);
    if (!id || !m) return;
    const { title, year } = (() => {
      const titleAttr = $a.attr('title') ?? '';
      const tm = /\s+\((\d{4})\)\s*$/.exec(titleAttr);
      if (tm) return { title: titleAttr.slice(0, tm.index).trim(), year: parseInt(tm[1], 10) };
      return { title: titleAttr.trim() || $a.text().trim(), year: null };
    })();
    if (!title) return;
    const status = ($el.find('select.watch-status option[selected]').first().attr('value') || '').trim() || null;
    items.push({
      id: parseInt(m[2], 10),
      slug: m[3],
      type: m[1] as 'movie' | 'tv',
      title,
      year,
      poster: tmdbPath($el.find('img').first().attr('src')),
      rating: (() => {
        const style = $el.find('.current-rating').first().attr('style');
        const w = /width:\s*([\d.]+)px/i.exec(style ?? '');
        return w ? Math.round((parseFloat(w[1]) / 20) * 10) / 10 : null;
      })(),
      status: (status as T.WatchStatus | '') || null,
      favorite: $el.find('.heart-checkbox input').first().attr('checked') !== undefined,
    });
  });

  const { page, pages, hasNext } = paginationOf($);
  return { items, page, pages, hasNext, owner };
}

/* ------------------------------------------------------------------ */
/* My playlists (/playlists/user?user_id=)                             */
/* ------------------------------------------------------------------ */

function parsePlaylistRows($: cheerio.CheerioAPI, scope: ElCollection) {
  const out: T.MyPlaylistsResponse['mine'] = [];
  scope.find('tr').each((_, el) => {
    const $el = $(el);
    const $link = $el
      .find('a[href^="/playlist/"]')
      .filter((__, a) => $(a).text().trim().length > 0)
      .first();
    const href = $link.attr('href') ?? '';
    const m = /^\/playlist\/(\d+)-([^/?#]*)/.exec(href);
    if (!m) return;
    const title = $link.text().trim();
    if (!title) return;
    const strongText = $el.find('strong').first().text();
    const countMatch = /\(\s*(\d+)\s*items?\s*\)/i.exec(strongText);
    const infoText = $el.find('.playlist_listing_info').first().text().replace(/\s+/g, ' ').trim();
    out.push({
      id: parseInt(m[1], 10),
      slug: m[2],
      title,
      itemCount: countMatch ? parseInt(countMatch[1], 10) : null,
      views: /(\d+)\s*Views?/i.exec(infoText) ? parseInt(/(\d+)\s*Views?/i.exec(infoText)![1], 10) : null,
      favorites: /(\d+)\s*favorites?/i.exec(infoText) ? parseInt(/(\d+)\s*favorites?/i.exec(infoText)![1], 10) : null,
      poster: tmdbPath($el.find('.playlist_thumb img').first().attr('src')),
      description: $el.find('.playlist_listing_desc').first().text().replace(/\s+/g, ' ').trim() || null,
      private: /\bprivate\b/i.test(infoText) || /\bprivate\b/i.test(strongText),
      createdAgo: /Created\s+([^|]+?)(?:\s+by\s+|$)/i.exec(infoText)?.[1]?.trim() ?? null,
    });
  });
  return out;
}

export function parseMyPlaylistsPage(html: string): T.MyPlaylistsResponse {
  const $ = cheerio.load(html);
  const result: T.MyPlaylistsResponse = { mine: [], favoritePlaylists: [] };

  // The page has two sections in order: "{user}'s Playlists" (with a
  // "Create a playlist" link) and "{user}'s Favorite Playlists".
  const $main = $('div.main-body').first();
  const listings = $main.find('div.playlist_listing').toArray();
  if (listings.length >= 2) {
    result.mine = parsePlaylistRows($, $(listings[0]));
    result.favoritePlaylists = parsePlaylistRows($, $(listings[1]));
  } else if (listings.length === 1) {
    // Only one section present — decide by the preceding header
    const $listing = $(listings[0]);
    let node = $listing.prev();
    let fav = false;
    while (node.length) {
      if (/Favorite Playlists/i.test(node.text())) {
        fav = true;
        break;
      }
      if (node.text().trim() && /Playlists/i.test(node.text())) break;
      node = node.prev();
    }
    if (fav) result.favoritePlaylists = parsePlaylistRows($, $listing);
    else result.mine = parsePlaylistRows($, $listing);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Comments (section, feeds, user comments)                            */
/* ------------------------------------------------------------------ */

function parseOneComment(
  $: cheerio.CheerioAPI,
  $c: ElCollection,
  parentId: number | null,
  context?: { label: string | null; href: string | null },
): T.PwComment {
  const id = parseIntSafe(($c.attr('id') ?? '').replace('comment-', '')) ?? 0;
  const $tagline = $c.find('> .tagline').first();
  const author = $tagline.find('a.user_link').first().text().trim() || null;
  const points = parseIntSafe($tagline.find(`span#points-${id}`).first().text());
  const taglineText = $tagline.text().replace(/\s+/g, ' ').trim();
  const postedAgo = /\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago/i.exec(taglineText)?.[0] ?? null;
  const arrows = $c.find('> .arrows').first();
  const voted = arrows.hasClass('upmod') ? 'up' : arrows.hasClass('downmod') ? 'down' : '';

  const comment: T.PwComment = {
    id,
    author,
    body: markdownHtml($, $c.find('> .entry')),
    points,
    postedAgo,
    context: context?.label ?? null,
    contextHref: context?.href ?? null,
    parentId,
    replies: [],
    voted,
  };

  // nested replies
  $c.find('> .child, > div.child').children('div.comment').each((_, child) => {
    comment.replies.push(parseOneComment($, $(child), id));
  });
  return comment;
}

/** Parse a comments section (/comments/section?type=show&id=) — top-level .comment divs. */
export function parseCommentsSection(html: string): T.PwComment[] {
  const $ = cheerio.load(html);
  const out: T.PwComment[] = [];
  $('div.comment').each((_, el) => {
    const $c = $(el);
    // only top-level comments (no .comment ancestor)
    if ($c.parents('div.comment').length > 0) return;
    out.push(parseOneComment($, $c, null));
  });
  return out;
}

/** Parse the comments feed (/comments?sort=…) — .comment_item wrappers. */
export function parseCommentsFeed(html: string, sort: string): T.CommentsFeedResponse {
  const $ = cheerio.load(html);
  const out: T.PwComment[] = [];
  $('div.comment_item').each((_, el) => {
    const $item = $(el);
    const $ctx = $item.find('> a.comment_tv, > a').first();
    const ctxHref = $ctx.attr('href') ?? null;
    const ctxLabel = $ctx.text().trim() || null;
    $item.find('div.comment').each((__, c) => {
      const $c = $(c);
      if ($c.parents('div.comment').length > 0) return;
      out.push(parseOneComment($, $c, null, { label: ctxLabel, href: ctxHref }));
    });
  });
  // user comments page has a different container — fall back
  if (!out.length) {
    $('div.comment').each((_, c) => {
      const $c = $(c);
      if ($c.parents('div.comment').length > 0) return;
      out.push(parseOneComment($, $c, null));
    });
  }
  return { comments: out, sort };
}

/* ------------------------------------------------------------------ */
/* Messages & notifications                                            */
/* ------------------------------------------------------------------ */

export function parseMessagesPage(html: string): T.MessageThread[] {
  const $ = cheerio.load(html);
  const out: T.MessageThread[] = [];
  const $main = $('div.regular_page').first().length
    ? $('div.regular_page').first()
    : $('div.main-body').first();
  // each thread links to /messages/{user} — collect rows
  $main.find('a[href^="/messages/"]').each((i, a) => {
    const href = $(a).attr('href') ?? '';
    const withUser = decodeURIComponent(href.replace('/messages/', ''));
    if (!withUser || withUser.length > 40) return;
    const $row = $(a).closest('div, tr, li');
    if (!/^\/messages\/[^/]+$/.test(href)) return;
    if (out.some((t) => t.withUser === withUser)) return;
    out.push({
      id: `msg-${i}`,
      withUser,
      lastBody: $row.find('.markdown').first().text().replace(/\s+/g, ' ').trim() || null,
      postedAgo: null,
      unread: $row.hasClass('unread') || $row.find('.unread').length > 0,
      href,
    });
  });
  return out;
}

export function parseNotificationsPage(html: string): T.PwNotification[] {
  const $ = cheerio.load(html);
  const out: T.PwNotification[] = [];
  const $main = $('div.regular_page').first().length
    ? $('div.regular_page').first()
    : $('div.main-body').first();
  // notifications are list rows with links + text
  $main.find('li, div.notification').each((i, el) => {
    const $el = $(el);
    if ($el.find('li, div.notification').length) return; // skip containers
    const body = $el.text().replace(/\s+/g, ' ').trim();
    if (!body || body === 'No notifications' || body.length < 6) return;
    const href = $el.find('a[href^="/"]').first().attr('href') ?? null;
    out.push({ id: `ntf-${i}`, body: body.slice(0, 300), postedAgo: null, href });
  });
  return out.slice(0, 50);
}

/* ------------------------------------------------------------------ */
/* Forum                                                               */
/* ------------------------------------------------------------------ */

function parseThreadRow($: cheerio.CheerioAPI, $el: ElCollection): T.ForumThread | null {
  const $link = $el.find('a[href^="/forum/thread/"]').first();
  const href = $link.attr('href') ?? '';
  const id = parseIntSafe(/\/forum\/thread\/(\d+)/.exec(href)?.[1] ?? null);
  const title = $link.text().replace(/^(Sticky|Locked):\s*/i, '').trim();
  if (!id || !title) return null;
  const tds = $el.find('td').toArray();
  const replies = tds.length >= 3 ? parseIntSafe(textOf($, tds[tds.length - 3])) : null;
  const lastAgo = /\(([^)]+)\)\s*$/.exec($el.find('.posted_by').first().text())?.[1] ?? null;
  const author = $el.find('em a[href^="/user/"], .read_thread + em a[href^="/user/"]').first().text().trim() || null;
  return { id, title, author, replies, lastPostAgo: lastAgo, href };
}

export function parseForumIndex(html: string): T.ForumIndexResponse {
  const $ = cheerio.load(html);
  const categories: T.ForumCategory[] = [];
  // forum index links: /forum/{id} next to category names
  const seen = new Set<number>();
  $('a[href^="/forum/"]').each((_, a) => {
    const href = $(a).attr('href') ?? '';
    const m = /^\/forum\/(\d+)$/.exec(href);
    if (!m) return;
    const id = parseInt(m[1], 10);
    if (seen.has(id)) return;
    const name = $(a).text().replace(/\s+/g, ' ').trim();
    if (!name || name.length > 60) return;
    seen.add(id);
    categories.push({ id, name, description: null, threads: [] });
  });

  // Latest threads on the index (threadlist_item rows not inside a category listing)
  const latest: T.ForumThread[] = [];
  $('div.threadlist_item').each((_, el) => {
    const t = parseThreadRow($, $(el));
    if (t) latest.push(t);
  });
  if (categories.length === 0 && latest.length > 0) {
    categories.push({ id: 0, name: 'Latest Threads', description: null, threads: latest });
  } else if (categories.length > 0) {
    categories[0].threads = latest.slice(0, 10);
  }
  return { categories };
}

export function parseForumCategoryPage(html: string, categoryId: number): T.ForumCategory {
  const $ = cheerio.load(html);
  const name = $('h1.titles strong').first().text().trim() || 'Forum';
  const threads: T.ForumThread[] = [];
  $('div.threadlist_item').each((_, el) => {
    const t = parseThreadRow($, $(el));
    if (t) threads.push(t);
  });
  return { id: categoryId, name, description: null, threads };
}

export function parseThreadPage(html: string, threadId: number): T.ForumThreadPage {
  const $ = cheerio.load(html);
  // breadcrumb: Forum > <strong>Category</strong> > <strong>title</strong>
  const strongs = $('h1.titles strong').toArray();
  const title = strongs.length
    ? $(strongs[strongs.length - 1]).text().trim()
    : $('title').text().split('|')[0].trim();

  const posts: T.ForumThreadPage['posts'] = [];
  // Each post: div.thread_item > .thread_col1 (author .user_link, avatar,
  // "Posts: N") + .thread_col2.markdown.forum_post (body + .quote_this_post)
  $('div.thread_item').each((i, item) => {
    const $item = $(item);
    const $body = $item.find('.thread_col2.forum_post, .thread_col2').first();
    if (!$body.length || !$body.hasClass('forum_post')) return;
    const author = $item.find('.thread_col1 .user_link').first().text().trim() || null;
    const avatar = $item.find('.thread_col1 img').first().attr('src') ?? null;
    const postedText = $body.find('.quote_this_post').first().text().trim();
    const postedAgo = (/^Posted\s+(.+)$/i.exec(postedText)?.[1]?.trim()) || null;
    posts.push({
      id: `post-${i}`,
      author,
      avatar,
      body: markdownHtml($, $body),
      postedAgo,
    });
  });

  return {
    thread: { id: threadId, title, author: null, replies: posts.length ? posts.length - 1 : 0, lastPostAgo: null, href: `/forum/thread/${threadId}` },
    posts,
  };
}

/* ------------------------------------------------------------------ */
/* Watch parties                                                       */
/* ------------------------------------------------------------------ */

export function parseWatchPartiesPage(html: string): T.WatchParty[] {
  const $ = cheerio.load(html);
  const out: T.WatchParty[] = [];
  const $main = $('div.regular_page').first().length
    ? $('div.regular_page').first()
    : $('div.main-body').first();
  $main.find('a[href^="/party/"]').each((_, a) => {
    const code = ($(a).attr('href') ?? '').replace('/party/', '');
    if (!code || out.some((p) => p.code === code)) return;
    const $row = $(a).closest('div, tr, td, li');
    const label = $row.text().replace(/\s+/g, ' ').trim();
    const name = $(a).text().trim() || label.slice(0, 80) || null;
    const host = /Hosted by\s+([^\s]+)/i.exec(label)?.[1] ?? null;
    out.push({ code, name, link: null, members: null, ...(host ? { name: `${name}`, link: host } : {}) });
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Settings page (/registrations/edit)                                 */
/* ------------------------------------------------------------------ */

export interface ParsedSettings extends T.PwSettings {
  countryOptions: T.PwCountryOption[];
}

export function parseSettingsPage(html: string): ParsedSettings {
  const $ = cheerio.load(html);

  const username = $('strong.logged_username a[href^="/user/"]').first().text().trim() || null;
  const avatar = $('#preview img, .profile_avatar img').first().attr('src') ?? null;

  let apiKey: string | null = null;
  $('fieldset legend').each((_, lg) => {
    if ($(lg).text().trim().toLowerCase() !== 'api') return;
    const $table = $(lg).next('table');
    apiKey = $table.find('td').eq(1).text().replace(/\s+/g, ' ').trim() || null;
  });

  // Single pass over the form controls (was ~18 full-document selector
  // queries — the dominant cost after cheerio.load; measured in
  // audit/baseline.md). Semantics preserved exactly:
  //  - selectedRadio: first CHECKED input with the name (attr `checked`)
  //  - selectedOption: first option with attr `selected` inside the select
  //  - val: first element with the name (input → value attr, textarea → text)
  interface SelectInfo {
    firstSelected: string | null;
    options: T.PwCountryOption[];
  }
  const radios = new Map<string, string | null>(); // name → first checked value
  const selects = new Map<string, SelectInfo>(); // name → select info
  const values = new Map<string, string | null>(); // name → first control's val()

  $('input, select, textarea').each((_, el) => {
    const $el = $(el);
    const name = $el.attr('name');
    if (!name) return;
    const tag = (el as Element).tagName;
    if (tag === 'input') {
      const type = ($el.attr('type') ?? '').toLowerCase();
      const isRadioOrCheckbox = type === 'radio' || type === 'checkbox';
      if (isRadioOrCheckbox) {
        if (!radios.has(name) && $el.attr('checked') !== undefined) {
          radios.set(name, $el.attr('value') ?? null);
        }
        return;
      }
      if (!values.has(name)) {
        const v = $el.attr('value') ?? '';
        values.set(name, v.trim() ? v.trim() : null);
      }
      return;
    }
    if (tag === 'textarea') {
      if (!values.has(name)) {
        const v = $el.text();
        values.set(name, v.trim() ? v.trim() : null);
      }
      return;
    }
    // select
    if (selects.has(name)) return;
    const info: SelectInfo = { firstSelected: null, options: [] };
    $el.find('option').each((__, opt) => {
      const $opt = $(opt);
      const value = $opt.attr('value') ?? '';
      const text = $opt.text().trim();
      if (value && text) info.options.push({ id: value, name: text });
      if (info.firstSelected === null && $opt.attr('selected') !== undefined) {
        info.firstSelected = value || null;
      }
    });
    selects.set(name, info);
  });

  const selectedRadio = (name: string): string | null => radios.get(name) ?? null;
  const selectedOption = (name: string): string | null =>
    selects.get(name)?.firstSelected ?? null;
  const val = (name: string): string | null => values.get(name) ?? null;

  const countryInfo = selects.get('registration[country_id]');
  const countryOptions = countryInfo?.options ?? [];
  const countryId = countryInfo?.firstSelected ?? null;

  return {
    username: username ?? '',
    email: null,
    avatar,
    apiKey,
    gender: selectedRadio('registration[gender]'),
    birthdayYear: selectedOption('registration[birthday][year]'),
    birthdayMonth: selectedOption('registration[birthday][month]'),
    birthdayDay: selectedOption('registration[birthday][day]'),
    countryId,
    countryName:
      countryOptions.find((c) => c.id === (countryId ?? ''))?.name ?? null,
    city: val('registration[city]'),
    bio: val('registration[bio]'),
    hobbies: val('registration[hobbies]'),
    pmMessage: val('registration[pm_message]'),
    wallViewAccess: selectedRadio('registration[wall_view_access]') ?? '0',
    wallPostAccess: selectedRadio('registration[wall_post_access]') ?? '0',
    countryOptions,
  };
}

/* ------------------------------------------------------------------ */
/* User submitted links (/links/user/{name})                           */
/* ------------------------------------------------------------------ */

export function parseUserLinksPage(html: string): T.UserLink[] {
  const $ = cheerio.load(html);
  const out: T.UserLink[] = [];
  const $main = $('div.regular_page').first();
  $main.find('tr').each((i, tr) => {
    const $tr = $(tr);
    const $show = $tr.find('a[href^="/movie/"], a[href^="/tv/"]').first();
    if (!$show.length) return;
    const text = $tr.text().replace(/\s+/g, ' ').trim();
    out.push({
      id: `link-${i}`,
      showTitle: $show.text().trim() || null,
      showHref: $show.attr('href') ?? null,
      episodeLabel: /S\d+\s*E\d+/i.exec(text)?.[0] ?? null,
      quality: /\b(HD|DVD|TS|CAM)\b/i.exec(text)?.[1] ?? null,
      language: null,
      host: null,
      views: /(\d+)\s*views/i.exec(text) ? parseInt(/(\d+)\s*views/i.exec(text)![1], 10) : null,
      status: null,
      postedAgo: null,
    });
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Detail-page tracker widget state (movie/tv detail, logged in)       */
/* ------------------------------------------------------------------ */

export function parseTrackerState(html: string): T.LibraryItemState {
  const $ = cheerio.load(html);
  const $widget = $('div.library-widget').first();
  const status = $widget.find('select.watch-status option[selected]').first().attr('value') ?? '';
  return {
    library: $widget.find('.library-checkbox').first().attr('checked') !== undefined,
    status: (status as T.WatchStatus | '') || null,
    favorite: $widget.find('.heart-checkbox input').attr('checked') !== undefined,
    schedule: $widget.find('.calendar-checkbox input').attr('checked') !== undefined,
  };
}

/** The user's own rating for a show from a detail page (unit_rating block with "your rating"). */
export function parseOwnRating(html: string): number | null {
  const m = /Your rating:\s*(\d)/i.exec(html) || /your_rating\s*[:=]\s*"?(\d)/i.exec(html);
  return m ? parseInt(m[1], 10) : null;
}

/* ------------------------------------------------------------------ */
/* Episode watched states (TV detail page, logged in)                  */
/* ------------------------------------------------------------------ */

export interface EpisodeWatchState {
  videoId: number;
  season: number;
  number: number;
  watched: boolean;
}

export function parseEpisodeStates(html: string): EpisodeWatchState[] {
  const $ = cheerio.load(html);
  const out: EpisodeWatchState[] = [];
  $('input.episode-checkbox').each((_, el) => {
    const $el = $(el);
    const videoId = parseIntSafe($el.attr('value'));
    const season = parseIntSafe($el.attr('data-season'));
    if (!videoId) return;
    // episode number from the sibling link href
    const href = $el.closest('.tv_episode_item').find('a[href]').first().attr('href') ?? '';
    const em = /episode-(\d+)/.exec(href);
    out.push({
      videoId,
      season: season ?? 0,
      number: em ? parseInt(em[1], 10) : 0,
      watched: $el.attr('checked') !== undefined,
    });
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Playlist edit page (/playlists/edit/{id})                           */
/* ------------------------------------------------------------------ */

/**
 * Items of one of the user's OWN playlists as the edit page sees them.
 * The playlist-item id only exists here — remove/move actions need it
 * (the public playlist page exposes only show ids).
 */
export function parsePlaylistEditPage(html: string): T.PlaylistEditItem[] {
  const $ = cheerio.load(html);
  const out: T.PlaylistEditItem[] = [];
  $('tr.playlist-item').each((_, el) => {
    const $el = $(el);
    const itemId = parseIntSafe($el.attr('item-id'));
    if (!itemId) return;
    const href = $el.find('a[href^="/tv/"], a[href^="/movie/"]').first().attr('href') ?? '';
    const sm = /^\/(tv|movie)\/(\d+)-/.exec(href);
    const poster = $el.find('img').first().attr('src') ?? null;
    const text = $el.find('.playlist_info').first().text().replace(/\s+/g, ' ').trim();
    const title = $el.find('.playlist_info a[href^="/tv/"], .playlist_info a[href^="/movie/"]').first().text().trim();
    const year = /\(\s*(\d{4})\s*\)/.exec(text) ? parseInt(/\(\s*(\d{4})\s*\)/.exec(text)![1], 10) : null;
    out.push({
      itemId,
      showId: sm ? parseInt(sm[2], 10) : null,
      type: sm ? (sm[1] as 'movie' | 'tv') : null,
      title: title || 'Item',
      year,
      poster,
    });
  });
  return out;
}
