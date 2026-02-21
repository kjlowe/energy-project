import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';
import { useState } from 'react';
import { MetadataModal } from './MetadataModal';
import {
  mockFullMetadata,
  mockDateFieldsOnly,
  mockSimpleFieldsOnly,
  mockTOUFieldsOnly,
  mockGenerationMeterOnly,
  mockBenefitMeterOnly,
  mockLongMetadata,
  createBillingStructureMetadata,
  createMeterMetadata,
  createSimpleField,
  createFieldSource,
} from '@/test/mocks/mockData/metadataFixtures';
import { Unit, WhereFrom } from '@/types/generated/metadata';

const meta = {
  title: 'Components/MetadataModal',
  component: MetadataModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MetadataModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component for interaction testing
const MetadataModalWithState = ({
  metadata,
}: {
  metadata: typeof mockFullMetadata;
}) => {
  const [open, setOpen] = useState(true);
  return open ? (
    <MetadataModal metadata={metadata} onClose={() => setOpen(false)} />
  ) : (
    <div data-testid="modal-closed-state">Modal closed</div>
  );
};

// ===== Story 1: Default - Full metadata with all field types =====
export const Default: Story = {
  args: {
    metadata: mockFullMetadata,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify modal header
    await expect(canvas.getByText('Billing Metadata')).toBeInTheDocument();

    // Verify both meter sections
    await expect(canvas.getByText('Generation Meter')).toBeInTheDocument();
    await expect(canvas.getByText('Benefit Meter')).toBeInTheDocument();

    // Verify table structure exists
    const tables = canvas.getAllByRole('table');
    await expect(tables.length).toBeGreaterThanOrEqual(1);

    // Verify new table headers (using regex to match headers with sort indicators)
    await expect(canvas.getAllByText(/Field Name/i).length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText(/Type/i).length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText(/TOU/i).length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText(/Unit/i).length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText(/Where From/i).length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText(/Page/i).length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText(/Number Code/i).length).toBeGreaterThanOrEqual(1);

    // Verify close button exists
    await expect(canvas.getByRole('button', { name: /Close/i })).toBeInTheDocument();
  },
};

// ===== Story 2: NullMetadata - Null safety test =====
export const NullMetadata: Story = {
  args: {
    metadata: null,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Component should return null - nothing should render
    await expect(canvas.queryByText('Billing Metadata')).not.toBeInTheDocument();
  },
};

// ===== Story 3: EmptyMeters - Empty fields objects =====
export const EmptyMeters: Story = {
  args: {
    metadata: createBillingStructureMetadata(
      createMeterMetadata({}),
      createMeterMetadata({})
    ),
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Modal should render
    await expect(canvas.getByText('Billing Metadata')).toBeInTheDocument();

    // No tables should appear for empty meters
    const tables = canvas.queryAllByRole('table');
    await expect(tables.length).toBe(0);

    // Meter headings should not appear for empty meters (no rows means no sections)
    await expect(canvas.queryByText('Generation Meter')).not.toBeInTheDocument();
    await expect(canvas.queryByText('Benefit Meter')).not.toBeInTheDocument();
  },
};

// ===== Story 4: DateFieldsOnly - Only date field types =====
export const DateFieldsOnly: Story = {
  args: {
    metadata: mockDateFieldsOnly,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify table exists
    await expect(canvas.getByRole('table')).toBeInTheDocument();

    // Verify date field badges are displayed (uppercase badges)
    const dateFieldBadges = canvas.getAllByText(/DATE FIELD/i);
    await expect(dateFieldBadges.length).toBeGreaterThanOrEqual(1);

    // Verify TOU column shows '—' for date fields
    const dashElements = canvas.getAllByText('—');
    await expect(dashElements.length).toBeGreaterThanOrEqual(1);

    // Verify WhereFrom enum values appear (PDF_BILL, may be multiple)
    const pdfBillElements = canvas.getAllByText(/PDF_BILL/);
    await expect(pdfBillElements.length).toBeGreaterThanOrEqual(1);

    // Verify field names appear in table
    await expect(canvas.getByText('billing_date')).toBeInTheDocument();
  },
};

// ===== Story 5: SimpleFieldsOnly - Only simple field types =====
export const SimpleFieldsOnly: Story = {
  args: {
    metadata: mockSimpleFieldsOnly,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify table exists
    await expect(canvas.getByRole('table')).toBeInTheDocument();

    // Verify simple field badges are displayed (uppercase badges)
    const simpleFieldBadges = canvas.getAllByText(/SIMPLE FIELD/i);
    await expect(simpleFieldBadges.length).toBeGreaterThanOrEqual(1);

    // Verify TOU column shows '—' for simple fields
    const dashElements = canvas.getAllByText('—');
    await expect(dashElements.length).toBeGreaterThanOrEqual(1);

    // Verify Unit is displayed in table (may be multiple)
    const dollarUnits = canvas.getAllByText('DOLLARS');
    await expect(dollarUnits.length).toBeGreaterThanOrEqual(1);

    // Verify field names appear
    await expect(canvas.getByText('california_climate_credit')).toBeInTheDocument();
  },
};

// ===== Story 6: TOUFieldsOnly - Only TOU field types =====
export const TOUFieldsOnly: Story = {
  args: {
    metadata: mockTOUFieldsOnly,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify table exists
    await expect(canvas.getByRole('table')).toBeInTheDocument();

    // Verify TOU field badges are displayed (uppercase badges)
    const touFieldBadges = canvas.getAllByText(/TOU FIELD/i);
    await expect(touFieldBadges.length).toBeGreaterThanOrEqual(1);

    // Verify all three TOU components in TOU column (Peak, Off-Peak, Total)
    const peakElements = canvas.getAllByText('Peak');
    await expect(peakElements.length).toBeGreaterThanOrEqual(1);
    const offPeakElements = canvas.getAllByText('Off-Peak');
    await expect(offPeakElements.length).toBeGreaterThanOrEqual(1);
    const totalElements = canvas.getAllByText('Total');
    await expect(totalElements.length).toBeGreaterThanOrEqual(1);

    // Verify units for TOU fields (may be multiple)
    const kwhUnits = canvas.getAllByText('KILOWATT_HOURS');
    await expect(kwhUnits.length).toBeGreaterThanOrEqual(1);
  },
};

// ===== Story 7: GenerationMeterOnly - Only generation_meter populated =====
export const GenerationMeterOnly: Story = {
  args: {
    metadata: mockGenerationMeterOnly,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Generation meter should have content
    await expect(canvas.getByText('Generation Meter')).toBeInTheDocument();

    // Benefit meter should not appear (empty meter is hidden)
    await expect(canvas.queryByText('Benefit Meter')).not.toBeInTheDocument();

    // Verify at least one field exists under generation meter
    await expect(canvas.getByText('billing_date')).toBeInTheDocument();

    // Verify table exists
    await expect(canvas.getByRole('table')).toBeInTheDocument();
  },
};

// ===== Story 8: BenefitMeterOnly - Only benefit_meter populated =====
export const BenefitMeterOnly: Story = {
  args: {
    metadata: mockBenefitMeterOnly,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Benefit meter should render
    await expect(canvas.getByText('Benefit Meter')).toBeInTheDocument();

    // Generation meter should not appear (empty meter is hidden)
    await expect(canvas.queryByText('Generation Meter')).not.toBeInTheDocument();

    // Benefit meter should have at least one field
    await expect(canvas.getByText('billing_date')).toBeInTheDocument();

    // Verify table exists
    await expect(canvas.getByRole('table')).toBeInTheDocument();
  },
};

// ===== Story 9: MixedFieldTypes - All field types in one meter =====
export const MixedFieldTypes: Story = {
  args: {
    metadata: mockFullMetadata,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all three field type badges coexist in table (uppercase badges)
    const dateFieldBadges = canvas.getAllByText(/DATE FIELD/i);
    await expect(dateFieldBadges.length).toBeGreaterThanOrEqual(1);

    const simpleFieldBadges = canvas.getAllByText(/SIMPLE FIELD/i);
    await expect(simpleFieldBadges.length).toBeGreaterThanOrEqual(1);

    const touFieldBadges = canvas.getAllByText(/TOU FIELD/i);
    await expect(touFieldBadges.length).toBeGreaterThanOrEqual(1);

    // Verify different units appear (may be multiple)
    const dollarUnits = canvas.getAllByText('DOLLARS');
    await expect(dollarUnits.length).toBeGreaterThanOrEqual(1);

    // Verify TOU components appear
    const peakElements = canvas.getAllByText('Peak');
    await expect(peakElements.length).toBeGreaterThanOrEqual(1);

    // Verify tables exist
    const tables = canvas.getAllByRole('table');
    await expect(tables.length).toBeGreaterThanOrEqual(1);
  },
};

// ===== Story 10: CloseButtonInteraction - Test close button click =====
export const CloseButtonInteraction: Story = {
  args: {
    metadata: mockFullMetadata,
    onClose: () => {},
  },
  render: () => <MetadataModalWithState metadata={mockFullMetadata} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify modal is initially open
    await expect(canvas.getByText('Billing Metadata')).toBeInTheDocument();

    // Click close button
    const closeButton = canvas.getByRole('button', { name: /Close/i });
    await user.click(closeButton);

    // Verify modal closed
    await expect(canvas.getByTestId('modal-closed-state')).toBeInTheDocument();
    await expect(canvas.queryByText('Billing Metadata')).not.toBeInTheDocument();
  },
};

