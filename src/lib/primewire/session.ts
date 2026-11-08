/**
 * PrimeWire authenticated (session) client — login, CSRF, authed GET/POST.
 * The PrimeWire app is Phoenix/Elixir: session cookie `_primewire_key`,
 * CSRF token available as `window.csrf_token` on every page and as the
 * `_csrf_token` hidden input inside forms.
 */
import { PRIMARY_MIRROR } from './client';

/** Hard timeout for authed PrimeWire requests (uploads get 2x). */
const AUTHED_TIMEOUT_MS = 15_000;

const HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

export class SessionExpiredError extends Error {
  constructor() {
    super('PrimeWire session expired — sign in again');
    this.name = 'SessionExpiredError';
  }
}

export class LoginError extends Error {
  status: number;
  constructor(message: string, status = 401, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LoginError';
    this.status = status;
  }
}

const LOGIN_REDIRECT = '/sessions/new';
const CONFIRM_REDIRECT = '/confirmations/new';

/** Cookie names that together authenticate a PrimeWire session. */
const AUTH_COOKIES = ['_primewire_key', '_primewire_rememberme'] as const;

/** Build a Cookie header line from every auth cookie in a jar of raw Set-Cookie strings. */
function cookieLine(jar: string[]): string {
  const latest = new Map<string, string>();
  for (const c of jar) {
    const name = c.split('=')[0];
    if ((AUTH_COOKIES as readonly string[]).includes(name)) {
      latest.set(name, c.split(';')[0]);
    }
  }
  return [...latest.values()].join('; ');
}

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

export interface LoginResult {
  session: string;
  /** Where PrimeWire sent us after POST /sessions. */
  landing: string | null;
}

/**
 * Sign in to PrimeWire with an email or username + password.
 * Throws LoginError with a friendly message on failure.
 * Returns the full Cookie line (`_primewire_key=…; _primewire_rememberme=…`)
 * that authenticates every later request — the remember token is what the
 * site actually validates (it re-issues the session cookie per request).
 */
