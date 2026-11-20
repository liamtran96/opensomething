import stylex from "@stylexjs/eslint-plugin";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist", "node_modules", "src/themes/built"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    plugins: { "@stylexjs": stylex },
    rules: {
      "@stylexjs/valid-styles": "error",
      "@stylexjs/valid-shorthands": "error",
      "@stylexjs/no-unused": "error",
      "@stylexjs/no-legacy-contextual-styles": "error",
      "@stylexjs/enforce-extension": ["error", { themeFileExtension: ".stylex.ts" }],
    },
  },
];
