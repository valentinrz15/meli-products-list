import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  {
    // Configuración base de ESLint
    ignores: ["**/*.config.js", "**/*.config.mjs", ".next/", "node_modules/"],
  },
  {
    // Configuración básica de JavaScript
    files: ["**/*.js", "**/*.mjs"],
    ...js.configs.recommended,
  },
  {
    // Configuración para TypeScript
    files: ["**/*.ts", "**/*.tsx"],
    ...tseslint.configs.recommended,
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Configuración para Next.js
    files: ["**/*.tsx", "**/*.jsx"],
    ...nextPlugin.configs["recommended"],
    ...nextPlugin.configs["core-web-vitals"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  }
);
