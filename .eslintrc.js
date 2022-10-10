module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ["airbnb-base", "airbnb-typescript/base", "prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: [
      "./configs/tsconfig.base.json",
      "./configs/tsconfig.esm.json",
      "./configs/tsconfig.cjs.json",
    ],
  },
  plugins: ["@typescript-eslint"],
  rules: {},
  ignorePatterns: [".eslintrc.js", "jest.config.ts", "lib/**/*", "tests/**/*"],
};
