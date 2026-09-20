/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
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
        // Grade semantic tokens
        "grade-g1": {
          DEFAULT: "hsl(var(--grade-g1))",
          foreground: "hsl(var(--grade-g1-foreground))",
        },
        "grade-g2": {
          DEFAULT: "hsl(var(--grade-g2))",
          foreground: "hsl(var(--grade-g2-foreground))",
        },
        "grade-g3": {
          DEFAULT: "hsl(var(--grade-g3))",
          foreground: "hsl(var(--grade-g3-foreground))",
        },
        "grade-jpn1": {
          DEFAULT: "hsl(var(--grade-jpn1))",
          foreground: "hsl(var(--grade-jpn1-foreground))",
        },
        "grade-jpn2": {
          DEFAULT: "hsl(var(--grade-jpn2))",
          foreground: "hsl(var(--grade-jpn2-foreground))",
        },
        "grade-jpn3": {
          DEFAULT: "hsl(var(--grade-jpn3))",
          foreground: "hsl(var(--grade-jpn3-foreground))",
        },
        "grade-s1": {
          DEFAULT: "hsl(var(--grade-s1))",
          foreground: "hsl(var(--grade-s1-foreground))",
        },
        "grade-s2": {
          DEFAULT: "hsl(var(--grade-s2))",
          foreground: "hsl(var(--grade-s2-foreground))",
        },
        "grade-s3": {
          DEFAULT: "hsl(var(--grade-s3))",
          foreground: "hsl(var(--grade-s3-foreground))",
        },
        "grade-local": {
          DEFAULT: "hsl(var(--grade-local))",
          foreground: "hsl(var(--grade-local-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
