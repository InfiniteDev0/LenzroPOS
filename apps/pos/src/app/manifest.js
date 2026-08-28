export default function manifest() {
  return {
    name: "Lenzro POS",
    short_name: "Lenzro POS",
    description: "Ring up orders for your restaurant",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
