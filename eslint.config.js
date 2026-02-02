// @ts-check
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        // External libraries
        Chart: 'readonly',
        XLSX: 'readonly',
        jspdf: 'readonly',
        firebase: 'readonly',
        // Project globals
        EMBEDDED_DATA: 'readonly',
        FilterCache: 'readonly',
        ChartManager: 'readonly',
        escapeHtml: 'readonly',
        i18n: 'readonly',
        // Global functions from HTML
        showExportModal: 'readonly',
        showSettingsModal: 'readonly',
        showHelpModal: 'readonly',
        resetFilters: 'readonly',
        applyFilters: 'readonly',
        isDelayed: 'readonly',
        filteredData: 'readonly',
      },
    },
    rules: {
      // Error prevention
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-console': 'off', // Allow console for debugging

      // Best practices
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Style (minimal - let Prettier handle formatting)
      'semi': ['error', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],

      // ES6+
      'prefer-const': 'warn',
      'no-var': 'error',
      'prefer-arrow-callback': 'warn',
      'arrow-body-style': ['warn', 'as-needed'],

      // Security
      'no-script-url': 'error',
    },
  },
  {
    // Test files specific rules
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'archive/**',
      'react-app/**',
      '*.min.js',
      'coverage/**',
    ],
  },
];
