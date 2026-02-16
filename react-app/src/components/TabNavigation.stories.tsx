import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import React, { useState } from 'react';
import TabNavigation, { type ViewMode } from './TabNavigation';

const meta = {
  title: 'Components/TabNavigation',
  component: TabNavigation,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TabNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component with state management
const TabNavigationWithState: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewMode>('month');

  return <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />;
};

export const MonthTabActive: Story = {
  args: {
    activeTab: 'month',
    onTabChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify Month tab is selected
    const monthTab = canvas.getByRole('tab', { name: /Month by Month/i });
    await expect(monthTab).toHaveAttribute('aria-selected', 'true');

    // Verify Year tab is not selected
    const yearTab = canvas.getByRole('tab', { name: /Full Year Data/i });
    await expect(yearTab).toHaveAttribute('aria-selected', 'false');
  },
};

export const YearTabActive: Story = {
  args: {
    activeTab: 'year',
    onTabChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify Year tab is selected
    const yearTab = canvas.getByRole('tab', { name: /Full Year Data/i });
    await expect(yearTab).toHaveAttribute('aria-selected', 'true');

    // Verify Month tab is not selected
    const monthTab = canvas.getByRole('tab', { name: /Month by Month/i });
    await expect(monthTab).toHaveAttribute('aria-selected', 'false');
  },
};

export const ClickToSwitch: Story = {
  render: () => <TabNavigationWithState />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify initial state (Month tab active)
    const monthTab = canvas.getByRole('tab', { name: /Month by Month/i });
    const yearTab = canvas.getByRole('tab', { name: /Full Year Data/i });

    await expect(monthTab).toHaveAttribute('aria-selected', 'true');
    await expect(yearTab).toHaveAttribute('aria-selected', 'false');

    // Click Year tab
    await user.click(yearTab);

    // Verify Year tab is now active
    await expect(yearTab).toHaveAttribute('aria-selected', 'true');
    await expect(monthTab).toHaveAttribute('aria-selected', 'false');

    // Click Month tab
    await user.click(monthTab);

    // Verify Month tab is active again
    await expect(monthTab).toHaveAttribute('aria-selected', 'true');
    await expect(yearTab).toHaveAttribute('aria-selected', 'false');
  },
};
