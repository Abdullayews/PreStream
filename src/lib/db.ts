import { mkdirSync } from 'fs'
import { dirname, isAbsolute, resolve } from 'path'
import { PrismaClient } from '@prisma/client'

/**
 * Resolve DATABASE_URL once, before any PrismaClient is constructed:
 *  - zero-config on any host: when unset, default to <cwd>/db/custom.db
 *  - a RELATIVE sqlite path is anchored to the process CWD, so runtime
 *    behaviour never depends on where the generated client or the
 *    standalone bundle happens to live
 *  - the containing directory is created on demand (PaaS ephemeral disks
 *    ship without our gitignored db/ folder)
 * Non-sqlite URLs (postgres://, mysql://, …) pass through untouched.
 */
function ensureDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL
  if (!raw || raw.startsWith('file:')) {
    let path = raw ? raw.slice('file:'.length) : ''
    let query = ''
    const q = path.indexOf('?')
    if (q >= 0) {
      query = path.slice(q)
      path = path.slice(0, q)
    }
    path = path.trim()
    if (!path) path = resolve('db', 'custom.db')
    else if (!isAbsolute(path)) path = resolve(/* turbopackIgnore: true */ path)
    try {
      mkdirSync(dirname(path), { recursive: true })
    } catch {
      /* e.g. read-only fs — let Prisma surface the real error instead */
    }
    const url = `file:${path}${query}`
    process.env.DATABASE_URL = url
    return url
  }
  return raw
}

ensureDatabaseUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // errors + warnings only — query logging flooded dev.log and buried
    // real issues (the per-request prisma:query spam)
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/*
 * SQLite storage hardening (runs once per server process):
 *  - WAL journal mode lets readers proceed while a write is in flight —
 *    the classic "database is locked" / SQLITE_BUSY exception under
 *    concurrent API routes cannot happen. WAL is persistent (stored in
 *    the db file), so later connections inherit it automatically.
 *  - busy_timeout gives a writer a grace window instead of failing
 *    instantly if a lock is momentarily held.
 * Both are fire-and-forget: a pragma that can't run (e.g. read-only fs)
 * must never prevent the app from starting.
 */
if (!globalForPrisma.prisma) {
  // NOTE: setting a pragma in SQLite RETURNS a row (the new value):
  //   journal_mode=WAL -> {"journal_mode":"wal"}
  //   busy_timeout=N   -> N
  // $executeRawUnsafe rejects those with "Execute returned results, which
  // is not allowed in SQLite" — one error per pragma per build worker,
  // flooding the Render build logs. $queryRawUnsafe accepts (and reads)
  // the returned rows.
  void db
    .$queryRawUnsafe('PRAGMA journal_mode=WAL;')
    .catch(() => {})
  void db
    .$queryRawUnsafe('PRAGMA busy_timeout=5000;')
    .catch(() => {})
}

/*
 * Self-heal DDL: guarantee the Profile table exists even when the app is
 * started on a fresh host WITHOUT our `npm start` (which normally runs
 * `prisma db push` first — e.g. `node .next/standalone/server.js` on a
 * brand-new PaaS instance with an empty ephemeral disk).
 * Idempotent (IF NOT EXISTS) — a no-op wherever `db push` already ran.
 * ⚠ Keep in sync with prisma/schema.prisma when the model changes.
 */
if (!globalForPrisma.prisma) {
  void (async () => {
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Profile" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "apiKey" TEXT NOT NULL,
          "name" TEXT,
          "username" TEXT,
          "pwUserId" INTEGER,
          "pwSession" TEXT,
          "pwApiKey" TEXT,
          "avatar" TEXT,
          "themeId" TEXT NOT NULL DEFAULT 'mono',
          "watchlist" TEXT NOT NULL DEFAULT '[]',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        )`)
      await db.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "Profile_apiKey_key" ON "Profile"("apiKey")`,
      )
      await db.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "Profile_username_key" ON "Profile"("username")`,
      )
    } catch {
      /* best-effort bootstrap — real errors surface on first query */
    }
  })()
}
