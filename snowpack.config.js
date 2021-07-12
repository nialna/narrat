// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/#configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    src: "/dist",
    public: "/",
  },
  plugins: [
    "@snowpack/plugin-vue",
    "@snowpack/plugin-typescript",
    "@snowpack/plugin-postcss",
    // ['@snowpack/plugin-sass', { /* see options below */ }],
  ],
  alias: {
    "@": "./src",
  },
  // installOptions: {},
  // devOptions: {},
  // buildOptions: {},
};
