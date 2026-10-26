import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "C2JC Games",
    short_name: "C2JC Games",
    description: "Track board game interest at C2JC events",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f5",
    theme_color: "#f5f5f5",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
