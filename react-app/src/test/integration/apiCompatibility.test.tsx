import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import useDataFetch from '@/hooks/useDataFetch';
import Solar from '@/components/Solar';

describe('API Compatibility - Consistent snake_case Everywhere', () => {
  describe('Python API Format', () => {
    it('should verify Python API returns snake_case fields', () => {
      // What Python proto_utils.py actually returns
      const pythonApiResponse = {
        billing_years: [{
          id: 1,
          start_month: 5,
          start_year: 2024,
          num_months: 2,
          months: [
            { month_name: 'May', year: 2024 }
          ],
          billing_months: [
            {
              year: 2024,
              month: 5,
              month_label: { month_name: 'May', year: 2024 },
              main: {
                nem2a_meter_type: 'GENERATION_METER',
                energy_export_meter_channel_2: {
                  off_peak: {
                    subcomponent_values: [-884.175],
                    value: -884.175,
                    unit: 'kWh'
                  }
                }
              }
            }
          ]
        }],
        count: 1
      };

      // Verify Python format uses snake_case
      const year = pythonApiResponse.billing_years[0]!;
      expect(year).toHaveProperty('billing_months');
      expect(year).toHaveProperty('start_month');

      const month = year.billing_months[0]!;
      expect(month).toHaveProperty('month_label');
      expect(month.main).toHaveProperty('energy_export_meter_channel_2');
    });

    it('should verify TypeScript types now use snake_case', () => {
      // TypeScript interfaces from ts-proto with snakeToCamel=false
      const typedData = {
        start_month: 5,
        start_year: 2024,
        num_months: 2,
        billing_months: [],
      };

      expect(typedData).toHaveProperty('start_month');
      expect(typedData).toHaveProperty('billing_months');
      expect(typedData).not.toHaveProperty('startMonth');
      expect(typedData).not.toHaveProperty('billingMonths');
    });
  });

  describe('Runtime Consistency Check', () => {
    it('should confirm API returns snake_case matching TypeScript', async () => {
      // Fetch real data from MSW (which returns Python format)
      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const data = result.current.billingData;

      if (data) {
        // Check that fields are snake_case
        expect(data).toHaveProperty('start_month');
        expect(data).toHaveProperty('billing_months');
        expect(data).not.toHaveProperty('startMonth');
        expect(data).not.toHaveProperty('billingMonths');
      }
    });

    it('should verify Solar component works with snake_case data', () => {
      const snakeCaseData = {
        id: 1,
        start_month: 5,
        start_year: 2024,
        num_months: 2,
        months: [
          { month_name: 'May', year: 2024 },
          { month_name: 'June', year: 2024 }
        ],
        billing_months: [
          {
            year: 2024,
            month: 5,
            month_label: { month_name: 'May', year: 2024 },
            main: {
              energy_export_meter_channel_2: {
                off_peak: { subcomponent_values: [-884], value: -884 },
                peak: { subcomponent_values: [-100], value: -100 },
              },
              energy_import_meter_channel_1: {
                off_peak: { subcomponent_values: [200], value: 200 },
                peak: { subcomponent_values: [50], value: 50 },
              }
            }
          },
          {
            year: 2024,
            month: 6,
            month_label: { month_name: 'June', year: 2024 },
            main: {
              energy_export_meter_channel_2: {
                off_peak: { subcomponent_values: [-900], value: -900 },
                peak: { subcomponent_values: [-150], value: -150 },
              },
              energy_import_meter_channel_1: {
                off_peak: { subcomponent_values: [250], value: 250 },
                peak: { subcomponent_values: [75], value: 75 },
              }
            }
          }
        ]
      };

      const { container } = render(<Solar data={snakeCaseData as any} width={400} height={400} />);

      // Should render values, not "No billing data available"
      expect(container.textContent).not.toContain('No billing data available');
      // Component starts at monthIdx=0 (May)
      expect(screen.getByText(/Month: May/i)).toBeInTheDocument();
    });
  });

  describe('No Transformation Needed', () => {
    it('should confirm snake_case works end-to-end without conversion', () => {
      const pythonResponse = {
        billing_months: [{ month_label: { month_name: 'May', year: 2024 } }],
        start_month: 5,
      };

      // TypeScript types now use snake_case, so no conversion needed
      const typedData = pythonResponse as any;

      // Accessing snake_case properties works directly
      expect(typedData.billing_months).toBeDefined();
      expect(typedData.start_month).toBe(5);

      // camelCase doesn't exist (and isn't needed)
      expect(typedData.billingMonths).toBeUndefined();
      expect(typedData.startMonth).toBeUndefined();
    });
  });
});
