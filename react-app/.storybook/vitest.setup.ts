import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview.js';

// Setup Storybook environment for Vitest
// Note: a11y addon is excluded because it fails in vitest browser environment
// (tries to access #storybook-root which doesn't exist in the test runner)
const project = setProjectAnnotations([
  {
    ...projectAnnotations,
    parameters: {
      ...projectAnnotations.parameters,
      // Disable a11y testing in vitest to avoid "No elements found" errors
      a11y: {
        ...projectAnnotations.parameters?.a11y,
        disable: true,
      },
    },
  },
]);

// Apply Storybook's beforeAll
beforeAll(project.beforeAll);
