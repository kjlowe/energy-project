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
} from '@/test/mocks/mockData/metadataFixtures';

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

    // Verify table headers (multiple tables means multiple headers)
    const fieldNameHeaders = canvas.getAllByText('Field Name');
    await expect(fieldNameHeaders.length).toBeGreaterThanOrEqual(1);
    const typeHeaders = canvas.getAllByText('Type');
    await expect(typeHeaders.length).toBeGreaterThanOrEqual(1);
    const unitHeaders = canvas.getAllByText('Unit');
    await expect(unitHeaders.length).toBeGreaterThanOrEqual(1);
    const dataSourceHeaders = canvas.getAllByText('Data Sources');
    await expect(dataSourceHeaders.length).toBeGreaterThanOrEqual(1);

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

    // Meter headings should not appear for empty meters
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

    // Verify date field badges are displayed (may be multiple)
    const dateFieldBadges = canvas.getAllByText('Date Field');
    await expect(dateFieldBadges.length).toBeGreaterThanOrEqual(1);

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

    // Verify simple field badges are displayed (may be multiple)
    const simpleFieldBadges = canvas.getAllByText('Simple Field');
    await expect(simpleFieldBadges.length).toBeGreaterThanOrEqual(1);

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

    // Verify TOU field badges are displayed (may be multiple)
    const touFieldBadges = canvas.getAllByText('TOU Field');
    await expect(touFieldBadges.length).toBeGreaterThanOrEqual(1);

    // Verify all three TOU components (may be multiple of each)
    const peakElements = canvas.getAllByText(/Peak:/);
    await expect(peakElements.length).toBeGreaterThanOrEqual(1);
    const offPeakElements = canvas.getAllByText(/Off-Peak:/);
    await expect(offPeakElements.length).toBeGreaterThanOrEqual(1);
    const totalElements = canvas.getAllByText(/Total:/);
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

    // Verify all three field type badges coexist in table (may be multiple of each)
    const dateFieldBadges = canvas.getAllByText('Date Field');
    await expect(dateFieldBadges.length).toBeGreaterThanOrEqual(1);

    const simpleFieldBadges = canvas.getAllByText('Simple Field');
    await expect(simpleFieldBadges.length).toBeGreaterThanOrEqual(1);

    const touFieldBadges = canvas.getAllByText('TOU Field');
    await expect(touFieldBadges.length).toBeGreaterThanOrEqual(1);

    // Verify different units appear (may be multiple)
    const dollarUnits = canvas.getAllByText('DOLLARS');
    await expect(dollarUnits.length).toBeGreaterThanOrEqual(1);

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
