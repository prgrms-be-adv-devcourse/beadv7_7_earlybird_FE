/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mint: "#B5EAD7",
        peach: "#FFD6E0",
        lavender: "#C7CEEA",
      },
      fontFamily: {
        jua: ["Jua", "sans-serif"],
      },
    },
  },
  plugins: [],
};
