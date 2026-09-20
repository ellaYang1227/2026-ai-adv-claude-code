import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/*.test.js'],
    fileParallelism: false,
    sequence: {
      files: [
        'tests/shipping.test.js',
        'tests/ecpay.test.js',
        'tests/auth.test.js',
        'tests/products.test.js',
        'tests/cart.test.js',
        'tests/orders.test.js',
        'tests/adminProducts.test.js',
        'tests/adminOrders.test.js',
      ],
    },
    globalSetup: ['./tests/unitGlobalSetup.js'],
    hookTimeout: 10000,
  },
});
