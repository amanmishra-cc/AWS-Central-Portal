import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          500: "#FF6B00",
          600: "#E05F00",
        },
      },
    },
  },
  plugins: [],
};

export default config;
