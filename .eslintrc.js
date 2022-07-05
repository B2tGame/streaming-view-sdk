module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
    mocha: true
  },
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 12,
    jsx: true
  },
  plugins: ['react'],
  rules: {
    'no-unused-vars': [
      'error',
      {
        // Unused arguments still give information about how a function is called.
        // This is particularly useful for mocks.
        args: 'none'
      }
    ]
  }
};
