import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1A1A2E",
        yellow: "#FFE135",
        orange: "#FF6B35",
        pink: "#FF3D7F",
        teal: "#00C9A7",
        purple: "#7B2FBE"
      },
      borderRadius: {
        xl2: "16px",
        xl3: "20px",
        xl4: "28px"
      },
      boxShadow: {
        pop: "0 10px 30px rgba(0, 0, 0, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
