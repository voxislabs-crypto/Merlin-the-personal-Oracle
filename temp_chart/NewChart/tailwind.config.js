module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(240, 12%, 35%)",
        input: "hsl(240, 12%, 35%)",
        ring: "hsl(45, 88%, 68%)",
        background: "hsl(240, 65%, 8%)",
        foreground: "hsl(45, 88%, 68%)",
        primary: {
          DEFAULT: "hsl(240, 65%, 8%)",
          foreground: "hsl(45, 88%, 68%)",
        },
        secondary: {
          DEFAULT: "hsl(258, 60%, 18%)",
          foreground: "hsl(45, 88%, 68%)",
        },
        tertiary: {
          DEFAULT: "hsl(185, 70%, 65%)",
          foreground: "hsl(240, 65%, 8%)",
        },
        neutral: {
          DEFAULT: "hsl(240, 20%, 12%)",
          foreground: "hsl(0, 0%, 96%)",
        },
        success: "hsl(155, 65%, 45%)",
        warning: "hsl(40, 90%, 55%)",
        gray: {
          50: "hsl(240, 15%, 98%)",
          100: "hsl(240, 12%, 90%)",
          200: "hsl(240, 10%, 80%)",
          300: "hsl(240, 9%, 70%)",
          400: "hsl(240, 8%, 60%)",
          500: "hsl(240, 10%, 45%)",
          600: "hsl(240, 12%, 35%)",
          700: "hsl(240, 15%, 25%)",
          800: "hsl(240, 18%, 16%)",
          900: "hsl(240, 20%, 10%)",
        },
        cosmic: {
          midnight: "hsl(240, 65%, 8%)",
          violet: "hsl(258, 60%, 18%)",
          gold: "hsl(45, 88%, 68%)",
          cyan: "hsl(185, 70%, 65%)",
          magenta: "hsl(320, 80%, 65%)",
        },
        muted: {
          DEFAULT: "hsl(240, 20%, 12%)",
          foreground: "hsl(240, 10%, 80%)",
        },
        accent: {
          DEFAULT: "hsl(258, 60%, 18%)",
          foreground: "hsl(45, 88%, 68%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 62%, 50%)",
          foreground: "hsl(0, 0%, 98%)",
        },
        card: {
          DEFAULT: "hsl(240, 20%, 12%)",
          foreground: "hsl(0, 0%, 96%)",
        },
        popover: {
          DEFAULT: "hsl(240, 20%, 12%)",
          foreground: "hsl(0, 0%, 96%)",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
        display: ["Raleway", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      spacing: {
        4: "1rem",
        8: "2rem",
        12: "3rem",
        16: "4rem",
        24: "6rem",
        32: "8rem",
        48: "12rem",
        64: "16rem",
      },
      backgroundImage: {
        "gradient-cosmic":
          "linear-gradient(135deg, hsl(240, 65%, 8%), hsl(258, 60%, 18%), hsl(220, 60%, 12%))",
        "gradient-depth":
          "linear-gradient(90deg, hsl(220, 70%, 14%), hsl(258, 60%, 18%), hsl(270, 80%, 20%))",
        "gradient-cta":
          "linear-gradient(90deg, hsl(45, 88%, 68%), hsl(320, 80%, 65%))",
        "gradient-border":
          "linear-gradient(90deg, hsla(45, 88%, 68%, 0.9), hsla(320, 80%, 65%, 0.9))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
