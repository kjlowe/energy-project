import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';
import { BillingMetadataTable } from './BillingMetadataTable';
import { mockBillingYear } from '../test/mocks/mockData/billingData';
import { mockFullMetadata } from '../test/mocks/mockData/metadataFixtures';

const meta = {
  title: 'Components/BillingMetadataTable',
  component: BillingMetadataTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Data-driven billing table that combines billing data with metadata to show field names, types, units, values, and source information. Iterates over billing data fields and looks up metadata for enrichment.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    meterData: {
      control: false,
      description: 'Billing data for a single meter (main or adu)',
    },
    meterMetadata: {
      control: false,
      description: 'Metadata for the same meter type',
    },
    maxHeight: {
      control: { type: 'range', min: 200, max: 800, step: 50 },
      description: 'Maximum height for scrollable area',
    },
  },
} satisfies Meta<typeof BillingMetadataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// Get May month data (first month)
const mayMonth = mockBillingYear.billing_months[0];

// Get June month data (second month)
const juneMonth = mockBillingYear.billing_months[1];

// ==================== STORIES ====================

/**
 * Default: Generation meter with May data and full metadata.
 * Shows all 8 columns sorted by fieldName (default).
 */
export const Default: Story = {
  args: {
    meterData: mayMonth?.main,
    meterMetadata: mockFullMetadata.generation_meter,
    maxHeight: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify table renders
    const table = canvas.getByRole('table');
    await expect(table).toBeInTheDocument();

    // Verify all 8 column headers exist
    const headers = canvasElement.querySelectorAll('th');
    expect(headers.length).toBe(8);

    // Verify header texts
    await expect(canvas.getByText(/Field Name ▲/i)).toBeInTheDocument(); // Default sort
    const headerTexts = Array.from(headers).map(h => h.textContent || '');
    expect(headerTexts.some(t => t.includes('Type'))).toBe(true);
    expect(headerTexts.some(t => t.includes('Unit'))).toBe(true);
    expect(headerTexts.some(t => t.includes('Value'))).toBe(true);

    // Verify some data renders (values from May billing data)
    const rows = canvasElement.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
  },
};

/**
 * Benefit Meter: Shows adu meter data with benefit metadata.
 */
export const BenefitMeter: Story = {
  args: {
    meterData: mayMonth?.adu,
    meterMetadata: mockFullMetadata.benefit_meter,
    maxHeight: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify table renders
    const table = canvas.getByRole('table');
    await expect(table).toBeInTheDocument();

    // Verify data renders
    const rows = canvasElement.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
  },
};

/**
 * June Data: Shows how values change for a different month.
 */
export const JuneData: Story = {
  args: {
    meterData: juneMonth?.main,
    meterMetadata: mockFullMetadata.generation_meter,
    maxHeight: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify table renders with June data
    const table = canvas.getByRole('table');
    await expect(table).toBeInTheDocument();

    // Verify June-specific value displays (different from May)
    await expect(canvas.getByText('-900.00')).toBeInTheDocument(); // June off-peak export
  },
};

/**
 * No Metadata: Shows graceful degradation when metadata is null.
 * Metadata columns show "—" but billing values still display.
 */
export const NoMetadata: Story = {
  args: {
    meterData: mayMonth?.main,
    meterMetadata: null,
    maxHeight: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify table still renders without metadata
    const table = canvas.getByRole('table');
    await expect(table).toBeInTheDocument();

    // Verify data still renders (billing data-driven approach)
    const rows = canvasElement.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);

    // Verify metadata columns show "—" for missing metadata
    const cells = canvasElement.querySelectorAll('tbody td');
    const dashCells = Array.from(cells).filter(cell => cell.textContent === '—');
    expect(dashCells.length).toBeGreaterThan(0); // Should have many "—" cells
  },
};

/**
 * No Billing Data: Shows empty state when meterData is null.
 */
export const NoBillingData: Story = {
  args: {
    meterData: null,
    meterMetadata: mockFullMetadata.generation_meter,
    maxHeight: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show empty state message
    await expect(canvas.getByText(/No billing data available/i)).toBeInTheDocument();

    // Should not render table
    const table = canvas.queryByRole('table');
    expect(table).not.toBeInTheDocument();
  },
};

/**
 * Small Height: Tests scrolling behavior with limited height.
 */
export const SmallHeight: Story = {
  args: {
    meterData: mayMonth?.main,
    meterMetadata: mockFullMetadata.generation_meter,
    maxHeight: 200,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify table renders
    const table = canvas.getByRole('table');
    await expect(table).toBeInTheDocument();

    // Verify sticky headers work
    const headers = canvasElement.querySelectorAll('th');
    expect(headers.length).toBe(8);

    // Verify data renders despite small height
    const rows = canvasElement.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
  },
};

