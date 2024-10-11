module.exports = {
  extends: ['../../.eslintrc.js'],
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
      },
    },
  ],
  ignorePatterns: ['!.eslintrc.js', 'build/'],
};
