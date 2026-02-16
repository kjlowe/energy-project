import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, waitFor, userEvent } from 'storybook/test';
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

    // Verify NO expand buttons since all metrics have single subcomponents
    const expandButtons = canvas.queryAllByRole('button', { name: /Expand/i });
    await expect(expandButtons).toHaveLength(0);

    // Verify toggle button exists (starts in dense view)
    const toggleButton = canvas.getByRole('button', { name: /Show All Columns/i });
    await expect(toggleButton).toBeInTheDocument();
  },
};

export const WithMultipleSubcomponents: Story = {
  args: {
    data: {
      id: 100,
      start_month: 5,
      start_year: 2024,
      num_months: 1,
      months: [{ month_name: 'May', year: 2024 }],
      billing_months: [
        {
          year: 2024,
          month: 5,
          month_label: { month_name: 'May', year: 2024 },
          main: {
            billing_date: { value: '2024-05-14' },
            service_end_date: { value: '2024-05-07' },
            energy_export_meter_channel_2: {
              peak: {
                subcomponent_values: [-50.0, -63.825],  // Multiple subcomponents!
                value: -113.825,
                unit: 'kWh',
              },
              off_peak: {
                subcomponent_values: [-400.0, -484.175],  // Multiple subcomponents!
                value: -884.175,
                unit: 'kWh',
              },
              total: {
                subcomponent_values: [-450.0, -548.0],  // Multiple subcomponents!
                value: -998.0,
                unit: 'kWh',
              },
            },
            energy_import_meter_channel_1: {
              peak: { subcomponent_values: [88.0], value: 88.0, unit: 'kWh' },
              off_peak: { subcomponent_values: [294.0], value: 294.0, unit: 'kWh' },
              total: { subcomponent_values: [382.0], value: 382.0, unit: 'kWh' },
            },
            total_bill_in_mail: {
              subcomponent_values: [67.83],
              value: 67.83,
              unit: 'kWh',
            },
          },
          adu: {
            billing_date: { value: '2024-05-14' },
            service_end_date: { value: '2024-05-07' },
            energy_export_meter_channel_2: {
              peak: { subcomponent_values: [0.0], value: 0.0, unit: 'kWh' },
              off_peak: { subcomponent_values: [0.0], value: 0.0, unit: 'kWh' },
              total: { subcomponent_values: [0.0], value: 0.0, unit: 'kWh' },
            },
            energy_import_meter_channel_1: {
              peak: { subcomponent_values: [25.0], value: 25.0, unit: 'kWh' },
              off_peak: { subcomponent_values: [100.0], value: 100.0, unit: 'kWh' },
              total: { subcomponent_values: [125.0], value: 125.0, unit: 'kWh' },
            },
            total_bill_in_mail: {
              subcomponent_values: [15.50],
              value: 15.50,
              unit: 'kWh',
            },
          },
        },
      ],
    } as BillingYearWithId,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify expand button IS present (month has metrics with 2+ subcomponents)
    const buttons = canvas.getAllByRole('button', { name: /Expand/i });
    await expect(buttons).toHaveLength(1);
  },
};

export const DenseViewToggle: Story = {
  args: {
    data: mockBillingYear,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Start in dense view - should have fewer columns
    const toggleButton = canvas.getByRole('button', { name: /Show All Columns/i });
    await expect(toggleButton).toBeInTheDocument();

    // Dense view should have dates, energy_export_meter_channel_2, energy_import_meter_channel_1,
    // pce_energy_cost, pce_nem_credit, pge_electric_delivery_charges, total_bill_in_mail for main
    await expect(canvas.getByText('energy_export_meter_channel_2')).toBeInTheDocument();

    // energy_import_meter_channel_1 appears in both main and adu in dense view
    const energyImportHeaders = canvas.getAllByText('energy_import_meter_channel_1');
    await expect(energyImportHeaders.length).toBeGreaterThanOrEqual(2);

    // Dense view should NOT have allocated_export_energy_credits (not in dense list)
    await expect(canvas.queryByText('allocated_export_energy_credits')).not.toBeInTheDocument();

    // Click to expand to full view
    await user.click(toggleButton);

    // Wait for full view to appear
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: /Show Fewer Columns/i })).toBeInTheDocument();
    });

    // Full view should now show allocated_export_energy_credits (appears in both main and adu)
    await waitFor(() => {
      const allocatedHeaders = canvas.queryAllByText('allocated_export_energy_credits');
      expect(allocatedHeaders.length).toBeGreaterThan(0);
    });

    // Click again to go back to dense view
    const showFewerButton = canvas.getByRole('button', { name: /Show Fewer Columns/i });
    await user.click(showFewerButton);

    // Dense view again - allocated_export_energy_credits should be gone
    await waitFor(() => {
      const allocatedHeaders = canvas.queryAllByText('allocated_export_energy_credits');
      expect(allocatedHeaders).toHaveLength(0);
    });
  },
};

