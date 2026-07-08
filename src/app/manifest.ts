import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const value = {
    id: "/",
    name: "Clan Fitness",
    short_name: "Clan Fitness",
    description: "Track gym, steps, and food with your accountability group.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    categories: ["health", "fitness", "lifestyle"],
    background_color: "#0d0d0d",
    theme_color: "#0d0d0d",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Not in the W3C spec (so not in Next.js's Manifest type) but still checked by some Android
    // WebAPK/TWA push code paths — this fixed constant is Chrome's own sender ID, not ours.
    gcm_sender_id: "103953800507",
  };
  return value as MetadataRoute.Manifest;
}
