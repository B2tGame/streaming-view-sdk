module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: false,
    mocha: true,
  },
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['react', '@typescript-eslint'],
  rules: {
    'react/jsx-filename-extension': ['warn', { extensions: ['.tsx'] }],
    'no-undef': 'off', // Turned off since typescript supercedes this.
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        // Unused arguments still give information about how a function is called.
        // This is particularly useful for mocks.
        args: 'none',
      },
    ],
    'no-unused-vars': 'off', // Turned off since typescript supercedes this.
  },
};
