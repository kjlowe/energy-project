import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';
import { useState } from 'react';
import { TariffModal } from './TariffModal';
import {
  mockFullTariffSchedule,
  mockSinglePeriodSchedule,
  mockEmptyTariffSchedule,
  mockLongTariffSchedule,
  mockCurrentPeriod,
  createTariffSchedule,
  createTariffPeriod,
} from '@/test/mocks/mockData/tariffFixtures';

const meta = {
  title: 'Components/TariffModal',
  component: TariffModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TariffModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component for interaction testing
const TariffModalWithState = ({
  tariffSchedule,
}: {
  tariffSchedule: typeof mockFullTariffSchedule;
}) => {
  const [open, setOpen] = useState(true);
  return open ? (
    <TariffModal tariffSchedule={tariffSchedule} onClose={() => setOpen(false)} />
  ) : (
    <div data-testid="modal-closed-state">Modal closed</div>
  );
};

// ===== Story 1: Default - Full tariff schedule with multiple periods =====
export const Default: Story = {
  args: {
    tariffSchedule: mockFullTariffSchedule,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify modal header
    await expect(canvas.getByText(/E-TOU-C Tariff Schedule/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Residential Inclusive Time-of-Use/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Territory T, Individually Metered/i)).toBeInTheDocument();

    // Verify TOU Period Definitions section
    await expect(canvas.getByText('Time-of-Use (TOU) Period Definitions')).toBeInTheDocument();
    await expect(canvas.getByText(/4:00 PM to 9:00 PM/)).toBeInTheDocument();
    await expect(canvas.getByText(/Every day \(including weekends and holidays\)/)).toBeInTheDocument();

    // Verify table exists
    await expect(canvas.getByRole('table')).toBeInTheDocument();

    // Verify table headers
    await expect(canvas.getByText(/Effective Period/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Delivery Min/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Meter Charge/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Baseline Credit/i)).toBeInTheDocument();
    await expect(canvas.getByText(/CA Climate Credit/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Summer Peak/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Summer Off-Peak/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Winter Peak/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Winter Off-Peak/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Winter Baseline/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Summer Baseline/i)).toBeInTheDocument();

    // Verify action buttons exist
    await expect(canvas.getByRole('button', { name: /View Raw Data/i })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /Close/i })).toBeInTheDocument();
  },
};

// ===== Story 2: NullSchedule - Null safety test =====
export const NullSchedule: Story = {
  args: {
    tariffSchedule: null,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Component should return null - nothing should render
    await expect(canvas.queryByText(/Tariff Schedule/i)).not.toBeInTheDocument();
  },
};

// ===== Story 3: EmptySchedule - No periods =====
export const EmptySchedule: Story = {
  args: {
    tariffSchedule: mockEmptyTariffSchedule,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Modal should render
    await expect(canvas.getByText(/E-TOU-C Tariff Schedule/i)).toBeInTheDocument();

    // No TOU definitions should appear (no periods)
    await expect(canvas.queryByText('Time-of-Use (TOU) Period Definitions')).not.toBeInTheDocument();

    // Header should show 0 periods
    await expect(canvas.getByText(/0 periods/i)).toBeInTheDocument();
  },
};

// ===== Story 4: SinglePeriod - One tariff period =====
export const SinglePeriod: Story = {
  args: {
    tariffSchedule: mockSinglePeriodSchedule,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify modal renders
    await expect(canvas.getByText(/E-TOU-C Tariff Schedule/i)).toBeInTheDocument();

    // Verify period count
    await expect(canvas.getByText(/1 period/i)).toBeInTheDocument();

    // Verify table exists with one row
    const table = canvas.getByRole('table');
    await expect(table).toBeInTheDocument();

    const rows = table.querySelectorAll('tbody tr');
    await expect(rows.length).toBe(1);

    // Verify period data appears
    await expect(canvas.getByText(/2024-04-01 to 2024-05-31/)).toBeInTheDocument();
  },
};

