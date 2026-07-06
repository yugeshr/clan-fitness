import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  experimental: {
    serverActions: {
      // Default is 1MB; raised to cover photo uploads (app-level cap is 4MB, see uploadPhoto()).
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
