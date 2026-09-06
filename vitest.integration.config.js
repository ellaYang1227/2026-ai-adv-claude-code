import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/integration/*.integration.test.js'],
    fileParallelism: false,
    setupFiles: ['./tests/integration/setup.js'],
    hookTimeout: 10000,
  },
});