/**
 * Interactive Sorting: Demonstrates sorting functionality.
 * Tests clicking headers to change sort column and direction.
 */
export const InteractiveSorting: Story = {
  args: {
    meterData: mayMonth?.main,
    meterMetadata: mockFullMetadata.generation_meter,
    maxHeight: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Initial state: sorted by fieldName ascending (default)
    await expect(canvas.getByText(/Field Name ▲/i)).toBeInTheDocument();

    // Click fieldName header to toggle to descending
    const fieldNameHeader = canvas.getByText(/Field Name/i);
    await user.click(fieldNameHeader);
    await expect(canvas.getByText(/Field Name ▼/i)).toBeInTheDocument();

    // Click Type header to sort by type
    const allHeaders = canvasElement.querySelectorAll('th');
    const typeHeader = Array.from(allHeaders).find(h => h.textContent?.includes('Type'));
    if (typeHeader) {
      await user.click(typeHeader);
      // Should now be sorted by type ascending
      await expect(canvas.getByText(/Type ▲/i)).toBeInTheDocument();
    }

    // Click Value header to sort by value (numeric)
    const valueHeader = Array.from(allHeaders).find(h => h.textContent?.includes('Value'));
    if (valueHeader) {
      await user.click(valueHeader);
      // Should now be sorted by value ascending
      await expect(canvas.getByText(/Value ▲/i)).toBeInTheDocument();
    }
  },
};

/**
 * Field Name Merging: Shows how TOU fields merge when sorted by fieldName.
 * When sorted by fieldName, rows with same field name use rowSpan to merge the fieldName cell.
 */
export const FieldNameMerging: Story = {
  args: {
    meterData: mayMonth?.main,
    meterMetadata: mockFullMetadata.generation_meter,
    maxHeight: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify default sort is by fieldName (should have merging)
    await expect(canvas.getByText(/Field Name ▲/i)).toBeInTheDocument();

    // Find a TOU field row group (e.g., energy_export_meter_channel_2)
    // Should have 3 rows (Peak, Off-Peak, Total) with shared field name
    const peakRows = canvasElement.querySelectorAll('tbody tr');

    // Look for cells with rowspan > 1 (merged cells)
    const mergedCells = Array.from(canvasElement.querySelectorAll('tbody td[rowspan]'))
      .filter(cell => {
        const rowSpan = cell.getAttribute('rowspan');
        return rowSpan && parseInt(rowSpan) > 1;
      });

    // Should have at least one merged field name cell for TOU fields
    expect(mergedCells.length).toBeGreaterThan(0);
  },
};

/**
 * Value Column Display: Shows how numeric values are formatted.
 * Negative values (export), positive values (import), and zero values.
 */
export const ValueColumnDisplay: Story = {
  args: {
    meterData: mayMonth?.main,
    meterMetadata: mockFullMetadata.generation_meter,
    maxHeight: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify table renders
    const table = canvas.getByRole('table');
    await expect(table).toBeInTheDocument();

    // Verify values are formatted to 2 decimal places by checking cell contents
    const allCells = canvasElement.querySelectorAll('tbody td');
    const formattedValues = Array.from(allCells).filter(cell => {
      const text = cell.textContent || '';
      return text.match(/^-?\d+\.\d{2}$/); // Number with exactly 2 decimals
    });
    expect(formattedValues.length).toBeGreaterThan(0);

    // Verify we have both negative and positive values
    const cellTexts = Array.from(allCells).map(c => c.textContent || '');
    const hasNegative = cellTexts.some(t => t.startsWith('-') && t.match(/\d/));
    const hasPositive = cellTexts.some(t => !t.startsWith('-') && t.match(/^\d+\.\d{2}$/));
    expect(hasNegative).toBe(true);
    expect(hasPositive).toBe(true);
  },
};

/**
 * Long Scroll Test: Many fields to demonstrate sticky headers and scrolling.
 */
export const LongScroll: Story = {
  args: {
    meterData: mayMonth?.main,
    meterMetadata: mockFullMetadata.generation_meter,
    maxHeight: 300,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify table renders
    const table = canvas.getByRole('table');
    await expect(table).toBeInTheDocument();

    // Verify rows render (billing data has several fields)
    const rows = canvasElement.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(5); // Should have multiple fields

    // Verify sticky headers exist
    const headers = canvasElement.querySelectorAll('th');
    expect(headers.length).toBe(8); // 8 columns
  },
};
