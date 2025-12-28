import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for production
  poweredByHeader: false,

  // Strict mode for better development experience
  reactStrictMode: true,

  // Image optimization settings
  images: {
    unoptimized: false,
  },

  // Disable source maps in production for smaller bundle
  productionBrowserSourceMaps: false,
};

export default nextConfig;
