module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/modules/auth/**/*.js',
    '!**/node_modules/**',
  ],
};
