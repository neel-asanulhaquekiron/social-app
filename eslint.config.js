// Flat config — ESLint 10 no longer reads .eslintrc.*
const { defineConfig } = require("eslint/config");
const expo = require("eslint-config-expo/flat");
const prettier = require("eslint-config-prettier");

module.exports = defineConfig([
  expo,
  // Turns off rules that would fight Prettier's formatting.
  prettier,
  {
    // Pinned deliberately. eslint-plugin-react 7.37 (pulled in by
    // eslint-config-expo) detects the React version via
    // context.getFilename(), which ESLint 10 removed — leaving it on
    // "detect" crashes the whole run. Naming the version skips that path.
    settings: { react: { version: "19.2" } },
  },
  {
    ignores: [
      "dist/*",
      "node_modules/*",
      ".expo/*",
      "android/*",
      "ios/*",
      "server/node_modules/*",
    ],
  },
  {
    // Jest globals for both suites.
    files: [
      "**/__tests__/**/*.{js,ts,tsx}",
      "**/*.test.{js,ts,tsx}",
      "jest.setup.js",
      "server/jest.setup.js",
    ],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        global: "writable",
      },
    },
  },
  {
    files: ["server/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "writable",
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setImmediate: "readonly",
        __dirname: "readonly",
        fetch: "readonly",
      },
    },
  },
]);
