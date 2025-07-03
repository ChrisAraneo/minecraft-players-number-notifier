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
    ],
    tsconfigRootDir: import.meta.dirname,
  }),
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/max-params': 'off',
      'no-void': 'off',
      'no-await-in-loop': 'off',
      'unicorn/prefer-ternary': 'off',
      'unicorn/number-literal-case': 'off',
    },
  },
];
