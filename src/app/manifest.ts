import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fiszki — Kartoteka Pamięci SM-2",
    short_name: "Fiszki",
    description:
      "Osobista kartoteka fiszek z algorytmem SM-2 i skanowaniem notatek przez Gemini AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#09060E",
    theme_color: "#FF4D94",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
