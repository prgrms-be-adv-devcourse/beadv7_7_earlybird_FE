/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F2EFE6",
        surface: "#FFFDF7",
        ink: "#2B2418",
        mist: "#8A8171",
        line: "#E4DCC7",
        brand: "#FF7A45",
        sun: "#FFC94D",
        danger: "#D94F3D",
      },
      fontFamily: {
        display: ["Cafe24Ssurround", "Pretendard", "-apple-system", "sans-serif"],
        sans: ["Pretendard", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        stamp: "3px 3px 0 0 #2B2418",
        "stamp-sm": "2px 2px 0 0 #2B2418",
        "stamp-lg": "6px 6px 0 0 #2B2418",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "pop-in": {
          from: { opacity: 0, transform: "translateY(2px) scale(0.98)" },
          to: { opacity: 1, transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 120ms ease-out",
        "pop-in": "pop-in 120ms ease-out",
      },
    },
  },
  plugins: [],
};