export async function pwLogin(login: string, password: string): Promise<LoginResult> {
  const jar: string[] = [];
  const collectCookies = (res: Response) => {
    // Node/Bun fetch exposes all Set-Cookie values via getSetCookie()
    const values = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    for (const c of values) {
      const name = c.split('=')[0];
      const idx = jar.findIndex((j) => j.split('=')[0] === name);
      if (idx >= 0) jar[idx] = c;
      else jar.push(c);
    }
  };

  // 1. GET the login page (fresh CSRF + session cookie)
  const pageController = new AbortController();
  const pageTimer = setTimeout(() => pageController.abort(), AUTHED_TIMEOUT_MS);
  let pageRes: Response;
  try {
    pageRes = await fetch(`${PRIMARY_MIRROR}/sessions/new`, {
      headers: HEADERS,
      redirect: 'manual',
      cache: 'no-store',
      signal: pageController.signal,
    });
  } catch (err) {
    throw new LoginError('PrimeWire is unreachable right now', 502, { cause: err });
  } finally {
    clearTimeout(pageTimer);
  }
  if (!pageRes.ok && pageRes.status !== 302) {
    throw new LoginError('PrimeWire is unreachable right now', 502);
  }
  collectCookies(pageRes);
  const loginHtml = pageRes.status === 200 ? await pageRes.text() : '';
  const csrf =
    /name="_csrf_token"[^>]*value="([^"]+)"/.exec(loginHtml)?.[1] ??
    /window\.csrf_token\s*=\s*"([^"]+)"/.exec(loginHtml)?.[1] ??
    '';

  const cookieHeader = cookieLine(jar);
  const body = new URLSearchParams({
    _csrf_token: csrf,
    'session[email_or_username]': login,
    'session[password]': password,
    remember: '1',
    login_submit: 'Login',
  });

  // 2. POST credentials
  const postController = new AbortController();
  const postTimer = setTimeout(() => postController.abort(), AUTHED_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${PRIMARY_MIRROR}/sessions`, {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookieHeader,
        Referer: `${PRIMARY_MIRROR}/sessions/new`,
        Origin: PRIMARY_MIRROR,
      },
      body: body.toString(),
      redirect: 'manual',
      cache: 'no-store',
      signal: postController.signal,
    });
  } catch (err) {
    throw new LoginError('PrimeWire is unreachable right now', 502, { cause: err });
  } finally {
    clearTimeout(postTimer);
  }
  collectCookies(res);

  const session = cookieLine(jar);
  const landing = res.headers.get('location');

  if (res.status === 200) {
    // 200 on POST = form re-rendered with errors. When the login page GET
    // was bot-blocked (no CSRF parsed) the POST can't succeed either —
    // say "temporarily unavailable" instead of accusing the password.
    if (!csrf) {
      throw new LoginError('PrimeWire sign-in is temporarily unavailable — try again shortly', 503);
    }
    throw new LoginError('Wrong email/username or password');
  }
  if (res.status === 302 || res.status === 303) {
    if (landing && landing.includes(CONFIRM_REDIRECT)) {
      throw new LoginError(`This PrimeWire account still needs email confirmation. Confirm it on ${PRIMARY_MIRROR.replace('https://', '')} first.`, 403);
    }
    if (landing && landing.includes(LOGIN_REDIRECT)) {
      throw new LoginError('Wrong email/username or password');
    }
    if (!session.includes('_primewire_rememberme')) {
      throw new LoginError('PrimeWire did not start a session — try again', 502);
    }
    return { session, landing };
  }
  throw new LoginError(`PrimeWire login failed (${res.status})`, 502);
}

/** End the PrimeWire session (DELETE /sessions, CSRF-protected). */
export async function pwLogout(session: string): Promise<void> {
  try {
    const csrf = await getCsrf(session);
    await authedFetch(session, '/sessions', {
      method: 'DELETE',
      csrfHeader: csrf,
      body: new URLSearchParams({ _csrf_token: csrf }).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch {
    // best-effort — cookie is discarded locally anyway
  } finally {
    // never leave the session's CSRF entry behind after logout
    invalidateCsrf(session);
  }
}

/* ------------------------------------------------------------------ */
/* CSRF                                                                */
/* ------------------------------------------------------------------ */

const csrfCache = new Map<string, { token: string; at: number }>();
const CSRF_TTL = 30 * 60 * 1000;
/** Upper bound so expired sessions that never log out can't grow it forever. */
const CSRF_CACHE_MAX = 128;

/** Fetch a fresh CSRF token for the session (from any page). */
export async function getCsrf(session: string): Promise<string> {
  const cached = csrfCache.get(session);
  if (cached && Date.now() - cached.at < CSRF_TTL) return cached.token;
  const res = await authedFetch(session, '/home');
  const html = await res.text();
  const token =
    /window\.csrf_token\s*=\s*"([^"]+)"/.exec(html)?.[1] ??
    /name="_csrf_token"[^>]*value="([^"]+)"/.exec(html)?.[1] ??
    '';
  if (!token) throw new SessionExpiredError();
  if (csrfCache.size >= CSRF_CACHE_MAX) {
    // Map iterates in insertion order — evict the oldest entry
    const oldest = csrfCache.keys().next().value;
    if (oldest !== undefined) csrfCache.delete(oldest);
  }
  csrfCache.set(session, { token, at: Date.now() });
  return token;
}

export function invalidateCsrf(session: string): void {
  csrfCache.delete(session);
}

/* ------------------------------------------------------------------ */
/* Authed fetch                                                        */
/* ------------------------------------------------------------------ */

export interface AuthedOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Query/body params for form submissions. */
  form?: Record<string, string>;
  /** CSRF token; when set, sent as the X-CSRF-Token header (and _csrf_token form field if form is a string body). */
  csrfHeader?: string;
  /** For PUT-style forms Phoenix uses _method override. */
  methodOverride?: 'put' | 'delete' | 'patch';
  /** Raw body (takes precedence over form). */
  body?: BodyInit | null;
  headers?: Record<string, string>;
  /** Do not treat a redirect to /sessions/new as expiry (login flow only). */
  allowLoginRedirect?: boolean;
}

/**
 * Fetch a PrimeWire page with the user's session cookie.
 * Redirects to the login page (for authed pages) raise SessionExpiredError.
 * Returns the raw Response (unredirected when 302).
 */
export async function authedFetch(session: string, path: string, opts: AuthedOptions = {}): Promise<Response> {
  const method = opts.method ?? 'GET';
  let url = `${PRIMARY_MIRROR}${path}`;
  let body = opts.body ?? null;
  const headers: Record<string, string> = { ...HEADERS, ...opts.headers };

  if (opts.form) {
    const params = new URLSearchParams(opts.form);
    if (opts.methodOverride) params.set('_method', opts.methodOverride);
    if (method === 'GET') {
      const qs = params.toString();
      url += (url.includes('?') ? '&' : '?') + qs;
    } else {
      headers['Content-Type'] ||= 'application/x-www-form-urlencoded';
      body = params.toString();
    }
  } else if (opts.methodOverride && body == null && method === 'POST') {
    headers['Content-Type'] ||= 'application/x-www-form-urlencoded';
    body = new URLSearchParams({ _method: opts.methodOverride }).toString();
  }

  if (opts.csrfHeader) headers['X-CSRF-Token'] = opts.csrfHeader;
  // `session` is a full Cookie line (key + rememberme)
  headers.Cookie = session;

  // timeout: a hung PrimeWire connection must never stall a route worker
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTHED_TIMEOUT_MS);
  // The timer stays armed for the response BODY too — aborting a settled
  // fetch is a no-op, but a slow-dripping body gets cut at the same budget.
  // unref so pending timers never hold the event loop open on shutdown.
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    (timer as { unref?: () => void }).unref?.();
  }

  if (res.status === 302 || res.status === 303) {
    const location = res.headers.get('location') ?? '';
    if (!opts.allowLoginRedirect && (location.includes(LOGIN_REDIRECT) || location.includes(CONFIRM_REDIRECT))) {
      throw new SessionExpiredError();
    }
  }
  return res;
}

/** GET an authed page as text (throws SessionExpiredError when the session is gone). */
export async function authedGet(session: string, path: string, depth = 0): Promise<string> {
  const res = await authedFetch(session, path);
  if (res.status === 302 || res.status === 303) {
    // non-login redirect → follow manually (fetch with redirect:'manual'
    // returns here). Capped so an upstream redirect cycle can never
    // recurse forever.
    const location = res.headers.get('location') ?? '';
    if (location.startsWith('/') && depth < 5) {
      return authedGet(session, location, depth + 1);
    }
    throw new Error(`PrimeWire redirect loop or absolute redirect: ${location}`);
  }
  if (!res.ok) throw new Error(`PrimeWire responded ${res.status}`);
  return res.text();
}

/** GET an authed JSON endpoint. */
export async function authedJson<T>(session: string, path: string): Promise<T> {
  const text = await authedGet(session, path);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('PrimeWire returned a non-JSON response');
  }
}

/** POST an authed form (auto-attaches CSRF). Returns the response text.
 *
 * With `expectRedirect: true`, a 200 response — which Phoenix uses to
 * re-render the form with validation errors — throws `FormRejectedError`
 * instead of silently reporting success. Success on these endpoints is
 * always a redirect.
 */
export async function authedPost(
  session: string,
  path: string,
  form: Record<string, string>,
  extra: Omit<AuthedOptions, 'form' | 'method'> & { expectRedirect?: boolean } = {},
): Promise<string> {
  const { expectRedirect = false, ...opts } = extra;
  const csrf = await getCsrf(session);
  const res = await authedFetch(session, path, {
    ...opts,
    method: 'POST',
    form: { _csrf_token: csrf, ...form },
    csrfHeader: csrf,
  });
  if (res.status === 302 || res.status === 303) {
    const location = res.headers.get('location') ?? '';
    if (location.startsWith('/')) return authedGet(session, location.split('#')[0]);
    return '';
  }
  if (!res.ok) throw new Error(`PrimeWire responded ${res.status}`);
  const text = await res.text();
  if (expectRedirect) {
    // Phoenix re-renders the form (HTTP 200) on validation failure.
    throw new FormRejectedError(extractFormError(text));
  }
  return text;
}

/** Thrown when PrimeWire re-renders a form instead of redirecting (= rejected input). */
export class FormRejectedError extends Error {
  constructor(message = 'PrimeWire rejected the change — check your input') {
    super(message);
    this.name = 'FormRejectedError';
  }
}

/** Best-effort error message extraction from a re-rendered Phoenix form page. */
function extractFormError(html: string): string {
  const inline =
    /class="[^"]*(?:error|alert|invalid)[^"]*"[^>]*>([^<]{3,200})</i.exec(html)?.[1]?.trim();
  if (inline) return inline.replace(/\s+/g, ' ');
  return 'PrimeWire rejected the change — check your input';
}

/** GET an authed action URL (PrimeWire uses GET for many actions). Returns response text. */
export async function authedAction(session: string, path: string): Promise<string> {
  const res = await authedFetch(session, path);
  if (res.status === 302 || res.status === 303) {
    const location = res.headers.get('location') ?? '';
    // drop the fragment, keep the (full) query — a naive split('?')
    // would truncate everything after a second '?'
    if (location.startsWith('/')) return authedGet(session, location.split('#')[0]);
  }
  if (!res.ok) throw new Error(`PrimeWire responded ${res.status}`);
  return res.text();
}

/** Multipart upload (avatar). */
export async function authedUpload(
  session: string,
  path: string,
  file: { bytes: ArrayBuffer; filename: string; type: string },
  extraFields: Record<string, string> = {},
): Promise<string> {
  const csrf = await getCsrf(session);
  const form = new FormData();
  form.set('_method', 'put');
  form.set('_csrf_token', csrf);
  form.set('mysettings', 'Update Avatar');
  for (const [k, v] of Object.entries(extraFields)) form.set(k, v);
  form.set('registration[avatar]', new Blob([file.bytes], { type: file.type }), file.filename);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTHED_TIMEOUT_MS * 2);
  let res: Response;
  try {
    res = await fetch(`${PRIMARY_MIRROR}${path}`, {
      method: 'POST',
      headers: {
        ...HEADERS,
        'X-CSRF-Token': csrf,
        Cookie: session,
        Referer: `${PRIMARY_MIRROR}/registrations/edit`,
      },
      body: form,
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 302 || res.status === 303) {
    const location = res.headers.get('location') ?? '';
    if (location.includes(LOGIN_REDIRECT) || location.includes(CONFIRM_REDIRECT)) {
      throw new SessionExpiredError();
    }
    if (location.startsWith('/')) return authedGet(session, location);
    return '';
  }
  if (!res.ok) throw new Error(`PrimeWire upload failed (${res.status})`);
  return res.text();
}
