module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:prettier/recommended', 'plugin:@typescript-eslint/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      ecmaVersion: 2018,
    },
  },
  rules: {},
  settings: {
    react: {
      version: 'detect',
    },
  },
};
