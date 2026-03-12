import globals from "globals";

export default [
  {
    ignores: ["node_modules/", "coverage/"],
  },
  {
    files: ["app.js", "js/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["tests/**/*.js", "*.config.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.vitest,
      },
    },
  },
];