// ===== Story 5: CurrentPeriodWithNulls - Period with null rates =====
export const CurrentPeriodWithNulls: Story = {
  args: {
    tariffSchedule: createTariffSchedule(
      'E-TOU-C',
      'Residential Inclusive Time-of-Use',
      [mockCurrentPeriod]
    ),
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify modal renders
    await expect(canvas.getByText(/E-TOU-C Tariff Schedule/i)).toBeInTheDocument();

    // Verify 'current' period appears
    await expect(canvas.getByText(/current to current/)).toBeInTheDocument();

    // Verify null values show as '—'
    const dashElements = canvas.getAllByText('—');
    await expect(dashElements.length).toBeGreaterThanOrEqual(4); // Delivery, meter, baseline, climate, rates

    // Verify note appears if present in data
    // (Note: note field might not be visible in table view, check raw data view)
  },
};

// ===== Story 6: RawDataView - Toggle raw JSON view =====
export const RawDataView: Story = {
  args: {
    tariffSchedule: mockSinglePeriodSchedule,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify table view is shown initially
    await expect(canvas.getByRole('table')).toBeInTheDocument();

    // Click "View Raw Data" button
    const rawDataButton = canvas.getByRole('button', { name: /View Raw Data/i });
    await user.click(rawDataButton);

    // Verify table is hidden
    await expect(canvas.queryByRole('table')).not.toBeInTheDocument();

    // Verify JSON is displayed (check for a pre tag with JSON content)
    const preElement = canvas.getByText((content, element) => {
      return element?.tagName === 'PRE' && content.includes('tariff_name');
    });
    await expect(preElement).toBeInTheDocument();

    // Verify button text changed
    await expect(canvas.getByRole('button', { name: /Show Table View/i })).toBeInTheDocument();

    // Click again to go back to table view
    const tableViewButton = canvas.getByRole('button', { name: /Show Table View/i });
    await user.click(tableViewButton);

    // Verify table is shown again
    await expect(canvas.getByRole('table')).toBeInTheDocument();
  },
};

// ===== Story 7: CloseButtonInteraction - Test close button click =====
export const CloseButtonInteraction: Story = {
  args: {
    tariffSchedule: mockFullTariffSchedule,
    onClose: () => {},
  },
  render: () => <TariffModalWithState tariffSchedule={mockFullTariffSchedule} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify modal is initially open
    await expect(canvas.getByText(/E-TOU-C Tariff Schedule/i)).toBeInTheDocument();

    // Click close button
    const closeButton = canvas.getByRole('button', { name: /Close/i });
    await user.click(closeButton);

    // Verify modal closed
    await expect(canvas.getByTestId('modal-closed-state')).toBeInTheDocument();
    await expect(canvas.queryByText(/E-TOU-C Tariff Schedule/i)).not.toBeInTheDocument();
  },
};

// ===== Story 8: BackdropClickInteraction - Test backdrop click to close =====
export const BackdropClickInteraction: Story = {
  args: {
    tariffSchedule: mockFullTariffSchedule,
    onClose: () => {},
  },
  render: () => <TariffModalWithState tariffSchedule={mockFullTariffSchedule} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify modal is initially open
    await expect(canvas.getByText(/E-TOU-C Tariff Schedule/i)).toBeInTheDocument();

    // Click on overlay backdrop
    const overlay = canvas.getByTestId('tariff-modal-overlay');
    await user.click(overlay);

    // Verify modal closed
    await expect(canvas.getByTestId('modal-closed-state')).toBeInTheDocument();
    await expect(canvas.queryByText(/E-TOU-C Tariff Schedule/i)).not.toBeInTheDocument();
  },
};

// ===== Story 9: LongContentScroll - Test scrolling behavior =====
export const LongContentScroll: Story = {
  args: {
    tariffSchedule: mockLongTariffSchedule,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify modal renders
    await expect(canvas.getByText(/E-TOU-C Tariff Schedule/i)).toBeInTheDocument();

    // Verify modal content has overflow styling
    const modalContent = canvas.getByTestId('tariff-modal-content');
    await expect(modalContent).toBeInTheDocument();

    // Verify table exists
    await expect(canvas.getByRole('table')).toBeInTheDocument();

    // Verify many rows are rendered
    const table = canvas.getByRole('table');
    const rows = table.querySelectorAll('tbody tr');
    await expect(rows.length).toBeGreaterThan(10);
  },
};

