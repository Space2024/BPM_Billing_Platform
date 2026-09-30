import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Image optimisation ────────────────────────────────────────────────────
  // Enable Next.js built-in image optimizer (WebP/AVIF, lazy-load, blur-up)
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // cache optimised images for 24 h
  },

  // ── HTTP compression ──────────────────────────────────────────────────────
  compress: true,

  // ── Logging ───────────────────────────────────────────────────────────────
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  /**
   * Data requests are posted to the URL of the page that made them, so nothing
   * in the Network tab names a backend endpoint. This rule is what puts them
   * back on the gateway handler.
   *
   * It matches on the channel header, never on the path, and runs in
   * `beforeFiles` so it resolves ahead of page routing. Requests without the
   * header are untouched, which includes ordinary page loads and Next.js server
   * actions, since those POST to these same URLs.
   *
   * The header literal must match GATEWAY_CHANNEL_HEADER and
   * GATEWAY_CHANNEL_VALUE in app/apollo/lib/gateway-channel.ts. This file
   * cannot resolve the `@/` alias, so the two are kept in step by hand.
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:path*",
          has: [{ type: "header", key: "x-request-channel", value: "1" }],
          destination: "/Gateway/Waterfall",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  // ── Experimental ─────────────────────────────────────────────────────────
  experimental: {
    // Optimise server-action round-trips
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
