/* PrimeStream origin request filter — service worker.
 *
 * Intercepts every request made by pages under our origin and drops the
 * ones whose hostname matches a curated list of known third-party hosts
 * that degrade page stability (pop-unders, redirects, hidden trackers).
 * Video hosts, the catalog API and our own endpoints are never touched.
 *
 * MATCHING: an entry matches its exact hostname AND every subdomain of
 * it (e.g. "example.com" also matches "a.example.com"). These hosts
 * commonly serve from rotating subdomains, so exact-match alone would
 * let nearly everything through in practice.
 */

const FILTERED_HOSTS = [
  // catalog redirector (the splash interstitial inside the player)
  "sorrowfulpsychology.com",
  // pop-under / popup redirect networks used by video hosts
  "propellerads.com",
  "propellerclick.com",
  "propellertracking.com",
  "propelleradsystem.com",
  "pafahrimalar.pro",
  "popads.net",
  "popcash.net",
  "clickadu.com",
  "exoclick.com",
  "exosrv.com",
  "exdynsrv.com",
  "exoclick.net",
  "realsexfilmshub.com",
  "juicyads.com",
  "juicyads.rocks",
  "hilltopads.net",
  "hilltopads.com",
  "onclickalgo.com",
  "onclickmega.com",
  "onclickperformance.com",
  "onclckpprtnty.com",
  "onclickpredictiv.com",
  "adcash.com",
  "adcashrevenue.com",
  "adsterranetwork.com",
  "adsterra.com",
  "revenuehits.com",
  "mgid.com",
  "bmgadvertising.com",
  "trafficshop.com",
  "trafficjunky.com",
  "tsyndicate.com",
  "coinzilla.com",
  "a-ads.com",
  "adnium.com",
  "popmyads.com",
  "waframedia.com",
  "ednoraseveral.org",
  "gulfuphysterical.org",
  "anymarriageive.org",
  "otheraluminumprovocative.org",
  "acetorsionculture.org",
  "magnificentstatisticalhit.com",
  "earnitist.com",
  "takethatdearest.casa",
  "taxiroute.site",
  "higurashineit.org",
  "redundantinitiallycompact.com",
  // additional popunder / redirect networks seen on stream hosts
  "admaven.com",
  "ad-maven.com",
  "inersit.com",
  "meonze.com",
  "revoffers.com",
  "toprevenuegate.com",
  "groovinads.com",
  "monetag.com",
  "rtbhouse.com",
  "adroll.com",
  "criteo.com",
  "criteo.net",
  "taboola.com",
  "outbrain.com",
  "zedo.com",
  "adnxs.com",
  "adnxs-simple.com",
  "casalemedia.com",
  "rubiconproject.com",
  "openx.net",
  "pubmatic.com",
  "smartadserver.com",
  "adf.ly",
  "bc.vc",
  "shrinkme.io",
  "linkvertise.com",
  // hidden third-party trackers the hosts embed
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "googlesyndication.com",
  "adservice.google.com",
];

const BLOCK_SET = new Set(FILTERED_HOSTS);

/** Exact match OR any subdomain of a listed host. */
function isBlocked(host) {
  if (BLOCK_SET.has(host)) return true;
  // walk up: a.b.c.exoclick.com → check every parent until the registrable
  // suffix count is small — checking parent labels up to 3 levels deep keeps
  // this cheap and catches rotated multi-level subdomains.
  const parts = host.split(".");
  for (let i = 1; i < parts.length && i <= 4; i++) {
    if (BLOCK_SET.has(parts.slice(i).join("."))) return true;
  }
  return false;
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" && request.method !== "HEAD") return;

  let host = "";
  try {
    host = new URL(request.url).hostname.toLowerCase();
  } catch {
    return;
  }
  if (!host) return;

  if (isBlocked(host)) {
    // NOTE: 204 is a null-body status — the Response MUST be constructed
    // with an explicit `null` body (an empty string body throws TypeError
    // in Chromium, which would silently disable the interception).
    event.respondWith(new Response(null, { status: 204, statusText: "No Content" }));
  }
});
