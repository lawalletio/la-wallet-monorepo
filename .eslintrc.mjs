// This configuration only applies to the package manager root.
/** @type {import("eslint").Linter.Config} */
module.exports = {
  ignorePatterns: ['apps/**', 'packages/**', 'config/**'],
  extends: ['@lacrypta/eslint-config/library.js', 'eslint-config-turbo'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
};
