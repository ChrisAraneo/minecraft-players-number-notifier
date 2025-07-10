import createConfigs from '@chris.araneo/eslint-config';

export default [
  ...createConfigs({
    jsons: ['**/*.json'],
    sources: ['**/!(*.spec).{ts,js,mjs}'],
    tests: ['**/*.spec.ts'],
    ignored: [
      'package-lock.json',
      'package.json',
      'node_modules/**',
      'dist/**',
      'eslint.config.mjs',
      'jest.config.js',
      'scripts/**',
    ],
    tsconfigRootDir: import.meta.dirname,
  }),
];
