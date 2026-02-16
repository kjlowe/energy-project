import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview.js';

// Setup Storybook environment for Vitest
const project = setProjectAnnotations([projectAnnotations]);

// Apply Storybook's beforeAll
beforeAll(project.beforeAll);
