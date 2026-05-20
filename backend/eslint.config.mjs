import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "prisma/seed.ts"],
  },
  {
    files: ["**/*.ts"],
    plugins: { "@typescript-eslint": tsPlugin },
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2020, sourceType: "module" },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
];
