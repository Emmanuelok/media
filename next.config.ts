import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for small Docker
  // images and Node hosts (Railway / Render / Fly.io / Cloud Run). Ignored by
  // Vercel, which has its own optimized build pipeline.
  output: "standalone",
};

export default nextConfig;