// ===== Story 11: BackdropClickInteraction - Test backdrop click to close =====
export const BackdropClickInteraction: Story = {
  args: {
    metadata: mockFullMetadata,
    onClose: () => {},
  },
  render: () => <MetadataModalWithState metadata={mockFullMetadata} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify modal is initially open
    await expect(canvas.getByText('Billing Metadata')).toBeInTheDocument();

    // Click on overlay backdrop
    // Note: We'll need to add data-testid to the overlay in MetadataModal.tsx
    const overlay = canvas.getByTestId('metadata-modal-overlay');
    await user.click(overlay);

    // Verify modal closed
    await expect(canvas.getByTestId('modal-closed-state')).toBeInTheDocument();
    await expect(canvas.queryByText('Billing Metadata')).not.toBeInTheDocument();
  },
};

// ===== Story 12: LongContentScroll - Test scrolling behavior =====
export const LongContentScroll: Story = {
  args: {
    metadata: mockLongMetadata,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify modal renders
    await expect(canvas.getByText('Billing Metadata')).toBeInTheDocument();

    // Verify modal content has overflow styling
    const modalContent = canvas.getByTestId('metadata-modal-content');
    await expect(modalContent).toBeInTheDocument();

    // Verify tables exist
    const tables = canvas.getAllByRole('table');
    await expect(tables.length).toBeGreaterThanOrEqual(1);

    // Verify many rows are rendered (multiple fields in table)
    const rows = canvas.getAllByRole('row');
    await expect(rows.length).toBeGreaterThan(10);
  },
};

