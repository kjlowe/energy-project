import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import RawDataTable from './RawDataTable';
import { mockBillingYear } from '../test/mocks/mockData/billingData';
import { renderDataTable, type TableRow } from '@/utils/tableDataTransform';

const meta = {
  title: 'Components/RawDataTable',
  component: RawDataTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Scrollable table displaying all billing month properties with nested object traversal.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    maxHeight: {
      control: { type: 'range', min: 100, max: 800, step: 50 },
      description: 'Maximum height for scrollable area',
    },
  },
} satisfies Meta<typeof RawDataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// Extract May month table data
const mayMonth = mockBillingYear.billing_months[0];
const mayTableData = mayMonth
  ? renderDataTable(mayMonth as unknown as Record<string, unknown>)
  : [];

// ==================== STORIES ====================

/**
 * Default table with May billing data.
 * Shows all properties with sticky headers and zebra striping.
 */
export const Default: Story = {
  args: {
    tableData: mayTableData,
    maxHeight: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify table renders
    const table = canvasElement.querySelector('table');
    expect(table).toBeInTheDocument();

    // Verify headers
    await expect(canvas.getByText('Property')).toBeInTheDocument();
    await expect(canvas.getByText('Value')).toBeInTheDocument();
    await expect(canvas.getByText('Unit')).toBeInTheDocument();

    // Verify some data rows exist
    const rows = table?.querySelectorAll('tbody tr');
    expect(rows && rows.length).toBeGreaterThan(0);
  },
};

/**
 * Empty data - no table rows.
 */
export const EmptyData: Story = {
  args: {
    tableData: [],
    maxHeight: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Headers should still render
    await expect(canvas.getByText('Property')).toBeInTheDocument();

    // No data rows
    const table = canvasElement.querySelector('table');
    const rows = table?.querySelectorAll('tbody tr');
    expect(rows?.length).toBe(0);
  },
};

/**
 * Scrollable data - many rows to test overflow.
 * Uses duplicate May data to create longer list.
 */
export const ScrollableData: Story = {
  args: {
    tableData: [
      ...mayTableData,
      ...mayTableData.map((row) => ({ ...row, key: `copy1.${row.key}` })),
      ...mayTableData.map((row) => ({ ...row, key: `copy2.${row.key}` })),
      ...mayTableData.map((row) => ({ ...row, key: `copy3.${row.key}` })),
    ],
    maxHeight: 300,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify sticky header (position is on the tr inside thead)
    const theadRow = canvasElement.querySelector('thead tr');
    expect(theadRow).toHaveStyle({ position: 'sticky' });

    // Verify table has many rows
    const table = canvasElement.querySelector('table');
    const rows = table?.querySelectorAll('tbody tr');
    expect(rows && rows.length).toBeGreaterThan(50);
  },
};

/**
 * Small height - tests scrolling with limited vertical space.
 */
export const SmallHeight: Story = {
  args: {
    tableData: mayTableData,
    maxHeight: 150,
  },
  play: async ({ canvasElement }) => {
    // Select the table container (parent of table element)
    const table = canvasElement.querySelector('table');
    const container = table?.parentElement;
    expect(container).toHaveStyle({ maxHeight: '150px', overflowY: 'auto' });
  },
};

/**
 * Large height - tests table with plenty of vertical space.
 */
export const LargeHeight: Story = {
  args: {
    tableData: mayTableData,
    maxHeight: 800,
  },
};

/**
 * Custom table data - minimal example.
 */
export const CustomData: Story = {
  args: {
    tableData: [
      { key: 'year', value: '2024', unit: '' },
      { key: 'month', value: '5', unit: '' },
      { key: 'main.energy_export', value: '-998.00', unit: 'kWh' },
      { key: 'main.energy_import', value: '382.00', unit: 'kWh' },
      { key: 'total_bill', value: '67.83', unit: '$' },
    ] as TableRow[],
    maxHeight: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify custom data appears
    await expect(canvas.getByText('year')).toBeInTheDocument();
    await expect(canvas.getByText('2024')).toBeInTheDocument();
    await expect(canvas.getByText('-998.00')).toBeInTheDocument();

    // Multiple rows have kWh, so use getAllByText
    const kwhElements = canvas.getAllByText('kWh');
    expect(kwhElements.length).toBe(2); // Two rows with kWh unit
  },
};
