/**
 * Single source of truth for PrimeWire mirror origins.
 *
 * To point the app at a different mirror, edit ONLY this file:
 *  - MIRRORS       page fetches try these in order (failover)
 *  - PLAYER_MIRROR origin for /embed/* player iframes — pick the mirror
 *                  with the cleanest playback storage and no JS challenge
 *
 * Sessions are bound to the mirror they were created on: after a switch,
 * signed-in users just sign in again.
 */
export const MIRRORS = ['https://primewire.pw', 'https://primewire.zip'] as const;

export type MirrorOrigin = (typeof MIRRORS)[number];

/** Pages, search, sessions, account sync. */
export const PRIMARY_MIRROR: MirrorOrigin = MIRRORS[0];

/** Player embeds (/embed/*). */
export const PLAYER_MIRROR: MirrorOrigin = 'https://primewire.zip';
