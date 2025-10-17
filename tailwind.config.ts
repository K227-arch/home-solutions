import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#d1d9e0",
        input: "#eff2f5",
        ring: "#00b4d8",
        background: "#ffffff",
        foreground: "#0a192f",
        primary: {
          DEFAULT: "#0077b6",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#00b4d8",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#94a3b8",
          foreground: "#737f8d",
        },
        accent: {
          DEFAULT: "#00b4d8",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "#fafafa",
          foreground: "#0a192f",
        },
        card: {
          DEFAULT: "#fafafa",
          foreground: "#0a192f",
        },
        success: "#00f5a0",
        warning: "#fbbf24",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
