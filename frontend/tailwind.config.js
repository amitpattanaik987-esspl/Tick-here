module.exports = {
  content: [
    "./src/**/*.{html,ts}", // All HTML files in src/
    "./dist/**/*.js", // JS files from compiled output
    "./src/scripts/**/*.{ts,tsx}", // All TS/TSX files in src/scripts/
  ],
  theme: {
    extend: {
      colors: {
        ghostwhite: "#f8f8ff",
        darkslateblue: "#4f367d",
        gray: {
          100: "#fefefe",
          200: "#252729",
          300: "#21272a",
          400: "#0a0417",
        },
        silver: "#c1c7cd",
        black: "#000",
        darkorchid: "#9a47e3",
        white: "#fff",
        darkorchid: "#9a47e3",
        darkslateblue: "#462f7d",
      },
      fontFamily: {
        poppins: "Poppins",
        roboto: "Roboto",
        inter: "Inter",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
};
