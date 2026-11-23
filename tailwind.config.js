/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#707b91",
        brand: {
          50: "#f2f1ff",
          100: "#e8e6ff",
          500: "#6254e7",
          600: "#5143d2",
          700: "#4336b7",
        },
      },
      boxShadow: {
        soft: "0 20px 60px rgba(34, 43, 74, .10)",
      },
    },
  },
  plugins: [],
};
