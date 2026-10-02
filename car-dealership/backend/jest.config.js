module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEach: [],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  testTimeout: 10000,
  collectCoverageFrom: ['src/**/*.js'],
};
