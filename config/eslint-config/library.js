const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import("eslint").Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', 'prettier', 'eslint-config-turbo'],
  rules: {
    curly: 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-non-null-assertion': 0,
    'react/react-in-jsx-scope': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
  globals: {
    React: true,
    JSX: true,
    NodeJS: true,
  },
  env: {
    browser: true,
    node: true,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    // Ignore dotfiles
    '.*.js',
    'node_modules/',
    'dist/',
  ],
  overrides: [
    {
      files: ['*.js?(x)', '*.ts?(x)'],
    },
  ],
};
