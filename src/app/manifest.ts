import type { MetadataRoute } from "next";

import { APP_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: "忠糧 POS",
    description: "園遊會 local-first POS 與記帳系統",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7ed",
    theme_color: "#18181b",
    lang: "zh-TW",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
