import { defineConfig, globalIgnores } from "eslint/config";

const browserGlobals = Object.fromEntries([
  "AbortController", "FileReader", "FormData", "IntersectionObserver", "URLSearchParams",
  "crypto", "document", "fetch", "localStorage", "sessionStorage", "window",
].map((name) => [name, "readonly"]));

export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**"]),
  {
    files: ["src/**/*.{js,jsx}", "vite.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: browserGlobals,
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "off"
    },
  },
]);
