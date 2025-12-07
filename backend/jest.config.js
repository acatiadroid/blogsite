module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/db.js'
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/src/tests/**/*.test.js'],
  verbose: true,
  testTimeout: 10000
};