export const MixedSubcomponents: Story = {
  args: {
    data: {
      id: 101,
      start_month: 7,
      start_year: 2024,
      num_months: 2,
      months: [
        { month_name: 'July', year: 2024 },
        { month_name: 'August', year: 2024 },
      ],
      billing_months: [
        {
          year: 2024,
          month: 7,
          month_label: { month_name: 'July', year: 2024 },
          main: {
            billing_date: { value: '2024-07-14' },
            service_end_date: { value: '2024-07-07' },
            // These have multiple subcomponents
            energy_export_meter_channel_2: {
              peak: {
                subcomponent_values: [-60.0, -53.825],
                value: -113.825,
                unit: 'kWh',
              },
              off_peak: {
                subcomponent_values: [-500.0, -384.175],
                value: -884.175,
                unit: 'kWh',
              },
              total: {
                subcomponent_values: [-560.0, -438.0],
                value: -998.0,
                unit: 'kWh',
              },
            },
            // These have single subcomponents
            energy_import_meter_channel_1: {
              peak: { subcomponent_values: [88.0], value: 88.0, unit: 'kWh' },
              off_peak: { subcomponent_values: [294.0], value: 294.0, unit: 'kWh' },
              total: { subcomponent_values: [382.0], value: 382.0, unit: 'kWh' },
            },
            total_bill_in_mail: {
              subcomponent_values: [67.83],
              value: 67.83,
              unit: 'kWh',
            },
          },
          adu: {
            billing_date: { value: '2024-07-14' },
            service_end_date: { value: '2024-07-07' },
            energy_export_meter_channel_2: {
              peak: { subcomponent_values: [0.0], value: 0.0, unit: 'kWh' },
              off_peak: { subcomponent_values: [0.0], value: 0.0, unit: 'kWh' },
              total: { subcomponent_values: [0.0], value: 0.0, unit: 'kWh' },
            },
            energy_import_meter_channel_1: {
              peak: { subcomponent_values: [25.0], value: 25.0, unit: 'kWh' },
              off_peak: { subcomponent_values: [100.0], value: 100.0, unit: 'kWh' },
              total: { subcomponent_values: [125.0], value: 125.0, unit: 'kWh' },
            },
            total_bill_in_mail: {
              subcomponent_values: [15.50],
              value: 15.50,
              unit: 'kWh',
            },
          },
        },
        {
          year: 2024,
          month: 8,
          month_label: { month_name: 'August', year: 2024 },
          main: {
            billing_date: { value: '2024-08-14' },
            service_end_date: { value: '2024-08-07' },
            // All have single subcomponents for this month
            energy_export_meter_channel_2: {
              peak: { subcomponent_values: [-150.0], value: -150.0, unit: 'kWh' },
              off_peak: { subcomponent_values: [-900.0], value: -900.0, unit: 'kWh' },
              total: { subcomponent_values: [-1050.0], value: -1050.0, unit: 'kWh' },
            },
            energy_import_meter_channel_1: {
              peak: { subcomponent_values: [75.0], value: 75.0, unit: 'kWh' },
              off_peak: { subcomponent_values: [250.0], value: 250.0, unit: 'kWh' },
              total: { subcomponent_values: [325.0], value: 325.0, unit: 'kWh' },
            },
            total_bill_in_mail: {
              subcomponent_values: [55.25],
              value: 55.25,
              unit: 'kWh',
            },
          },
          adu: {
            billing_date: { value: '2024-08-14' },
            service_end_date: { value: '2024-08-07' },
            energy_export_meter_channel_2: {
              peak: { subcomponent_values: [0.0], value: 0.0, unit: 'kWh' },
              off_peak: { subcomponent_values: [0.0], value: 0.0, unit: 'kWh' },
              total: { subcomponent_values: [0.0], value: 0.0, unit: 'kWh' },
            },
            energy_import_meter_channel_1: {
              peak: { subcomponent_values: [30.0], value: 30.0, unit: 'kWh' },
              off_peak: { subcomponent_values: [110.0], value: 110.0, unit: 'kWh' },
              total: { subcomponent_values: [140.0], value: 140.0, unit: 'kWh' },
            },
            total_bill_in_mail: {
              subcomponent_values: [18.75],
              value: 18.75,
              unit: 'kWh',
            },
          },
        },
      ],
    } as BillingYearWithId,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify expand button is present for July (has metrics with 2+ subcomponents)
    // August should NOT have an expand button (all single subcomponents)
    const buttons = canvas.getAllByRole('button', { name: /Expand/i });
    await expect(buttons).toHaveLength(1);

    // Verify both months are present in the table
    const rows = canvas.getAllByRole('row');
    const rowTexts = rows.map((row) => row.textContent);
    await expect(rowTexts.some((text) => text?.includes('July') && text?.includes('2024'))).toBe(true);
    await expect(rowTexts.some((text) => text?.includes('August') && text?.includes('2024'))).toBe(true);

    // Click the expand button for July
    await user.click(buttons[0]!);

    // After expanding, verify subcomponent rows appear
    // Should show 2 subcomponent rows (since max subcomponents is 2)
    await waitFor(() => {
      expect(canvas.getByText('└─ subcomponent 1')).toBeInTheDocument();
      expect(canvas.getByText('└─ subcomponent 2')).toBeInTheDocument();
    });
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
