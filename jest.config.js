const fs = require('fs');

const rootDir = __dirname;
const setupPath = `${rootDir}/jest.setup.js`;

const config = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/scripts/playwright/',
    '<rootDir>/tests/portal-.*\\.spec\\.js$',
    '<rootDir>/tests/e2e/'
  ]
};

if (fs.existsSync(setupPath)) {
  config.setupFiles = [setupPath];
} else {
  // explicit log for CI readability
  // jest will run without setup files when missing
  console.warn('jest.setup.js not found; running tests without setupFiles');
}

module.exports = config;
