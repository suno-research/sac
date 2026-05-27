import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      spacing: {
        sidebar: "var(--sidebar-width)",
        header: "var(--header-height)",
      },
      maxWidth: {
        content: "1440px",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        card: "var(--shadow-sm)",
        elevated: "var(--shadow-md)",
        modal: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
};

export default config;
