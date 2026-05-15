// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#b7001c",
        surface: "#fcf8fb",
        "on-surface": "#1b1b1d",
        "surface-container": "#f0edef",
        secondary: "#5e5e5e",
      },
      fontSize: {
        'label-md': ['14px', { lineHeight: '1.2', fontWeight: '500' }],
        'label-sm': ['12px', { lineHeight: '1.2', fontWeight: '600' }],
      },
      spacing: {
        md: "24px",
        'container-max': "1200px",
      }
    },
  },
  plugins: [],
};
export default config;