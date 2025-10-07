// ...new file...
/**
 * Jest config to run live integration tests under __tests__/*.live.test.js
 * This overrides any global ignore patterns coming from other configs.
 */
module.exports = {
  testEnvironment: 'node',
  // only match live tests when using the integration script; other scripts can override
  testMatch: ['**/__tests__/**/*.live.test.js', '**/?(*.)+(live.test).js'],
  testPathIgnorePatterns: [
    '<rootDir>/scripts/playwright/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/portal-.*\\.spec\\.js$'
  ],
  verbose: true,
  testTimeout: 30000
};
// ...new file...