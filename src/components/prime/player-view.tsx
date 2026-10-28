"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  Globe,
  Layers,
  Loader2,
  Maximize2,
  MonitorPlay,
  Play,
  RefreshCw,
  Tv,
  Volume2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PlayerResponse, PlayerSource } from "@/lib/primewire/types";
import type { HostHealth, HostStatus } from "@/lib/primewire/hosts";
import type { ProviderHealth, ProviderStatus } from "@/lib/primewire/external-sources";
import { hostPriorityRank } from "@/lib/primewire/hosts";
import { imgUrl, useExternalProviders, useHostHealth, usePlayer } from "./hooks/use-primewire";
import { playerHref, toDetail, toHome } from "./nav";
import { useWatchSync, WatchSyncButton } from "./player-sync";

/** Detect Dolby / multichannel audio markers in a source's file name. */
function dolbyLabel(source: PlayerSource): string | null {
  const text = `${source.fileName ?? ""} ${source.quality ?? ""}`.toLowerCase();
  if (text.includes("atmos")) return "Dolby Atmos";
  if (/(5[._ ]?1|6[._ ]?1)/.test(text)) return "Dolby 5.1";
  if (/(7[._ ]?1)/.test(text)) return "Dolby 7.1";
  return null;
}

/** Human quality label — explicit quality field or parsed from the file name. */
function qualityLabel(source: PlayerSource): string | null {
  if (source.quality) return source.quality;
  const m = (source.fileName ?? "").match(/\b(2160p|1440p|1080[pi]|720[pi]|480[pi]|4k|HD|DVD|CAM)\b/i);
  return m ? m[1].toUpperCase() : null;
}

/** Sort class for a host status: lower = offered earlier in the picker. */
function statusClass(status: HostStatus | null | undefined): number {
  if (status === "ready") return 0;
  if (status == null || status === "unknown") return 1; // unverified / bot-gated
  if (status === "external") return 2;
  return 3; // dead
}

/**
 * Open one EXACT file in a small player window.
 *
 * Why a window and not our iframe: PrimeWire only resolves a source link
 * (the `/links/gos/<key>` handshake) in a top-level browsing context —
 * the gos page ships `frame-ancestors 'self'` and the resolver endpoint
 * is Cloudflare-gated for servers, so embedding it is impossible by
 * design. A user-triggered popup is a top-level context exactly like the
 * "open on PrimeWire" tab, but sized and centred like a player. If the
 * popup is blocked we fall back to a plain tab.
 *
 * This is the per-file control the original site gives you (clicking a
 * specific version there runs the same gos handshake) — offered here for
 * every file row, because a host pick draws one of its files at random.
 */
