import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 五行色系 — 對應卡牌設計規格
        wood: { bg: "#0a1a0c", main: "#9dd89d" },
        fire: { bg: "#160a05", main: "#e8704a" },
        earth: { bg: "#141008", main: "#d4a845" },
        metal: { bg: "#0a0e16", main: "#a8cce0" },
        water: { bg: "#060c18", main: "#6090d0" },
        // 金框
        gold: {
          dark: "#a87a20",
          main: "#c49830",
          light: "#ecca5a",
        },
        ink: {
          DEFAULT: "#0a0a0a",
          soft: "#151515",
          edge: "#1f1f1f",
        },
      },
      fontFamily: {
        serif: [
          "Noto Serif TC",
          "Source Han Serif TC",
          "PingFang TC",
          "serif",
        ],
        sans: ["Noto Sans TC", "PingFang TC", "sans-serif"],
      },
      boxShadow: {
        card: "0 0 0 1px #c49830, 0 10px 40px -10px rgba(236, 202, 90, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
