import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { MeterChart } from './MeterChart';
import { mockBillingYear } from '../test/mocks/mockData/billingData';
import { getOffPeakValue, getPeakValue } from '@/types/utils';

const meta = {
  title: 'Components/MeterChart',
  component: MeterChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'SVG chart visualization showing meter data (generation or benefit) with import/export by time of day and peak/off-peak time zones.',
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
    offPeakExport: {
      control: { type: 'number' },
      description: 'Off-peak export value (kWh) - top-left quadrant',
    },
    peakExport: {
      control: { type: 'number' },
      description: 'Peak export value (kWh) - top-right quadrant',
    },
    offPeakImport: {
      control: { type: 'number' },
      description: 'Off-peak import value (kWh) - bottom-left quadrant',
    },
    peakImport: {
      control: { type: 'number' },
      description: 'Peak import value (kWh) - bottom-right quadrant',
    },
    meterType: {
      control: { type: 'radio' },
      options: ['generation', 'benefit'],
      description: 'Meter type: generation shows solar curve and export areas, benefit shows simplified consumption view',
    },
  },
} satisfies Meta<typeof MeterChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// Extract May month data for default story
const mayMonth = mockBillingYear.billing_months[0];
const mayOffPeakExport = mayMonth ? getOffPeakValue(mayMonth.main?.energy_export_meter_channel_2) : 0;
const mayPeakExport = mayMonth ? getPeakValue(mayMonth.main?.energy_export_meter_channel_2) : 0;
const mayOffPeakImport = mayMonth ? getOffPeakValue(mayMonth.main?.energy_import_meter_channel_1) : 0;
const mayPeakImport = mayMonth ? getPeakValue(mayMonth.main?.energy_import_meter_channel_1) : 0;

// ==================== GENERATION MODE STORIES ====================

/**
 * Default generation meter chart with May billing data.
 * Shows standard energy values with sine wave pattern.
 */
export const Default: Story = {
  args: {
    width: 600,
    height: 400,
    offPeakExport: mayOffPeakExport,
    peakExport: mayPeakExport,
    offPeakImport: mayOffPeakImport,
    peakImport: mayPeakImport,
    meterType: 'generation',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify SVG renders
    const svg = canvasElement.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Verify energy values render
    await expect(canvas.getByText('-884')).toBeInTheDocument(); // off-peak export
    await expect(canvas.getByText('-114')).toBeInTheDocument(); // peak export
    await expect(canvas.getByText('294')).toBeInTheDocument(); // off-peak import
    await expect(canvas.getByText('88')).toBeInTheDocument(); // peak import

    // Verify labels
    await expect(canvas.getByText('off-peak')).toBeInTheDocument();
    await expect(canvas.getByText('peak')).toBeInTheDocument();
  },
};

/**
 * Zero values - all energy values are 0.
 * Should display "N/A" for all values.
 */
export const ZeroValues: Story = {
  args: {
    width: 600,
    height: 400,
    offPeakExport: 0,
    peakExport: 0,
    offPeakImport: 0,
    peakImport: 0,
    meterType: 'generation',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should display N/A for zero values
    const naTexts = canvas.getAllByText('N/A');
    expect(naTexts.length).toBe(4); // All 4 quadrants show N/A
  },
};

/**
 * Small dimensions - 300x250 chart.
 * Tests chart scaling at smaller size.
 */
export const SmallDimensions: Story = {
  args: {
    width: 300,
    height: 250,
    offPeakExport: mayOffPeakExport,
    peakExport: mayPeakExport,
    offPeakImport: mayOffPeakImport,
    peakImport: mayPeakImport,
    meterType: 'generation',
  },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg');
    expect(svg).toHaveAttribute('width', '300');
    expect(svg).toHaveAttribute('height', '250');
  },
};

/**
 * Large dimensions - 900x600 chart.
 * Tests chart scaling at larger size.
 */
export const LargeDimensions: Story = {
  args: {
    width: 900,
    height: 600,
    offPeakExport: mayOffPeakExport,
    peakExport: mayPeakExport,
    offPeakImport: mayOffPeakImport,
    peakImport: mayPeakImport,
    meterType: 'generation',
  },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg');
    expect(svg).toHaveAttribute('width', '900');
    expect(svg).toHaveAttribute('height', '600');
  },
};

