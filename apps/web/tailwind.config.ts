import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'minecraft': ['var(--font-minecraft)', 'Press Start 2P', 'monospace'],
        'geo': ['var(--font-geo)', 'Work Sans', 'sans-serif'],
      },
      colors: {
        'pommai-cream': '#fefcd0',
        'pommai-purple': '#c381b5',
        'pommai-green': '#92cd41',
        'pommai-orange': '#f7931e',
        'pommai-dark-purple': '#8b5fa3',
        'pommai-dark-green': '#76a83a',
      },
    },
  },
  plugins: [],
};

export default config;