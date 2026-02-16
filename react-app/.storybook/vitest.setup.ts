import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview.js';

// Setup Storybook environment for Vitest
const project = setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);

// Apply Storybook's beforeAll
beforeAll(project.beforeAll);
