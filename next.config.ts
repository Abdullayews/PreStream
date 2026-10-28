import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
