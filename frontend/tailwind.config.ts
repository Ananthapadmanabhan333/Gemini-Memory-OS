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
        background: "#03000a",
        foreground: "#f8fafc",
        card: "rgba(10, 5, 20, 0.45)",
        border: "rgba(255, 255, 255, 0.08)",
        astra: {
          blue: "#00f0ff",
          purple: "#d946ef",
          violet: "#8b5cf6",
          emerald: "#10b981",
          gold: "#eab308",
          coral: "#f43f5e"
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(0, 240, 255, 0.03)",
        "glass-purple": "0 8px 32px 0 rgba(217, 70, 239, 0.03)",
        "neon": "0 0 15px rgba(0, 240, 255, 0.4)",
        "neon-purple": "0 0 15px rgba(217, 70, 239, 0.4)"
      },
      animation: {
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 4s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", filter: "brightness(1) drop-shadow(0 0 2px rgba(0,240,255,0.4))" },
          "50%": { opacity: "0.6", filter: "brightness(1.5) drop-shadow(0 0 8px rgba(0,240,255,0.8))" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        }
      }
    },
  },
  plugins: [],
};
export default config;
