/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.types.ts', '!src/**/index.ts', '!src/**/*.d.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk)/)',
  ],
  testEnvironment: 'node',
};