function openFilePlayer(url: string, key: string) {
  const w = Math.min(1024, Math.round(window.screen.availWidth * 0.82));
  const h = Math.min(660, Math.round(window.screen.availHeight * 0.82));
  const left = Math.max(0, Math.round((window.screen.availWidth - w) / 2));
  const top = Math.max(0, Math.round((window.screen.availHeight - h) / 2));
  const features = `popup=yes,width=${w},height=${h},left=${left},top=${top}`;
  const win = window.open(url, `prestream-file-${key}`, features);
  if (win) {
    // detach the opener so a third-party player page can never touch our tab
    win.opener = null;
  } else {
    // popup blocked → plain tab
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * The in-app player page.
 *
 * Playback runs on PrimeWire's own embeddable player (the PrimeSrc app at
 * primewire.zip/embed/…), which is the only construct in which the
 * source→link handshake can succeed: the handshake (`/api/v1/l`) sits
 * behind a Cloudflare managed challenge that only the *viewer's* real
 * browser can pass. The mirrors ship `frame-ancestors *` on /embed/*
 * precisely so it can be embedded anywhere.
 *
 * Sources come from TWO registries:
 *  - PrimeWire's own hosts (Voe, Streamtape, …) steered per-host via
 *    `serverOrder=HostA,HostB` — per-HOST control only (PrimeWire's
 *    sources API returns each host's links in RANDOM order, so which FILE
 *    starts is a draw, true on primewire.pw itself too).
 *  - EXTERNAL providers (VidSrc, 2Embed, VidLink, VidFast, Videm,
 *    Videasy) — embeddable players that address titles by TMDB id (the
 *    very id PrimeWire ships in its embed params); each row is
 *    health-probed like a PrimeWire host.
 *
 * Watch sync: picking an external provider records the watch on the
 * signed-in user's PrimeWire account (episode checkmark + Watching/…
 * status tag) — the player-sync panel also offers manual tagging.
 *
 * Exact per-FILE choice of a PrimeWire host is only possible through the
 * player's own server menu, top-right INSIDE the player frame — its
 * numbered rows play a specific link. That menu is deliberately left
 * uncovered so a dead draw can be recovered without leaving the page.
 *
 * IFRAME SANDBOX RULES: PrimeWire's own player stays sandboxed
 * (scripts + same-origin + forms, pop-ups off — it tolerates it and the
 * sandbox strips its pop-under ads). Most EXTERNAL providers cannot be
 * sandboxed at all: they ship detectors (frameElement.hasAttribute
 * ('sandbox') walking every ancestor + document-domain / PDF-object /
 * popup fallback probes) that refuse to play inside ANY sandboxed frame
 * ("Sandbox not allowed" / "Please Disable Sandbox") — presence-based,
 * so the attribute must be dropped entirely. Each provider ships its
 * policy through ProviderHealth.sandbox; whatever those pages do on
 * their own site is simply carried over, same as visiting them directly.
 */
export function PlayerView({
  type,
  id,
  slug,
  season,
  number,
}: {
  type: string | null;
  id: string | null;
  slug: string | null;
  season: string | null;
  number: string | null;
}) {
  const router = useRouter();

  const valid =
    (type === "movie" || type === "tv") &&
    id !== null &&
    /^\d+$/.test(id) &&
    typeof slug === "string" &&
    slug.length > 0;

  const { data, isLoading, isError, error } = usePlayer(
    valid ? type : null,
    id,
    slug,
    season,
    number,
  );

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      toHome(router);
    }
  };

  if (!valid) {
    return (
      <PlayerError
        title="Nothing to play"
        message="The link is malformed or this title does not exist."
        onBack={() => toHome(router)}
      />
    );
  }

  if (isLoading) return <PlayerSkeleton />;

  if (isError || !data) {
    return (
      <PlayerError
        title="Couldn't load the player"
        message={
          error instanceof Error
            ? error.message
            : "PrimeWire could not be reached."
        }
        onBack={() => toHome(router)}
      />
    );
  }

  return (
    <PlayerLoaded
      key={`${data.type}:${data.id}:${data.season ?? 0}:${data.number ?? 0}`}
      data={data}
      onBack={handleBack}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Loaded player                                                       */
/* ------------------------------------------------------------------ */

/**
 * The last external provider picked for a show — kept across episode
 * switches within the same title so binge-watching on another provider
 * doesn't reset to a PrimeWire host on every next episode. Cleared the
 * moment the user picks a PrimeWire host again.
 */
const lastProviderPick = new Map<string, string>();

function PlayerLoaded({
  data,
  onBack,
}: {
  data: PlayerResponse;
  onBack: () => void;
}) {
  const router = useRouter();
  const isEpisode = data.type === "tv";
  const poster = imgUrl(data.poster, "w300");

  /* ------------ watch sync (PrimeWire account record) ------------ */
  const sync = useWatchSync(data);

  /* ------------ player shell state ------------ */
  const [reloadNonce, setReloadNonce] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  /* ------------ source ordering & selection ------------ */
  const uniqueHosts = useMemo(
    () => [...new Set(data.sources.map((s) => s.host))],
    [data.sources],
  );
  const healthQuery = useHostHealth(uniqueHosts);
  const hostHealth = healthQuery.data;
  const healthLoading = uniqueHosts.length > 0 && healthQuery.isPending;

  const statusOf = useCallback(
    (host: string): HostStatus | null => hostHealth?.get(host)?.status ?? null,
    [hostHealth],
  );

  /** Rank: verified hosts first, then priority order, then API order. */
  const sortedSources = useMemo(() => {
    const ranked = data.sources.map((source, index) => ({
      source,
      index,
      rank:
        statusClass(statusOf(source.host)) * 1000 + hostPriorityRank(source.host),
    }));
    return ranked.sort((a, b) => a.rank - b.rank || a.index - b.index);
  }, [data.sources, statusOf]);

  /** Key of the row the user explicitly picked (goUrl is unique per source). */
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  /* ------------ external providers (other sources) ------------ */
  const providersQuery = useExternalProviders(
    data.type,
    data.tmdbId,
    data.season,
    data.number,
  );
  const providers = useMemo(
    () => providersQuery.data?.providers ?? [],
    [providersQuery.data],
  );
  const providersLoading = providersQuery.isPending && data.tmdbId != null;

  /** External provider currently playing (id into the provider registry). */
  const rememberedProvider = useMemo(
    () => lastProviderPick.get(`${data.type}:${data.id}`) ?? null,
    [data.type, data.id],
  );
  const [selectedProvider, setSelectedProvider] = useState<string | null>(rememberedProvider);

  /** The provider actually playing (once its health row resolved). */
  const effectiveProvider = useMemo(
    () => (selectedProvider ? providers.find((p) => p.id === selectedProvider) ?? null : null),
    [selectedProvider, providers],
  );
  /**
   * A remembered provider whose health row hasn't resolved YET. Once the
   * query has settled and the id is still unknown it's a STALE pick (the
   * registry rotates — e.g. Nunflix was removed after its domain parked):
   * fall back to the PrimeWire player instead of spinning forever. Derived
   * at render — no state reset needed; the memory clears on the next pick.
   */
  const providerResolving =
    selectedProvider != null && effectiveProvider == null && providersQuery.isPending;

  /* Binge-sync: when the player mounts on a NEW episode with a remembered
     external provider (auto-resume), that episode was also opened from
     another source — record it on the PrimeWire account too. Fires once per
     episode mount (PlayerLoaded remounts per episode). */
  const syncedRestored = useRef(false);
  useEffect(() => {
    if (syncedRestored.current || !rememberedProvider || !sync.signedIn) return;
    if (selectedProvider !== rememberedProvider) return; // user already switched away
    if (effectiveProvider == null) return; // stale registry id — nothing is playing
    syncedRestored.current = true;
    void sync.syncWatch(rememberedProvider);
  }, [rememberedProvider, selectedProvider, effectiveProvider, sync]);

  const effective = useMemo(() => {
    if (selectedKey) {
      const found = sortedSources.find((e) => e.source.goUrl === selectedKey);
      if (found) return found;
    }
    return sortedSources[0] ?? null;
  }, [selectedKey, sortedSources]);

  const effectiveStatus = effective ? statusOf(effective.source.host) : null;
  const externalOnly = effectiveStatus === "external";

  /** Host order handed to the player: chosen host first, the rest by rank. */
  const serverOrderParam = useMemo(() => {
    if (!effective) return null;
    const seen = new Set<string>([effective.source.host]);
    const order = [effective.source.host];
    for (const e of sortedSources) {
      if (!seen.has(e.source.host)) {
        seen.add(e.source.host);
        order.push(e.source.host);
      }
    }
    return order.join(",");
  }, [effective, sortedSources]);

  const embedSrc = useMemo(() => {
    if (!data.embedUrl || !serverOrderParam) return null;
    const sep = data.embedUrl.includes("?") ? "&" : "?";
    // a=1 → the splash becomes a pure play trigger (no ad link) and the
    // host player gets autoplay once the link resolves.
    return `${data.embedUrl}${sep}serverOrder=${encodeURIComponent(serverOrderParam)}&a=1`;
  }, [data.embedUrl, serverOrderParam]);

  /** What the frame actually loads: the external provider when one is
   *  playing, otherwise PrimeWire's embed player. */
  const activeSrc = effectiveProvider ? effectiveProvider.url : embedSrc;

  const frameKey = `${activeSrc ?? "none"}|${reloadNonce}`;

  const anyDolby = useMemo(
    () => data.sources.some((s) => dolbyLabel(s)),
    [data.sources],
  );

  const reloadPlayer = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  const pickSource = useCallback(
    (source: PlayerSource) => {
      setSourcesOpen(false);
      // Choosing a PrimeWire host again forgets the external provider.
      lastProviderPick.delete(`${data.type}:${data.id}`);
      setSelectedProvider(null);
      if (selectedKey === source.goUrl) {
        // Picking the row that's already playing = reload it.
        reloadPlayer();
        return;
      }
      setSelectedKey(source.goUrl);
    },
    [selectedKey, reloadPlayer, data.type, data.id],
  );

  const pickProvider = useCallback(
    (provider: ProviderHealth) => {
      setSourcesOpen(false);
      lastProviderPick.set(`${data.type}:${data.id}`, provider.id);
      const rePick = selectedProvider === provider.id;
      if (!rePick) {
        setSelectedProvider(provider.id);
        setSelectedKey(null);
        // Watch-sync: record the externally-sourced play on the user's
        // PrimeWire account (episode checkmark + status tag).
        if (sync.signedIn) void sync.syncWatch(provider.id);
      } else {
        reloadPlayer();
      }
    },
    [selectedProvider, reloadPlayer, sync, data.type, data.id],
  );

  const goEpisode = (
    target: { season: number; number: number },
    mode: "push" | "replace" = "push",
  ) => {
    const href = playerHref({
      type: data.type,
      id: data.id,
      slug: data.slug,
      season: target.season,
      number: target.number,
    });
    if (mode === "replace") router.replace(href);
    else router.push(href);
  };

  /* fullscreen tracking */
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = frameRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen().catch(() => {});
    }
  }, []);

  /* keyboard shortcuts — f fullscreen, r reload, n/p episode */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "r" || e.key === "R") reloadPlayer();
      else if ((e.key === "n" || e.key === "N") && data.next) goEpisode(data.next);
      else if ((e.key === "p" || e.key === "P") && data.prev) goEpisode(data.prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data.next, data.prev, toggleFullscreen, reloadPlayer]);

  return (
    <div>
      {/* ---------------- top bar ---------------- */}
      <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="glass flex h-11 items-center gap-1.5 rounded-full pr-4 pl-3 text-sm font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-5" aria-hidden />
            Back
          </button>

          <button
            type="button"
            onClick={() =>
              toDetail(router, { type: data.type, id: data.id, slug: data.slug })
            }
            className="glass hidden h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
          >
            <Layers className="size-4" aria-hidden />
            Title details
          </button>
        </div>
      </div>

      {/* theater layout — the player spans the full width */}
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        {/* ---------------- header ---------------- */}
        <div className="mb-6 flex items-center gap-4">
          <div className="hidden h-[84px] w-14 shrink-0 overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10 sm:block">
            {poster ? (
              <img src={poster} alt="" aria-hidden className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {isEpisode ? (
                  <Tv className="size-5 text-muted-foreground/50" aria-hidden />
                ) : (
                  <Film className="size-5 text-muted-foreground/50" aria-hidden />
                )}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
              {data.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {isEpisode ? (
                <span className="font-semibold text-foreground">
                  S{String(data.season).padStart(2, "0")}
                  E{String(data.number).padStart(2, "0")}
                  {data.episodeName ? ` — ${data.episodeName}` : ""}
                </span>
              ) : (
                <span className="uppercase tracking-wide">Movie</span>
              )}
              {data.year != null && <span>{data.year}</span>}
              {data.airDate && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" aria-hidden />
                  {data.airDate}
                </span>
              )}
              {anyDolby && (
                <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold tracking-wide">
                  <Volume2 className="size-3" aria-hidden />
                  DOLBY 5.1
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ---------------- player ---------------- */}
        <div
          ref={frameRef}
          className={cn(
            "glass overflow-hidden rounded-2xl p-2 sm:p-3",
            fullscreen && "flex h-full flex-col justify-center bg-black p-0",
          )}
        >
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-xl bg-black",
              fullscreen ? "aspect-video max-h-full max-w-full" : "aspect-video",
            )}
          >
            {activeSrc && effectiveProvider ? (
              <>
                {/* External provider (VidSrc / 2Embed / VidLink / VidFast /
                    Videm / Videasy) — a verified embeddable player addressed
                    by the title's TMDB id. SANDBOX: most of these providers
                    ship detectors that refuse to play inside ANY sandboxed
                    frame ("Please Disable Sandbox") — the attribute is only
                    applied when the provider's policy asks for it, and
                    dropped entirely otherwise (see the header comment). */}
                <iframe
                  key={frameKey}
                  src={activeSrc}
                  title={`${data.title}${isEpisode ? ` S${data.season}E${data.number}` : ""} — ${effectiveProvider.name}`}
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  {...(effectiveProvider.sandbox
                    ? { sandbox: effectiveProvider.sandbox }
                    : {})}
                  className="absolute inset-0 h-full w-full border-0"
                />
              </>
            ) : providerResolving ? null : embedSrc && effective && !externalOnly ? (
              <>
                <iframe
                  key={frameKey}
                  src={embedSrc}
                  title={`${data.title}${isEpisode ? ` S${data.season}E${data.number}` : ""} player`}
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  // Sandbox without allow-popups: strips the player's
                  // pop-under ads while scripts, same-origin storage and
                  // playback keep working.
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  className="absolute inset-0 h-full w-full border-0"
                />
              </>
            ) : externalOnly && effective ? (
              <PlayerSourceBlocked
                host={effective.source.host}
                goUrl={effective.source.goUrl}
                onBrowse={() => setSourcesOpen(true)}
              />
            ) : (
              <PlayerEmpty
                title="No sources yet"
                message={
                  data.tmdbId != null
                    ? "PrimeWire users haven't submitted video links for this yet — open Sources and try the other providers."
                    : "PrimeWire users haven't submitted video links for this yet — check back later."
                }
              />
            )}

            {/* The site itself shows NO loading
                text over the player — only the embedded source's own loading
                state (rendered inside the iframe) is visible, unmodified. */}
          </div>

          {/* ---------- control bar ---------- */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1 pb-1">
            {/* source picker */}
            <Popover open={sourcesOpen} onOpenChange={setSourcesOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-full bg-foreground/5 px-3.5 text-xs font-semibold transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Browse and switch sources"
                >
                  <MonitorPlay className="size-4" aria-hidden />
                  {effectiveProvider
                    ? effectiveProvider.name
                    : effective
                      ? effective.source.host
                      : "Sources"}
                  {!effectiveProvider && data.sources.length > 0 && (
                    <span className="font-medium text-muted-foreground">
                      ·{" "}
                      {
                        [
                          ...new Set(
                            data.sources.map((s) => s.host),
                          ),
                        ].length
                      }{" "}
                      hosts
                      {providers.length > 0 ? ` · ${providers.length} providers` : ""}
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform",
                      sourcesOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-96 p-0">
                <SourcesPopover
                  data={data}
                  entries={sortedSources}
                  health={hostHealth}
                  healthLoading={healthLoading}
                  selectedKey={effective?.source.goUrl ?? null}
                  onPick={pickSource}
                  providers={providers}
                  providersLoading={providersLoading}
                  selectedProvider={selectedProvider}
                  onPickProvider={pickProvider}
                />
              </PopoverContent>
            </Popover>

            {/* watch sync + status tag (PrimeWire account record) */}
            <WatchSyncButton sync={sync} />

            <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

            {/* episode prev/next */}
            {isEpisode && (
              <>
                <button
                  type="button"
                  disabled={!data.prev}
                  onClick={() => data.prev && goEpisode(data.prev)}
                  aria-label={`Previous episode${data.prev ? ` (S${data.prev.season}E${data.prev.number})` : ""}`}
                  className="flex size-9 items-center justify-center rounded-full bg-foreground/5 transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  disabled={!data.next}
                  onClick={() => data.next && goEpisode(data.next)}
                  aria-label={`Next episode${data.next ? ` (S${data.next.season}E${data.next.number})` : ""}`}
                  className="flex size-9 items-center justify-center rounded-full bg-foreground/5 transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              {/* reload */}
              <button
                type="button"
                onClick={reloadPlayer}
                aria-label="Reload the player"
                title="Reload player (R)"
                className="flex size-9 items-center justify-center rounded-full bg-foreground/5 transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RefreshCw className="size-4" aria-hidden />
              </button>
              {/* fullscreen */}
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label="Toggle fullscreen"
                title="Fullscreen (F)"
                className="flex size-9 items-center justify-center rounded-full bg-foreground/5 transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Maximize2 className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {/* TV episode navigator */}
        {isEpisode && data.episodes.length > 0 && (
          <div className="mt-6">
            <EpisodeNavigator data={data} onPick={(t) => goEpisode(t, "replace")} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sources popover                                                     */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: HostStatus | null }) {
  if (status === "external") {
    return (
      <span
        className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground"
        title="This host blocks embedding everywhere (X-Frame-Options) — it can only be opened in a new tab"
      >
        <ExternalLink className="size-3" aria-hidden />
        Can&apos;t embed
      </span>
    );
  }
  if (status === "dead") {
    return (
      <span
        className="flex shrink-0 items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground/70"
        title="Host domain is unreachable"
      >
        <XCircle className="size-3" aria-hidden />
        Offline
      </span>
    );
  }
  return null;
}

/** Health badge for the external providers — only a genuinely dead
 *  provider gets a badge; online and bot-gated-but-alive rows stay clean
 *  (bot-gated probes usually still play fine in a real browser). */
function ProviderStatusBadge({ status }: { status: ProviderStatus }) {
  if (status === "dead") {
    return (
      <span
        className="flex shrink-0 items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground/70"
        title="Provider is offline right now"
      >
        <XCircle className="size-3" aria-hidden />
        Offline
      </span>
    );
  }
  return null;
}

function SourcesPopover({
  data,
  entries,
  health,
  healthLoading,
  selectedKey,
  onPick,
  providers,
  providersLoading,
  selectedProvider,
  onPickProvider,
}: {
  data: PlayerResponse;
  entries: { source: PlayerSource; index: number }[];
  health: Map<string, HostHealth> | undefined;
  healthLoading: boolean;
  selectedKey: string | null;
  onPick: (source: PlayerSource) => void;
  providers: ProviderHealth[];
  providersLoading: boolean;
  selectedProvider: string | null;
  onPickProvider: (provider: ProviderHealth) => void;
}) {
  /* Group the (already health+priority sorted) links by host — the unit the
     player can actually be steered by. */
  const groups: {
    host: string;
    sources: { source: PlayerSource; index: number }[];
  }[] = [];
  for (const e of entries) {
    const last = groups[groups.length - 1];
    if (last && last.host === e.source.host) last.sources.push(e);
    else groups.push({ host: e.source.host, sources: [e] });
  }

  return (
    <div>
      <div className="border-b border-border/70 px-4 py-3">
        <p className="text-sm font-semibold">
          {data.sources.length > 0
            ? `${data.sources.length} links · ${groups.length} hosts`
            : groups.length === 0
              ? "PrimeWire sources"
              : `${groups.length} hosts`}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Tap a host to play it — one of its files is drawn at random (same
          on PrimeWire). For an exact file, hit ▶ on it — it opens in a
          player window. Hosts are checked live —{" "}
          <span className="inline-flex items-center gap-1">
            <ExternalLink className="size-3" aria-hidden /> new tab only
          </span>{" "}
          <span className="inline-flex items-center gap-1">
            <XCircle className="size-3" aria-hidden /> offline
          </span>
        </p>
        {healthLoading && (
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Checking hosts…
          </p>
        )}
      </div>
      <div className="thin-scrollbar max-h-80 overflow-y-auto p-2">
        {data.sources.length === 0 && (
          <p className="px-2 pb-2 pt-1 text-xs leading-relaxed text-muted-foreground">
            PrimeWire users haven&apos;t submitted video links for{" "}
            {data.type === "tv" ? "this episode" : "this movie"} yet — try
            the other providers below.
          </p>
        )}
        {groups.map((group, gi) => {
          const status = health?.get(group.host)?.status ?? null;
          const dead = status === "dead";
          const selected =
            selectedKey !== null &&
            group.sources.some((e) => e.source.goUrl === selectedKey);
          const qualities = [
            ...new Set(
              group.sources
                .map((e) => qualityLabel(e.source))
                .filter((q): q is string => !!q),
            ),
          ];
          return (
            <div key={group.host} className="mb-1 last:mb-0">
              {/* ---- host row: the playable unit ---- */}
              <div
                role="button"
                tabIndex={dead ? -1 : 0}
                aria-disabled={dead || undefined}
                aria-pressed={selected}
                onClick={() => !dead && onPick(group.sources[0].source)}
                onKeyDown={(e) => {
                  if (dead) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPick(group.sources[0].source);
                  }
                }}
                title={
                  dead
                    ? "This host's domain is offline"
                    : status === "external"
                      ? `${group.host} blocks embedding — view details, then open in a new tab`
                      : `Play via ${group.host}`
                }
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  dead
                    ? "cursor-not-allowed opacity-45"
                    : "cursor-pointer hover:bg-foreground/5",
                  selected && "bg-foreground/5 ring-1 ring-foreground/25",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    selected ? "bg-primary text-primary-foreground" : "bg-foreground/10",
                  )}
                >
                  {selected ? <Play className="size-3.5 fill-current" aria-hidden /> : gi + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">{group.host}</span>
                    <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                      {group.sources.length} {group.sources.length === 1 ? "link" : "links"}
                    </span>
                    {qualities.length > 0 && (
                      <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
                        {qualities.slice(0, 2).join(" / ")}
                        {qualities.length > 2 ? " +" : ""}
                      </span>
                    )}
                    <StatusBadge status={status} />
                    {selected && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        <Play className="size-2.5 fill-current" aria-hidden />
                        PLAYING
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* ---- per-file rows: pickable one-exact-file — a host pick
                  draws a random file, so each row offers its exact file in a
                  player window (same gos handshake as clicking the version
                  on PrimeWire itself) ---- */}
              <div className="ml-6 mr-2 mb-0.5 border-l border-border/60 pl-2">
                {group.sources.map(({ source, index }) => {
                  const dolby = dolbyLabel(source);
                  const key = source.goUrl.split("/").pop() ?? String(index);
                  return (
                    <div
                      key={`${source.goUrl}-${index}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => openFilePlayer(source.goUrl, key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openFilePlayer(source.goUrl, key);
                        }
                      }}
                      title={`Play this exact ${group.host} file in a player window`}
                      className="group/file flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground/60 transition-colors group-hover/file:bg-primary group-hover/file:text-primary-foreground"
                        aria-hidden
                      >
                        <Play className="size-2.5 fill-current" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs">
                        {source.fileName || `Link ${index + 1}`}
                      </span>
                      {source.fileSize && (
                        <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground/70">
                          {source.fileSize}
                        </span>
                      )}
                      {dolby && (
                        <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
                          {dolby.replace("Dolby ", "")}
                        </span>
                      )}
                      <a
                        href={source.goUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        // hover-revealed — on touch there is no hover, so
                        // hide it entirely instead of wasting row space
                        className="hidden size-6 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/file:opacity-100 sm:flex"
                        aria-label={`Open this ${group.host} file on PrimeWire in a new tab`}
                        title="Open this exact file on PrimeWire in a new tab"
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ---- other providers: external embeddable sources ---- */}
        <div className="mt-2 border-t border-border/70 pt-2">
          <p className="flex items-center gap-1.5 px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Globe className="size-3" aria-hidden />
            Other providers
            {providersLoading && (
              <Loader2 className="size-3 animate-spin" aria-hidden />
            )}
          </p>
          {data.tmdbId == null ? (
            <p className="px-2 py-2 text-xs leading-relaxed text-muted-foreground">
              This title has no TMDB id on PrimeWire, so other providers
              can&apos;t match it.
            </p>
          ) : (
            providers.map((p) => {
              const dead = p.status === "dead";
              const selected = selectedProvider === p.id;
              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={dead ? -1 : 0}
                  aria-disabled={dead || undefined}
                  aria-pressed={selected}
                  onClick={() => !dead && onPickProvider(p)}
                  onKeyDown={(e) => {
                    if (dead) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPickProvider(p);
                    }
                  }}
                  title={
                    dead
                      ? `${p.name} is offline right now`
                      : `Play via ${p.name} — recorded to your PrimeWire account`
                  }
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    dead
                      ? "cursor-not-allowed opacity-45"
                      : "cursor-pointer hover:bg-foreground/5",
                    selected && "bg-foreground/5 ring-1 ring-foreground/25",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      selected ? "bg-primary text-primary-foreground" : "bg-foreground/10",
                    )}
                  >
                    {selected ? (
                      <Play className="size-3.5 fill-current" aria-hidden />
                    ) : (
                      <Globe className="size-3.5" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold">{p.name}</span>
                      <ProviderStatusBadge status={p.status} />
                      {selected && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                          <Play className="size-2.5 fill-current" aria-hidden />
                          PLAYING
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {p.note}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {data.tmdbId != null && !providersLoading && providers.length === 0 && (
            <p className="px-2 py-2 text-xs leading-relaxed text-muted-foreground">
              No other providers available right now.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* External-only source panel                                          */
/* ------------------------------------------------------------------ */

function PlayerSourceBlocked({
  host,
  goUrl,
  onBrowse,
}: {
  host: string;
  goUrl: string;
  onBrowse: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-white/10">
        <ExternalLink className="size-6 text-white/70" aria-hidden />
      </div>
      <div>
        <p className="font-semibold text-white">{host} can&apos;t be embedded</p>
        <p className="mt-1 max-w-md text-sm leading-relaxed text-white/60">
          This host blocks players from loading its pages (X-Frame-Options) —
          everywhere, PrimeWire included. The link itself still works: open it
          in a new tab, or pick a different source below.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <a
          href={goUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          Open {host} in a new tab
          <ExternalLink className="size-4" aria-hidden />
        </a>
        <button
          type="button"
          onClick={onBrowse}
          className="flex h-10 items-center gap-2 rounded-full border border-white/30 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <MonitorPlay className="size-4" aria-hidden />
          Pick another source
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Episode navigator                                                   */
/* ------------------------------------------------------------------ */

function EpisodeNavigator({
  data,
  onPick,
}: {
  /** Only rendered for TV, where season/number/episodes are populated. */
  data: PlayerResponse;
  onPick: (target: { season: number; number: number }) => void;
}) {
  const seasons = useMemo(
    () => [...new Set(data.episodes.map((e) => e.season))].sort((a, b) => a - b),
    [data.episodes],
  );
  const currentSeason = data.season ?? seasons[0] ?? 1;
  const [season, setSeason] = useState<number>(currentSeason);

  const episodes = useMemo(
    () => data.episodes.filter((e) => e.season === season),
    [data.episodes, season],
  );

  return (
    <section aria-label="Episode navigator" className="glass rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!data.prev}
          onClick={() => data.prev && onPick(data.prev)}
          className="h-9 rounded-full px-4"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Prev
        </Button>

        <Select value={String(season)} onValueChange={(v) => setSeason(Number(v))}>
          <SelectTrigger className="h-9 w-[180px] rounded-full" aria-label="Select season">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {seasons.map((s) => (
              <SelectItem key={s} value={String(s)}>
                Season {s} ({data.episodes.filter((e) => e.season === s).length} episodes)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          disabled={!data.next}
          onClick={() => data.next && onPick(data.next)}
          className="h-9 rounded-full px-4"
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Button>

        <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
          {data.episodes.length} episodes total
        </span>
      </div>

      <div
        role="tablist"
        aria-label={`Season ${season} episodes`}
        className="thin-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1"
      >
        {episodes.map((ep) => {
          const active = ep.season === data.season && ep.number === data.number;
          return (
            <button
              key={`${ep.season}-${ep.number}`}
              type="button"
              role="tab"
              aria-selected={active}
              title={ep.name}
              onClick={() => onPick({ season: ep.season, number: ep.number })}
              className={cn(
                "flex h-9 min-w-14 shrink-0 items-center justify-center gap-1 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                !ep.released && !active && "opacity-50",
              )}
            >
              {active && <Play className="size-3 fill-current" aria-hidden />}
              E{ep.number}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Empty / error / skeleton                                            */
/* ------------------------------------------------------------------ */

function PlayerEmpty({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-white/10">
        <Play className="size-6 text-white/70" aria-hidden />
      </div>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-white/60">{message}</p>
      </div>
    </div>
  );
}

function PlayerError({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <Film className="size-7 text-destructive" aria-hidden />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      </div>
      <Button className="rounded-full" onClick={onBack}>
        Back to home
      </Button>
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="mb-6 h-11 w-24 animate-pulse rounded-full bg-card" />
      <div className="mb-6 flex items-center gap-4">
        <div className="hidden h-[84px] w-14 animate-pulse rounded-lg bg-card sm:block" />
        <div className="space-y-2">
          <div className="h-7 w-64 animate-pulse rounded-lg bg-card" />
          <div className="h-4 w-40 animate-pulse rounded-lg bg-card" />
        </div>
      </div>
      <div className="aspect-video w-full animate-pulse rounded-2xl bg-card" />
      <div className="mt-6 h-24 animate-pulse rounded-2xl bg-card" />
    </div>
  );
}
