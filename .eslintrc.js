module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    'jest/globals': true,
  },
  plugins: ['jest', '@html-eslint'],
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  overrides: [
    {
      files: ['*.html'],
      parser: '@html-eslint/parser',
      extends: ['plugin:@html-eslint/recommended'],
    },
  ],
  settings: {
      'html/report-bad-indent': 'error',
  },
  rules: {
    indent: 0,
    '@html-eslint/indent': ['error', 2],
    'no-restricted-syntax': [0, 'ForOfStatement'],
    'max-len': [2, 140],
    'global-require': 0,
    'no-console': 0,
    'no-unused-vars': 0,
    'comma-dangle': 0,
  },
};
