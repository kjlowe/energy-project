import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import YearlyBillingView from './YearlyBillingView';
import { mockBillingYear } from '../test/mocks/mockData/billingData';
import { mockBillingYear2023 } from '../test/mocks/mockData/billingData2023';
import type { BillingYearWithId } from '@/types/api';

const meta = {
  title: 'Components/YearlyBillingView',
  component: YearlyBillingView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof YearlyBillingView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: mockBillingYear,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify single table is rendered (Excel-style)
    const tables = canvas.getAllByRole('table');
    await expect(tables).toHaveLength(1);

    // Verify multi-level headers
    await expect(canvas.getByText('month_label')).toBeInTheDocument();
    await expect(canvas.getByText('main')).toBeInTheDocument();
    await expect(canvas.getByText('adu')).toBeInTheDocument();

    // Verify expand buttons are present
    const buttons = canvas.getAllByRole('button', { name: /Expand/i });
    await expect(buttons.length).toBeGreaterThan(0);
  },
};

export const FullYear: Story = {
  args: {
    data: mockBillingYear2023,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify single table is rendered
    const tables = canvas.getAllByRole('table');
    await expect(tables).toHaveLength(1);

    // Verify multi-level headers
    await expect(canvas.getByText('month_label')).toBeInTheDocument();
    await expect(canvas.getByText('main')).toBeInTheDocument();
  },
};

export const SingleMonth: Story = {
  args: {
    data: {
      id: 99,
      start_month: 5,
      start_year: 2024,
      num_months: 1,
      months: [{ month_name: 'May', year: 2024 }],
      billing_months: [mockBillingYear.billing_months[0]!],
    } as BillingYearWithId,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify single table is rendered
    const tables = canvas.getAllByRole('table');
    await expect(tables).toHaveLength(1);

    // Verify table has headers
    await expect(canvas.getByText('month_label')).toBeInTheDocument();
  },
};

export const EmptyMonths: Story = {
  args: {
    data: {
      id: 98,
      start_month: 5,
      start_year: 2024,
      num_months: 0,
      months: [],
      billing_months: [],
    } as BillingYearWithId,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify empty state message is displayed
    await expect(
      canvas.getByText(/No billing data available for this year/i)
    ).toBeInTheDocument();

    // No tables should be rendered
    const tables = canvas.queryAllByRole('table');
    await expect(tables).toHaveLength(0);
  },
};
