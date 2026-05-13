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

  // ── Experimental ─────────────────────────────────────────────────────────
  experimental: {
    // Optimise server-action round-trips
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
