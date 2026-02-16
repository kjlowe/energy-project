import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';
import Solar from './Solar';
import { mockBillingYear } from '../test/mocks/mockData/billingData';
import type { BillingYearWithId } from '@/types/api';

const meta = {
  title: 'Components/Solar',
  component: Solar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Solar energy visualization component displaying billing data with peak/off-peak breakdown.',
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
  },
} satisfies Meta<typeof Solar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ==================== STORIES ====================

/**
 * Default state showing May data (first month)
 */
export const Default: Story = {
  args: {
    data: mockBillingYear,
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify month name displays
    await expect(canvas.getByText(/Month: May/i)).toBeInTheDocument();

    // Verify energy values render
    await expect(canvas.getByText('-884')).toBeInTheDocument();
    await expect(canvas.getByText('-114')).toBeInTheDocument();
    await expect(canvas.getByText('294')).toBeInTheDocument();
    await expect(canvas.getByText('88')).toBeInTheDocument();

    // Verify SVG renders
    const svg = canvasElement.querySelector('svg');
    expect(svg).toBeInTheDocument();
  },
};

/**
 * Empty state - no billing data available
 */
export const EmptyData: Story = {
  args: {
    data: null,
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
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/No billing data available/i)).toBeInTheDocument();
  },
};

/**
 * Single month data (both buttons disabled)
 */
export const SingleMonth: Story = {
  args: {
    data: {
      id: 1,
      start_month: 5,
      start_year: 2024,
      num_months: 1,
      months: [{ month_name: 'May', year: 2024 }],
      billing_months: [mockBillingYear.billing_months[0]!],
    } as BillingYearWithId,
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both navigation buttons should be disabled
    const buttons = canvas.getAllByRole('button');
    expect(buttons[0]).toBeDisabled(); // prev
    expect(buttons[1]).toBeDisabled(); // next

    // Slider should have max=0
    const slider = canvas.getByRole('slider') as HTMLInputElement;
    expect(slider).toHaveAttribute('max', '0');
  },
};

/**
 * Zero values - displays N/A
 */
export const ZeroValues: Story = {
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
          main: {
            energy_export_meter_channel_2: {
              off_peak: { subcomponent_values: [0], value: 0 },
              peak: { subcomponent_values: [0], value: 0 },
            },
            energy_import_meter_channel_1: {
              off_peak: { subcomponent_values: [0], value: 0 },
              peak: { subcomponent_values: [0], value: 0 },
            },
          },
        },
      ],
    } as any,
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should display N/A for zero values
    const naTexts = canvas.getAllByText('N/A');
    expect(naTexts.length).toBeGreaterThan(0);
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
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should handle gracefully with N/A values
    const naTexts = canvas.getAllByText('N/A');
    expect(naTexts.length).toBeGreaterThan(0);
  },
};

/**
 * Navigation interaction - next button
 */
export const NavigateToNextMonth: Story = {
  args: {
    data: mockBillingYear,
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Start at May
    await expect(canvas.getByText(/Month: May/i)).toBeInTheDocument();

    // Click next button to navigate to June
    const nextButton = canvas.getAllByRole('button')[1];
    await user.click(nextButton);

    // Should now show June
    await expect(canvas.getByText(/Month: June/i)).toBeInTheDocument();

    // Verify June's off-peak export value
    await expect(canvas.getByText('-900')).toBeInTheDocument();
  },
};

/**
 * Navigation interaction - previous button
 */
export const NavigateToPreviousMonth: Story = {
  args: {
    data: mockBillingYear,
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Navigate to June first
    const nextButton = canvas.getAllByRole('button')[1];
    await user.click(nextButton);
    await expect(canvas.getByText(/Month: June/i)).toBeInTheDocument();

    // Click previous button to go back to May
    const prevButton = canvas.getAllByRole('button')[0];
    await user.click(prevButton);

    // Should be back at May
    await expect(canvas.getByText(/Month: May/i)).toBeInTheDocument();
  },
};

/**
 * Slider interaction
 */
export const SliderNavigation: Story = {
  args: {
    data: mockBillingYear,
    width: 600,
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Start at May (index 0)
    await expect(canvas.getByText(/Month: May/i)).toBeInTheDocument();

    // Use slider to navigate to June (index 1)
    const slider = canvas.getByRole('slider');
    await user.clear(slider);
    await user.type(slider, '1');

    // Should show June
    await expect(canvas.getByText(/Month: June/i)).toBeInTheDocument();
  },
};

/**
 * Small dimensions
 */
export const SmallSize: Story = {
  args: {
    data: mockBillingYear,
    width: 300,
    height: 250,
  },
};

/**
 * Large dimensions
 */
export const LargeSize: Story = {
  args: {
    data: mockBillingYear,
    width: 900,
    height: 600,
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
