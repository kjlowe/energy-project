// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  addons: [
    '@storybook/addon-a11y',
    'msw-storybook-addon',
    '@storybook/addon-docs',
    '@storybook/addon-vitest'
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: undefined, // Use custom config below
      },
    },
  },

  core: {
    disableTelemetry: true,
  },

  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@types': path.resolve(__dirname, '../src/types'),
          '@components': path.resolve(__dirname, '../src/components'),
          '@hooks': path.resolve(__dirname, '../src/hooks'),
        },
      },
      // Ensure visx SVG modules work properly
      optimizeDeps: {
        include: [
          '@visx/axis',
          '@visx/curve',
          '@visx/event',
          '@visx/gradient',
          '@visx/group',
          '@visx/scale',
          '@visx/shape',
          '@visx/tooltip',
        ],
      },
    });
  },

  staticDirs: ['../public'],

  typescript: {
    check: false, // Disable type checking during build (use separate type-check script)
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => {
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules');
        }
        return true;
      },
    },
  },
};

export default config;
