import type { NextConfig } from "next";

/**
 * Origins our pages may frame — our own origin, the PrimeWire/PrimeSrc
 * player mirrors, the external provider embeds registered in
 * src/lib/primewire/external-sources.ts, and YouTube trailer embeds.
 * Every other origin (any third-party ad/redirect network that could ever
 * end up in a frame) is refused by the browser itself.
 */
const FRAME_SRC_ORIGINS = [
  "'self'",
  // PrimeWire player embeds (/embed/*) + the PrimeSrc app origin
  "https://primewire.pw",
  "https://primewire.zip",
  "https://primesrc.me",
  // external provider embeds (keep in sync with EXTERNAL_PROVIDERS)
  "https://vidsrc.to",
  "https://vidlink.pro",
  "https://vidfast.vc",
  "https://www.2embed.cc",
  "https://videm.xyz",
  "https://player.videasy.to",
  // trailer embeds
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
];

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy for the app shell.
 *
 * The app is fully self-contained: every image is proxied same-origin
 * (/api/primewire/image), every fetch targets our own API, fonts are
 * self-hosted by next/font. So everything third-party defaults to "none"
 * and only the explicit frame list above is allowed. Playback happens
 * inside cross-origin iframes that carry their own policy — this CSP
 * governs OUR documents only, and pins them shut.
 */
const csp = [
  "default-src 'self'",
  // Next.js ships inline hydration/bootstrap scripts; dev tooling needs eval
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Tailwind + framer-motion set inline styles/attributes
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  // the client only ever talks to its own API routes
  "connect-src 'self'",
  `frame-src ${FRAME_SRC_ORIGINS.join(" ")}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // no plugins, no <object>/<embed> injection surface
  "object-src 'none'",
  "base-uri 'self'",
  // every app form posts to our own routes
  "form-action 'self'",
  "frame-ancestors 'self'",
  // never upgrade localhost dev traffic to https
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  // keep any dev/Node-facing indicators out of the UI
  devIndicators: false,
  poweredByHeader: false,
  /**
   * Site-wide security headers.
   *
   * HSTS is ignored by browsers when received over plain HTTP, so local
   * dev on http://localhost is unaffected; in production (HTTPS) it locks
   * every future visit to https:// for a full year, all subdomains.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
