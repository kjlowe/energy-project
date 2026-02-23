import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';
import MonthlyBillingView from './MonthlyBillingView';
import { mockBillingYear } from '../test/mocks/mockData/billingData';
import { mockFullMetadata } from '../test/mocks/mockData/metadataFixtures';
import type { BillingYearWithId } from '@/types/api';

const meta = {
  title: 'Components/MonthlyBillingView',
  component: MonthlyBillingView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Monthly billing data visualization component displaying energy data with peak/off-peak breakdown.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: { type: 'range', min: 200, max: 1000, step: 50 },
      description: 'SVG width in pixels',
    },
    height: {
      control: { type: 'range', min: 200, max: 800, step: 50 },
      description: 'SVG height in pixels',
    },
    data: {
      control: false,
      description: 'Billing year data with months',
    },
    metadata: {
      control: false,
      description: 'Billing metadata for field information',
    },
  },
} satisfies Meta<typeof MonthlyBillingView>;

export default meta;
type Story = StoryObj<typeof meta>;

// ==================== STORIES ====================

/**
 * Default state showing May data (first month).
 * Integration test verifying both generation and benefit meter sections work together.
 */
export const Default: Story = {
  args: {
    data: mockBillingYear,
    metadata: mockFullMetadata,
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify MonthSelector renders
    await expect(canvas.getByText(/Month: May/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Month: 1/i)).toBeInTheDocument();

    // Verify both section headings
    await expect(canvas.getByText(/Generation Meter/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Benefit Meter/i)).toBeInTheDocument();

    // Verify both MeterCharts render
    const svgs = canvasElement.querySelectorAll('svg');
    expect(svgs.length).toBe(2); // Two charts

    // Verify both tables render
    const tables = canvasElement.querySelectorAll('table');
    expect(tables.length).toBe(2); // Two tables

    // Verify Generation MeterChart renders with May values
    await expect(canvas.getByText('-884')).toBeInTheDocument(); // off-peak export
    await expect(canvas.getByText('-114')).toBeInTheDocument(); // peak export
    await expect(canvas.getByText('294')).toBeInTheDocument(); // off-peak import
    await expect(canvas.getByText('88')).toBeInTheDocument(); // peak import

    // Integration test: Navigate to June and verify all components update
    const nextButton = canvas.getAllByRole('button')[1];
    if (nextButton) {
      await user.click(nextButton);
    }

    // Verify month selector updated
    await expect(canvas.getByText(/Month: June/i)).toBeInTheDocument();

    // Verify chart updated with June values
    await expect(canvas.getByText('-900')).toBeInTheDocument(); // June off-peak export
  },
};

/**
 * Empty state - no billing data available
 */
export const EmptyData: Story = {
  args: {
    data: null,
    metadata: mockFullMetadata,
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/No billing data available/i)).toBeInTheDocument();
  },
};

/**
 * Empty months array
 */
export const EmptyMonthsArray: Story = {
  args: {
    data: {
      id: 1,
      start_month: 5,
      start_year: 2024,
      num_months: 0,
      months: [],
      billing_months: [],
    } as BillingYearWithId,
    metadata: mockFullMetadata,
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/No billing data available/i)).toBeInTheDocument();
  },
};

/**
 * Missing nested data - graceful degradation
 */
export const MissingNestedData: Story = {
  args: {
    data: {
      id: 1,
      start_month: 1,
      start_year: 2024,
      num_months: 1,
      months: [{ month_name: 'January', year: 2024 }],
      billing_months: [
        {
          year: 2024,
          month: 1,
          month_label: { month_name: 'January', year: 2024 },
          // Missing 'main' object entirely
        },
      ],
    } as any,
    metadata: mockFullMetadata,
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should handle gracefully - MonthSelector still renders
    await expect(canvas.getByText(/Month: January/i)).toBeInTheDocument();

    // Verify no meter sections render when data is missing
    const headings = canvas.queryAllByRole('heading', { level: 3 });
    expect(headings.length).toBe(0); // No meter section headings
  },
};

/**
 * Second month (June) rendered by default
 */
export const JuneData: Story = {
  args: {
    data: {
      ...mockBillingYear,
      billing_months: [mockBillingYear.billing_months[1]!],
      months: [mockBillingYear.months[1]!],
      num_months: 1,
    } as BillingYearWithId,
    metadata: mockFullMetadata,
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify June data displays
    await expect(canvas.getByText(/Month: June/i)).toBeInTheDocument();
    await expect(canvas.getByText('-900')).toBeInTheDocument();
  },
};
