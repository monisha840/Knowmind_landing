import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the dev overlay out of design screenshots.
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // three.js ships untranspiled ESM examples; keep the transpile hint explicit.
  transpilePackages: ["three"],
};

export default nextConfig;
