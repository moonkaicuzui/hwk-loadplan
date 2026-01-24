// Vitest Configuration
// MVC Refactoring Phase 1 - Unit Testing Setup
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment - jsdom for DOM API support in View layer tests
    environment: 'jsdom',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/models/**/*.js', 'src/views/**/*.js'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/'
      ]
    },

    // Test file patterns
    include: ['tests/unit/**/*.test.js'],

    // Global test timeout
    testTimeout: 10000
  }
});
