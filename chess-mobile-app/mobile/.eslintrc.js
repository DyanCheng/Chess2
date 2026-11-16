module.exports = {
  root: true,
  extends: ['@react-native'],
  ignorePatterns: [
    'android/**',
    'ios/**',
    'dist*/**',
    'coverage/**',
    'node_modules/**',
  ],
  rules: {
    'prettier/prettier': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-native/no-inline-styles': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
};
