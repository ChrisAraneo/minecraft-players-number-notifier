/** @type {import('ts-jest').JestConfigWithTsJest} */

// eslint-disable-next-line no-undef
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['dist', '.stryker-tmp'],
  coveragePathIgnorePatterns: ['*.data.spec.ts']
};