// ===== Story 13: SortingInteraction - Test table sorting =====
export const SortingInteraction: Story = {
  args: {
    metadata: mockFullMetadata,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify modal is open
    await expect(canvas.getByText('Billing Metadata')).toBeInTheDocument();

    // Get the Field Name header (first table) - default sort is Field Name ascending
    const fieldNameHeaders = canvas.getAllByText(/Field Name/);
    await expect(fieldNameHeaders.length).toBeGreaterThanOrEqual(1);

    // Initial state should show ascending (▲)
    await expect(fieldNameHeaders[0].textContent).toContain('▲');

    // Click to toggle to descending
    await user.click(fieldNameHeaders[0]);

    // Verify sort indicator changes to ▼
    await expect(fieldNameHeaders[0].textContent).toContain('▼');

    // Click again to toggle back to ascending
    await user.click(fieldNameHeaders[0]);

    // Verify sort indicator back to ▲
    await expect(fieldNameHeaders[0].textContent).toContain('▲');

    // Click Type header to change sort column
    const typeHeaders = canvas.getAllByText(/^Type/);
    await user.click(typeHeaders[0]);

    // Verify Type header now has sort indicator (ascending by default when changing columns)
    await expect(typeHeaders[0].textContent).toContain('▲');

    // Field Name should no longer have indicator
    await expect(fieldNameHeaders[0].textContent).not.toContain('▲');
    await expect(fieldNameHeaders[0].textContent).not.toContain('▼');
  },
};

