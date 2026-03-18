import globals from "globals";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

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
      "no-unused-vars": "off",
      curly: ["error", "multi-line"],
      eqeqeq: ["error", "smart"],
      "no-console": "off",
    },
  },

  // PRETTIER
  prettierConfig,
];