/**
 * High export values - negative numbers (solar generation).
 */
export const HighExport: Story = {
  args: {
    width: 600,
    height: 400,
    offPeakExport: -1500,
    peakExport: -800,
    offPeakImport: 100,
    peakImport: 50,
    meterType: 'generation',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify high export values
    await expect(canvas.getByText('-1500')).toBeInTheDocument();
    await expect(canvas.getByText('-800')).toBeInTheDocument();
  },
};

/**
 * High import values - positive numbers (grid consumption).
 */
export const HighImport: Story = {
  args: {
    width: 600,
    height: 400,
    offPeakExport: -50,
    peakExport: -25,
    offPeakImport: 1200,
    peakImport: 900,
    meterType: 'generation',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify high import values
    await expect(canvas.getByText('1200')).toBeInTheDocument();
    await expect(canvas.getByText('900')).toBeInTheDocument();
  },
};

// ==================== BENEFIT MODE STORIES ====================

/**
 * Benefit meter default - consumption-only view.
 * No solar curve, no export areas, only blue/red import rectangles.
 */
export const BenefitDefault: Story = {
  args: {
    width: 600,
    height: 400,
    offPeakExport: 0,
    peakExport: 0,
    offPeakImport: 294,
    peakImport: 88,
    meterType: 'benefit',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify SVG renders
    const svg = canvas.getByRole('img');
    await expect(svg).toBeInTheDocument();

    // Verify no solar curve exists (polyline should not exist)
    const polylines = canvasElement.querySelectorAll('polyline');
    await expect(polylines.length).toBe(0);

    // Verify export labels do not render at all in benefit mode
    // (no green/yellow numbers, not even "N/A")

    // Verify import values display
    await expect(canvas.getByText('294')).toBeInTheDocument();
    await expect(canvas.getByText('88')).toBeInTheDocument();

    // Verify blue and red rectangles exist (benefit mode uses rect, not path)
    const rects = canvasElement.querySelectorAll('rect');
    await expect(rects.length).toBeGreaterThan(2); // Border + label area + 2 fill rects
  },
};

/**
 * Benefit meter with zero values.
 * All quadrants should show "N/A".
 */
export const BenefitZeroValues: Story = {
  args: {
    width: 600,
    height: 400,
    offPeakExport: 0,
    peakExport: 0,
    offPeakImport: 0,
    peakImport: 0,
    meterType: 'benefit',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Only import quadrants should show N/A (export labels not rendered)
    const naLabels = canvas.getAllByText('N/A');
    await expect(naLabels.length).toBe(2); // Off-peak and peak import

    // No polyline (solar curve)
    const polylines = canvasElement.querySelectorAll('polyline');
    await expect(polylines.length).toBe(0);
  },
};

/**
 * Benefit meter with high import values.
 * Tests large consumption scenario.
 */
export const BenefitHighImport: Story = {
  args: {
    width: 600,
    height: 400,
    offPeakExport: 0,
    peakExport: 0,
    offPeakImport: 1200,
    peakImport: 900,
    meterType: 'benefit',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify high import values display (centered in blue/red areas)
    await expect(canvas.getByText('1200')).toBeInTheDocument();
    await expect(canvas.getByText('900')).toBeInTheDocument();

    // Export labels do not render in benefit mode

    // No solar curve
    const polylines = canvasElement.querySelectorAll('polyline');
    await expect(polylines.length).toBe(0);
  },
};

/**
 * Benefit meter with small dimensions.
 * Tests benefit mode at 300x250px.
 */
export const BenefitSmallDimensions: Story = {
  args: {
    width: 300,
    height: 250,
    offPeakExport: 0,
    peakExport: 0,
    offPeakImport: 150,
    peakImport: 75,
    meterType: 'benefit',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify dimensions
    const svg = canvas.getByRole('img');
    await expect(svg).toHaveAttribute('width', '300');
    await expect(svg).toHaveAttribute('height', '250');

    // No solar curve
    const polylines = canvasElement.querySelectorAll('polyline');
    await expect(polylines.length).toBe(0);
  },
};