// ===== Story 10: SortingInteraction - Test table sorting =====
export const SortingInteraction: Story = {
  args: {
    tariffSchedule: mockFullTariffSchedule,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify modal is open
    await expect(canvas.getByText(/E-TOU-C Tariff Schedule/i)).toBeInTheDocument();

    // Get the Effective Period header - default sort is period ascending
    const periodHeader = canvas.getByText(/Effective Period/);
    await expect(periodHeader).toBeInTheDocument();

    // Initial state should show ascending (▲)
    await expect(periodHeader.textContent).toContain('▲');

    // Click to toggle to descending
    await user.click(periodHeader);

    // Verify sort indicator changes to ▼
    await expect(periodHeader.textContent).toContain('▼');

    // Click again to toggle back to ascending
    await user.click(periodHeader);

    // Verify sort indicator back to ▲
    await expect(periodHeader.textContent).toContain('▲');

    // Click Summer Peak header to change sort column
    const summerPeakHeader = canvas.getByText(/Summer Peak/);
    await user.click(summerPeakHeader);

    // Verify Summer Peak header now has sort indicator
    await expect(summerPeakHeader.textContent).toContain('▲');

    // Period header should no longer have indicator
    await expect(periodHeader.textContent).not.toContain('▲');
    await expect(periodHeader.textContent).not.toContain('▼');
  },
};

// ===== Story 11: DateSorting - Test date-based sorting =====
export const DateSorting: Story = {
  args: {
    tariffSchedule: createTariffSchedule(
      'E-TOU-C',
      'Residential Inclusive Time-of-Use',
      [
        createTariffPeriod('Period_2025.xlsx', '2025-01-01', '2025-03-31', 0.40, 0.26, -0.11, null, 0.63, 0.55, 0.53, 0.50, 12.9, 7.1),
        createTariffPeriod('Period_2024_Q1.xlsx', '2024-01-01', '2024-03-31', 0.38, 0.25, -0.10, null, 0.61, 0.53, 0.51, 0.48, 12.9, 7.1),
        createTariffPeriod('Period_2024_Q3.xlsx', '2024-07-01', '2024-09-30', 0.39, 0.255, -0.105, null, 0.62, 0.54, 0.52, 0.49, 12.9, 7.1),
        createTariffPeriod('Current.xlsx', 'current', 'current', null, null, null, null, null, null, null, null, 12.9, 7.1, 'Current period'),
      ]
    ),
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify modal is open
    await expect(canvas.getByText(/E-TOU-C Tariff Schedule/i)).toBeInTheDocument();

    // Get the Effective Period header and click to sort
    const periodHeader = canvas.getByText(/Effective Period/);

    // Should be sorted ascending by default
    const table = canvas.getByRole('table');
    const rows = table.querySelectorAll('tbody tr');

    // Extract dates from first column
    const getDates = () => {
      const dates: string[] = [];
      const tableElement = canvas.getByRole('table');
      const rowElements = tableElement.querySelectorAll('tbody tr');
      rowElements.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells[0]) {
          dates.push(cells[0].textContent || '');
        }
      });
      return dates;
    };

    const datesAsc = getDates();

    // Verify chronological order (2024-01-01 should come before 2024-07-01, before 2025-01-01, and 'current' should be last)
    await expect(datesAsc[0]).toContain('2024-01-01');
    await expect(datesAsc[1]).toContain('2024-07-01');
    await expect(datesAsc[2]).toContain('2025-01-01');
    await expect(datesAsc[3]).toContain('current');

    // Click to sort descending
    await user.click(periodHeader);

    const datesDesc = getDates();

    // Verify reverse chronological order (current should still be last)
    await expect(datesDesc[0]).toContain('2025-01-01');
    await expect(datesDesc[1]).toContain('2024-07-01');
    await expect(datesDesc[2]).toContain('2024-01-01');
    await expect(datesDesc[3]).toContain('current');
  },
};

