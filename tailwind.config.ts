import type { Config } from "tailwindcss";

/* Origin Financial — color overrides.
   We REMAP Tailwind's default emerald / teal / zinc / gray / slate / neutral
   scales onto the Origin palette so every legacy class in the codebase
   (e.g. bg-emerald-500, text-zinc-400, border-slate-800) re-themes
   automatically to obsidian/graphite/frost/bone — no manual sweep needed. */

// Achromatic dark ladder
const achromaticDark = {
  50:  "#f5f5f7", // Bone
  100: "#e8e8ea",
  200: "#cacaca", // Pearl
  300: "#9f9fa0", // Frost
  400: "#9f9fa0",
  500: "#6a6b6b", // Mist
  600: "#3f4041", // Slate
  700: "#2e2e2e", // Graphite
  800: "#1a1a1b",
  900: "#0f1011", // Obsidian
  950: "#090a0b", // Carbon
};

// Brand chromatic accent (replaces former emerald/teal)
const accentChromatic = {
  50:  "#eeecff",
  100: "#d1c9ff", // Lavender Mist
  200: "#b9b0ff",
  300: "#a098ff",
  400: "#847dff", // Amethyst
  500: "#847dff",
  600: "#6c66e0",
  700: "#4b49aa", // Deep Iris
  800: "#3a3880",
  900: "#252461",
  950: "#15143d",
};

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* Origin named tokens — for new components */
        obsidian: "#0f1011",
        carbon: "#090a0b",
        graphite: "#2e2e2e",
        slate: achromaticDark,
        mist: "#6a6b6b",
        frost: "#9f9fa0",
        pearl: "#cacaca",
        bone: "#f5f5f7",
        amethyst: "#847dff",
        "lavender-mist": "#d1c9ff",
        "deep-iris": "#4b49aa",
        orchid: "#dd90d8",
        "cyan-spark": "#00b3dd",
        "sky-wash": "#90b8f0",
        "twilight-navy": "#195f97",
        "dusk-sky": "#408ac1",

        /* Legacy palette overrides — auto-retheme existing classes */
        emerald: accentChromatic,
        teal: accentChromatic,
        green: accentChromatic,
        zinc: achromaticDark,
        gray: achromaticDark,
        neutral: achromaticDark,
        stone: achromaticDark,
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Lyon Display", "Georgia", "serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pill: "9999px",
        feature: "30px",
      },
      backgroundImage: {
        "dusk-sky": "linear-gradient(180deg, #0f1011 0%, #131d27 18%, #1a4788 37%, #408ac1 69%, #408ac1 100%)",
      },
      boxShadow: {
        pill: "rgba(0, 0, 0, 0.2) 0px 18px 20px 0px",
        feature: "rgba(0, 0, 0, 0.4) 0px 18px 40px -12px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
