/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  moduleFileExtensions: ['ts', 'cts', 'mts', 'tsx', 'json', 'js'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.tests.ts'],
  verbose: true,
  testPathIgnorePatterns: ['/node_modules/'],
  globals: { 'ts-jest': { diagnostics: false } },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};