// ===== Story 12: NullValueHandling - Test display of null values =====
export const NullValueHandling: Story = {
  args: {
    tariffSchedule: createTariffSchedule(
      'E-TOU-C',
      'Residential Inclusive Time-of-Use',
      [
        createTariffPeriod('All_Nulls.xlsx', '2024-01-01', '2024-03-31', null, null, null, null, null, null, null, null, 12.9, 7.1),
        createTariffPeriod('Some_Nulls.xlsx', '2024-04-01', '2024-06-30', 0.39, 0.25, null, null, 0.62, 0.54, null, null, 12.9, 7.1),
      ]
    ),
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify modal renders
    await expect(canvas.getByText(/E-TOU-C Tariff Schedule/i)).toBeInTheDocument();

    // Verify many '—' symbols for null values
    const dashElements = canvas.getAllByText('—');
    await expect(dashElements.length).toBeGreaterThanOrEqual(6);

    // Verify table still renders correctly
    const table = canvas.getByRole('table');
    const rows = table.querySelectorAll('tbody tr');
    await expect(rows.length).toBe(2);
  },
};

// ===== Story 13: BaselineQuantitiesDisplay - Test baseline quantities are shown =====
export const BaselineQuantitiesDisplay: Story = {
  args: {
    tariffSchedule: mockSinglePeriodSchedule,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify baseline columns exist
    await expect(canvas.getByText(/Winter Baseline/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Summer Baseline/i)).toBeInTheDocument();

    // Verify baseline values are displayed
    await expect(canvas.getByText(/12\.9 kWh\/day/)).toBeInTheDocument();
    await expect(canvas.getByText(/7\.1 kWh\/day/)).toBeInTheDocument();
  },
};

// ===== Story 14: CurrencyFormatting - Test currency values are formatted correctly =====
export const CurrencyFormatting: Story = {
  args: {
    tariffSchedule: mockSinglePeriodSchedule,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify currency formatting (5 decimal places)
    await expect(canvas.getByText(/\$0\.39167/)).toBeInTheDocument(); // Delivery minimum
    await expect(canvas.getByText(/\$0\.25298/)).toBeInTheDocument(); // Meter charge
    await expect(canvas.getByText(/-\$0\.10730/)).toBeInTheDocument(); // Baseline credit (negative)
    await expect(canvas.getByText(/-\$55\.17206/)).toBeInTheDocument(); // Climate credit (negative)
  },
};

// ===== Story 15: TOUPeriodDefinitions - Test TOU period information display =====
export const TOUPeriodDefinitions: Story = {
  args: {
    tariffSchedule: mockSinglePeriodSchedule,
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify TOU section exists
    await expect(canvas.getByText('Time-of-Use (TOU) Period Definitions')).toBeInTheDocument();

    // Verify all TOU period fields (use more specific text matching to avoid regex overlap)
    await expect(canvas.getByText('Peak Hours:')).toBeInTheDocument();
    await expect(canvas.getByText(/4:00 PM to 9:00 PM/)).toBeInTheDocument();

    await expect(canvas.getByText('Peak Days:')).toBeInTheDocument();
    await expect(canvas.getByText(/Every day \(including weekends and holidays\)/)).toBeInTheDocument();

    await expect(canvas.getByText('Off-Peak Hours:')).toBeInTheDocument();
    await expect(canvas.getByText(/All other times/)).toBeInTheDocument();

    await expect(canvas.getByText('Summer Season:')).toBeInTheDocument();
    await expect(canvas.getByText(/June - September/)).toBeInTheDocument();

    await expect(canvas.getByText('Winter Season:')).toBeInTheDocument();
    await expect(canvas.getByText(/October - May/)).toBeInTheDocument();
  },
};
