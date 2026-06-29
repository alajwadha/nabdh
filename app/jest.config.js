/** Unit tests for the pure helpers (no React Native runtime needed). The helpers use only
 * type-only imports from RN/Expo files, so ts-jest in a node env runs them directly. */
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {}],
  },
};