// ===== Story 14: NumericSorting - Test numeric sorting of number codes =====
export const NumericSorting: Story = {
  args: {
    metadata: createBillingStructureMetadata(
      createMeterMetadata({
        field_with_2: createSimpleField(Unit.DOLLARS, [
          createFieldSource(WhereFrom.PDF_BILL, 'Page 1', 2),
        ]),
        field_with_10: createSimpleField(Unit.DOLLARS, [
          createFieldSource(WhereFrom.PDF_BILL, 'Page 2', 10),
        ]),
        field_with_25: createSimpleField(Unit.DOLLARS, [
          createFieldSource(WhereFrom.PDF_BILL, 'Page 3', 25),
        ]),
        field_with_3: createSimpleField(Unit.DOLLARS, [
          createFieldSource(WhereFrom.PDF_BILL, 'Page 4', 3),
        ]),
        field_with_100: createSimpleField(Unit.DOLLARS, [
          createFieldSource(WhereFrom.PDF_BILL, 'Page 5', 100),
        ]),
        field_with_empty: createSimpleField(Unit.DOLLARS, [
          createFieldSource(WhereFrom.CALCULATED, ''), // No number code (will be '—')
        ]),
      }),
      undefined
    ),
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify modal is open
    await expect(canvas.getByText('Billing Metadata')).toBeInTheDocument();

    // Click Number Code header to sort by number code
    const numberCodeHeaders = canvas.getAllByText(/Number Code/);
    await user.click(numberCodeHeaders[0]);

    // Verify sort indicator shows ascending
    await expect(numberCodeHeaders[0].textContent).toContain('▲');

    // Get all table rows (excluding header row)
    const table = canvas.getByRole('table');
    const rows = table.querySelectorAll('tbody tr');

    // Extract number codes from the table in display order
    const numberCodes: string[] = [];
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      // Last cell is the number code
      const numberCodeCell = cells[cells.length - 1];
      if (numberCodeCell) {
        numberCodes.push(numberCodeCell.textContent || '');
      }
    });

    // Verify numeric ascending order: 2, 3, 10, 25, 100, then empty ('—') last
    await expect(numberCodes[0]).toBe('2');
    await expect(numberCodes[1]).toBe('3');
    await expect(numberCodes[2]).toBe('10');
    await expect(numberCodes[3]).toBe('25');
    await expect(numberCodes[4]).toBe('100');
    await expect(numberCodes[5]).toBe('—'); // Empty values always last

    // Click again to sort descending
    await user.click(numberCodeHeaders[0]);

    // Verify sort indicator shows descending
    await expect(numberCodeHeaders[0].textContent).toContain('▼');

    // Get rows again after re-sort
    const rowsDesc = table.querySelectorAll('tbody tr');
    const numberCodesDesc: string[] = [];
    rowsDesc.forEach(row => {
      const cells = row.querySelectorAll('td');
      const numberCodeCell = cells[cells.length - 1];
      if (numberCodeCell) {
        numberCodesDesc.push(numberCodeCell.textContent || '');
      }
    });

    // Verify numeric descending order: 100, 25, 10, 3, 2, then empty ('—') last
    await expect(numberCodesDesc[0]).toBe('100');
    await expect(numberCodesDesc[1]).toBe('25');
    await expect(numberCodesDesc[2]).toBe('10');
    await expect(numberCodesDesc[3]).toBe('3');
    await expect(numberCodesDesc[4]).toBe('2');
    await expect(numberCodesDesc[5]).toBe('—'); // Empty values always last
  },
};
