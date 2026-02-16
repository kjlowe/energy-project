import type { Preview } from '@storybook/react-vite';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { handlers } from '../src/test/mocks/handlers';

// Initialize MSW for Storybook
initialize({
  onUnhandledRequest: 'warn',
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    actions: { argTypesRegex: '^on[A-Z].*' },

    // MSW handlers - apply globally
    msw: {
      handlers: handlers,
    },

    // Accessibility addon configuration
    a11y: {
      context: '#storybook-root',

      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },

      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    // Coverage configuration
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        '**/*.stories.{ts,tsx}',
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js}',
        '**/mockData/**',
      ],
    },
  },

  loaders: [mswLoader],

  // Global decorators
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
