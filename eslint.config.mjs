import { dirname } from "path";
import { fileURLToPath } from "url";
import globals from "globals";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = null;

export default [
  // IGNORE PATTERNS
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "public/**",
      "coverage/**",
      "*.config.js",
    ],
  },

  // BASE CONFIGURATION
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },

  js.configs.recommended,

  //  CUSTOM RULES
  {
    rules: {
      "no-inner-declarations": "error",
      "no-unsafe-optional-chaining": "error",
      curly: ["error", "multi-line"],
      eqeqeq: ["error", "smart"],
      "no-console":
        process.env.NODE_ENV === "production"
          ? ["error", { allow: ["warn", "error"] }]
          : "off",
    },
  },

  // PRETTIER
  prettierConfig,
];
