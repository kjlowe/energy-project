import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Solar from './Solar';
import { mockBillingYear } from '../test/mocks/mockData/billingData';
import type { BillingYearWithId } from '@/types/api';

describe('Solar Component', () => {
  describe('Empty States', () => {
    it('should display "No billing data available" when data is null', () => {
      render(<Solar data={null} width={400} height={400} />);

      expect(screen.getByText(/No billing data available/i)).toBeInTheDocument();
    });

    it('should display "No billing data available" when data has no billing_months', () => {
      const emptyData: BillingYearWithId = {
        id: 1,
        start_month: 5,
        start_year: 2024,
        num_months: 0,
        months: [],
        billing_months: [], // Empty array
      };

      render(<Solar data={emptyData} width={400} height={400} />);

      expect(screen.getByText(/No billing data available/i)).toBeInTheDocument();
    });

    it('should display "Invalid month index" when month index is out of bounds', () => {
      const dataWithOnlyOneMonth: BillingYearWithId = {
        id: 1,
        start_month: 5,
        start_year: 2024,
        num_months: 1,
        months: [{ month_name: 'May', year: 2024 }],
        billing_months: [
          {
            year: 2024,
            month: 5,
            month_label: { month_name: 'May', year: 2024 },
          },
        ],
      };

      // Component starts at monthIdx=1, but only has 1 month (index 0)
      render(<Solar data={dataWithOnlyOneMonth} width={400} height={400} />);

      expect(screen.getByText(/Invalid month index/i)).toBeInTheDocument();
    });
  });

  describe('Data Rendering - HTML Production', () => {
    it('should render month name in the document', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Component starts at monthIdx=1 (June)
      expect(screen.getByText(/Month: June/i)).toBeInTheDocument();
    });

    it('should render energy values as text in SVG', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Check June (monthIdx=1) values - rounded to 0 decimals
      expect(screen.getByText('-900')).toBeInTheDocument(); // off-peak export
      expect(screen.getByText('-150')).toBeInTheDocument(); // peak export
      expect(screen.getByText('250')).toBeInTheDocument();  // off-peak import
      expect(screen.getByText('75')).toBeInTheDocument();   // peak import
    });

    it('should render SVG elements with correct dimensions', () => {
      const { container } = render(<Solar data={mockBillingYear} width={400} height={400} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '400');
      expect(svg).toHaveAttribute('height', '400');
    });

    it('should render SVG paths and shapes', () => {
      const { container } = render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Check for polyline (solar curve)
      const polyline = container.querySelector('polyline');
      expect(polyline).toBeInTheDocument();

      // Check for rectangles (border, label area)
      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBeGreaterThan(0);
    });

    it('should render data table with billing month properties', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Check that table headers exist
      expect(screen.getByText('Property')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('Unit')).toBeInTheDocument();

      // Check that table has rows
      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should render month navigation controls', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Check for slider
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '1'); // 2 months, max index = 1

      // Check for navigation buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2); // prev and next
    });

    it('should display "off-peak" and "peak" labels', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      expect(screen.getByText('off-peak')).toBeInTheDocument();
      expect(screen.getByText('peak')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should navigate to previous month when clicking prev button', async () => {
      const user = userEvent.setup();
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Component starts at monthIdx=1 (June)
      expect(screen.getByText(/Month: June/i)).toBeInTheDocument();

      // Click previous button
      const prevButton = screen.getAllByRole('button')[0]!; // First button is prev
      await user.click(prevButton);

      // Should now show May
      expect(screen.getByText(/Month: May/i)).toBeInTheDocument();
    });

    it('should navigate to next month when clicking next button', async () => {
      const user = userEvent.setup();
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Start at June (monthIdx=1), navigate back to May
      const prevButton = screen.getAllByRole('button')[0]!;
      await user.click(prevButton);
      expect(screen.getByText(/Month: May/i)).toBeInTheDocument();

      // Click next to go back to June
      const nextButton = screen.getAllByRole('button')[1]!;
      await user.click(nextButton);

      expect(screen.getByText(/Month: June/i)).toBeInTheDocument();
    });

    it('should render slider with correct range', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;

      // Verify slider has correct attributes
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '1'); // 2 months, max index = 1
      expect(slider).toHaveAttribute('step', '1');
      // Starts at month index 1 (June)
      expect(slider.value).toBe('1');
    });

    it('should disable prev button at first month', async () => {
      const user = userEvent.setup();
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Navigate to first month (May)
      const prevButton = screen.getAllByRole('button')[0]!;
      await user.click(prevButton);

      // Prev button should be disabled
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button at last month', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Component starts at monthIdx=1 (last month in 2-month data)
      const nextButton = screen.getAllByRole('button')[1]!;

      // Next button should be disabled
      expect(nextButton).toBeDisabled();
    });

    it('should update energy values when changing months', async () => {
      const user = userEvent.setup();
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // June (monthIdx=1) should show -900
      expect(screen.getByText('-900')).toBeInTheDocument();

      // Navigate to May (monthIdx=0)
      const prevButton = screen.getAllByRole('button')[0]!;
      await user.click(prevButton);

      // May should show -884
      expect(screen.getByText('-884')).toBeInTheDocument();
      // June value should no longer be visible
      expect(screen.queryByText('-900')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values correctly', () => {
      const dataWithZeros = {
        id: 1,
        start_month: 1,
        start_year: 2024,
        num_months: 2,
        months: [
          { month_name: 'January', year: 2024 },
          { month_name: 'February', year: 2024 },
        ],
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
          {
            year: 2024,
            month: 2,
            month_label: { month_name: 'February', year: 2024 },
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
      } as any;

      render(<Solar data={dataWithZeros} width={400} height={400} />);

      // Should display "N/A" for zero values
      const naTexts = screen.getAllByText('N/A');
      expect(naTexts.length).toBeGreaterThan(0);
    });

    it('should handle missing nested data gracefully', () => {
      const dataWithMissingNested: BillingYearWithId = {
        id: 1,
        start_month: 1,
        start_year: 2024,
        num_months: 2,
        months: [
          { month_name: 'January', year: 2024 },
          { month_name: 'February', year: 2024 },
        ],
        billing_months: [
          {
            year: 2024,
            month: 1,
            month_label: { month_name: 'January', year: 2024 },
            // Missing 'main' object
          },
          {
            year: 2024,
            month: 2,
            month_label: { month_name: 'February', year: 2024 },
            // Missing 'main' object
          },
        ],
      };

      render(<Solar data={dataWithMissingNested} width={400} height={400} />);

      // Should display N/A for missing values
      const naTexts = screen.getAllByText('N/A');
      expect(naTexts.length).toBeGreaterThan(0);
    });
  });
});
