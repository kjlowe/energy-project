import { defineWorkspace } from 'vitest/config';

// Defines separate projects for jsdom and browser tests
export default defineWorkspace([
  {
    extends: './vitest.config.ts',
    test: {
      name: 'jsdom',
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['src/**/*.browser.test.{ts,tsx}'],
    },
  },
  {
    extends: './vitest.config.ts',
    test: {
      name: 'browser',
      browser: {
        enabled: true,
        name: 'chromium',
        provider: 'playwright',
        headless: true,
      },
      include: ['src/**/*.browser.test.{ts,tsx}'],
      setupFiles: ['.storybook/vitest.setup.ts'],
    },
  },
]);
