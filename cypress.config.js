const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'q36r1o',
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
