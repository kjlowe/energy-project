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
    layout: 'padded',
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

    // Verify year header is displayed
    await expect(canvas.getByText(/Full Year Data:/i)).toBeInTheDocument();

    // Verify May month is displayed (within an h3)
    await expect(canvas.getByRole('heading', { name: /May 2024/i, level: 3 })).toBeInTheDocument();

    // Verify June month is displayed (within an h3)
    await expect(canvas.getByRole('heading', { name: /June 2024/i, level: 3 })).toBeInTheDocument();

    // Verify tables are rendered (one per month)
    const tables = canvas.getAllByRole('table');
    await expect(tables).toHaveLength(2); // 2 months
  },
};

export const FullYear: Story = {
  args: {
    data: mockBillingYear2023,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify year header spans full year
    await expect(
      canvas.getByText(/May 2023 - April 2024/i)
    ).toBeInTheDocument();

    // Verify first month (within an h3)
    await expect(canvas.getByRole('heading', { name: /May 2023/i, level: 3 })).toBeInTheDocument();

    // Verify last month (within an h3)
    await expect(canvas.getByRole('heading', { name: /April 2024/i, level: 3 })).toBeInTheDocument();

    // Verify tables are rendered (one per month)
    const tables = canvas.getAllByRole('table');
    await expect(tables).toHaveLength(12); // 12 months
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
      billing_months: [mockBillingYear.billing_months[0]],
    } as BillingYearWithId,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify single month is displayed (within an h3)
    await expect(canvas.getByRole('heading', { name: /May 2024/i, level: 3 })).toBeInTheDocument();

    // Verify only one table is rendered
    const tables = canvas.getAllByRole('table');
    await expect(tables).toHaveLength(1);
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
