import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/visiplus_test',
      JWT_SECRET: 'test-secret-key-at-least-32-characters',
    },
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});

