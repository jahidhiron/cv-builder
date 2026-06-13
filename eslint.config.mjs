// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * ESLint Configuration for NestJS 11 (Flat Config Format)
 * -------------------------------------------------------
 * - Based on ESLint v9+ and TypeScript 5.7+
 * - Integrates Prettier for code style consistency
 * - Enables type-aware rules with recommended defaults
 * - Configured for Node.js, Jest, and CommonJS modules
 */

export default [
  // Ignored Files and Directories
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'eslint.config.mjs'],
  },

  // Base Configurations
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,

  // Language & Environment Settings
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Custom Rule Set
  {
    rules: {
      // General Code Quality
      eqeqeq: ['error', 'always'],
      'no-console': 'warn',
      'no-debugger': 'warn',

      // TypeScript Best Practices
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': 'off',
    },
  },
];
