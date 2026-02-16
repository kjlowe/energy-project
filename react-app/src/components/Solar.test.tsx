import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

    it('should display "No billing data available" when billing_months is empty', () => {
      const dataWithNoMonths: BillingYearWithId = {
        id: 1,
        start_month: 5,
        start_year: 2024,
        num_months: 0,
        months: [],
        billing_months: [],
      };

      // Component starts at monthIdx=0, but has no months (empty array)
      render(<Solar data={dataWithNoMonths} width={400} height={400} />);

      expect(screen.getByText(/No billing data available/i)).toBeInTheDocument();
    });
  });

  describe('Data Rendering - HTML Production', () => {
    it('should render month name in the document', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Component starts at monthIdx=0 (May)
      expect(screen.getByText(/Month: May/i)).toBeInTheDocument();
    });

    it('should render energy values as text in SVG', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Check May (monthIdx=0) values - rounded to 0 decimals
      expect(screen.getByText('-884')).toBeInTheDocument(); // off-peak export
      expect(screen.getByText('-114')).toBeInTheDocument(); // peak export (rounded from -113.825)
      expect(screen.getByText('294')).toBeInTheDocument();  // off-peak import
      expect(screen.getByText('88')).toBeInTheDocument();   // peak import
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

      // Component starts at monthIdx=0 (May)
      expect(screen.getByText(/Month: May/i)).toBeInTheDocument();

      // Navigate to next month first (June)
      const nextButton = screen.getAllByRole('button')[1]!; // Second button is next
      await user.click(nextButton);
      expect(screen.getByText(/Month: June/i)).toBeInTheDocument();

      // Now click previous button to go back to May
      const prevButton = screen.getAllByRole('button')[0]!; // First button is prev
      await user.click(prevButton);

      // Should now show May again
      expect(screen.getByText(/Month: May/i)).toBeInTheDocument();
    });

    it('should navigate to next month when clicking next button', async () => {
      const user = userEvent.setup();
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Start at May (monthIdx=0)
      expect(screen.getByText(/Month: May/i)).toBeInTheDocument();

      // Click next to go to June
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
      // Starts at month index 0 (May)
      expect(slider.value).toBe('0');
    });

    it('should disable prev button at first month', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Component starts at first month (May, index 0)
      const prevButton = screen.getAllByRole('button')[0]!;

      // Prev button should be disabled
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button at last month', async () => {
      const user = userEvent.setup();
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Component starts at monthIdx=0 (May), navigate to last month (June)
      const nextButton = screen.getAllByRole('button')[1]!;
      await user.click(nextButton);

      // Next button should now be disabled at last month
      expect(nextButton).toBeDisabled();
    });

    it('should update energy values when changing months', async () => {
      const user = userEvent.setup();
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // May (monthIdx=0) should show -884
      expect(screen.getByText('-884')).toBeInTheDocument();

      // Navigate to June (monthIdx=1)
      const nextButton = screen.getAllByRole('button')[1]!;
      await user.click(nextButton);

      // June should show -900
      expect(screen.getByText('-900')).toBeInTheDocument();
      // May value should no longer be visible
      expect(screen.queryByText('-884')).not.toBeInTheDocument();
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

  describe('Enhanced Coverage', () => {
    it('should handle single month data correctly', () => {
      const singleMonthData: BillingYearWithId = {
        id: 1,
        start_month: 5,
        start_year: 2024,
        num_months: 1,
        months: [{ month_name: 'May', year: 2024 }],
        billing_months: [mockBillingYear.billing_months[0]!], // Just May
      };

      render(<Solar data={singleMonthData} width={400} height={400} />);

      // Should render May successfully
      expect(screen.getByText(/Month: May/i)).toBeInTheDocument();

      // Both nav buttons should be disabled
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeDisabled(); // prev
      expect(buttons[1]).toBeDisabled(); // next

      // Slider should have max=0
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', '0');
    });

    it('should render month_name from month_label object correctly', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Verify month name is rendered as a string (not the object)
      expect(screen.getByText(/Month: May/i)).toBeInTheDocument();

      // Verify no object rendering error (would show "[object Object]")
      expect(screen.queryByText(/\[object Object\]/i)).not.toBeInTheDocument();
    });

    it('should format negative export values correctly', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      // Export values should be negative (with minus sign)
      // May has offPeakExport=-884 and peakExport=-114 (rounded)
      expect(screen.getByText('-884')).toBeInTheDocument();
      expect(screen.getByText('-114')).toBeInTheDocument();
    });

    it('should change month using slider', () => {
      render(<Solar data={mockBillingYear} width={400} height={400} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;

      // Start at May (index 0)
      expect(screen.getByText(/Month: May/i)).toBeInTheDocument();
      expect(slider.value).toBe('0');

      // Change slider to June (index 1)
      fireEvent.change(slider, { target: { value: '1' } });

      // Should now show June
      expect(screen.getByText(/Month: June/i)).toBeInTheDocument();
    });
  });
});
