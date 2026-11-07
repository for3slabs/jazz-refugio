import type { MetadataRoute } from "next";

// Lets her phone keep the refuge as an app on its home screen (and is what an iPhone would need
// for notifications). Served without the passphrase: it says nothing about her.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "tu refugio",
    short_name: "tu refugio",
    start_url: "/",
    display: "standalone",
    background_color: "#1a0f1f",
    theme_color: "#1a0f1f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
