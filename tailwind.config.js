/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0D12",
        surface: "#12151C",
        border: "#1F2430",
        foreground: "#E6E8EE",
        muted: "#8B93A7",
        accent: {
          DEFAULT: "oklch(0.62 0.23 256.76)",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        border: "#1F2430",
        input: "#3A3F4B",
        ring: "#7C5CFF",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "mono"],
      },
    },
  },
  plugins: [],
};
