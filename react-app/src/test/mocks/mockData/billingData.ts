import type { BillingYearWithId } from '@/types/api';
import { NEM2AMeterType } from '@/types/generated/billing';

// Mock billing data matching Python API structure (snake_case)
// Note: Python adds 'value' field at runtime (sum of subcomponent_values), which isn't in the proto schema
// Using 'as any' to allow runtime 'value' field added by Python
export const mockBillingYear = {
  id: 1,
  start_month: 5,
  start_year: 2024,
  num_months: 2,
  months: [
    { month_name: 'May', year: 2024 },
    { month_name: 'June', year: 2024 },
  ],
  billing_months: [
    {
      year: 2024,
      month: 5,
      month_label: { month_name: 'May', year: 2024 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2024-05-14' },
        service_end_date: { value: '2024-05-07' },
        energy_export_meter_channel_2: {
          peak: {
            subcomponent_values: [-113.825],
            value: -113.825,
          },
          off_peak: {
            subcomponent_values: [-884.175],
            value: -884.175,
          },
          total: {
            subcomponent_values: [-998.0],
            value: -998.0,
          },
        },
        energy_import_meter_channel_1: {
          peak: {
            subcomponent_values: [88.0],
            value: 88.0,
          },
          off_peak: {
            subcomponent_values: [294.0],
            value: 294.0,
          },
          total: {
            subcomponent_values: [382.0],
            value: 382.0,
          },
        },
        total_bill_in_mail: {
          subcomponent_values: [67.83],
          value: 67.83,
        },
      },
      adu: {
        nem2a_meter_type: NEM2AMeterType.BENEFIT_METER,
        billing_date: { value: '2024-05-14' },
        service_end_date: { value: '2024-05-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [0.0], value: 0.0 },
          off_peak: { subcomponent_values: [0.0], value: 0.0 },
          total: { subcomponent_values: [0.0], value: 0.0 },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [25.0], value: 25.0 },
          off_peak: { subcomponent_values: [100.0], value: 100.0 },
          total: { subcomponent_values: [125.0], value: 125.0 },
        },
        total_bill_in_mail: {
          subcomponent_values: [15.50],
          value: 15.50,
        },
      },
    },
    {
      year: 2024,
      month: 6,
      month_label: { month_name: 'June', year: 2024 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2024-06-14' },
        service_end_date: { value: '2024-06-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-150.0], value: -150.0 },
          off_peak: { subcomponent_values: [-900.0], value: -900.0 },
          total: { subcomponent_values: [-1050.0], value: -1050.0 },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [75.0], value: 75.0 },
          off_peak: { subcomponent_values: [250.0], value: 250.0 },
          total: { subcomponent_values: [325.0], value: 325.0 },
        },
        total_bill_in_mail: {
          subcomponent_values: [55.25],
          value: 55.25,
        },
      },
      adu: {
        nem2a_meter_type: NEM2AMeterType.BENEFIT_METER,
        billing_date: { value: '2024-06-14' },
        service_end_date: { value: '2024-06-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [0.0], value: 0.0 },
          off_peak: { subcomponent_values: [0.0], value: 0.0 },
          total: { subcomponent_values: [0.0], value: 0.0 },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [30.0], value: 30.0 },
          off_peak: { subcomponent_values: [110.0], value: 110.0 },
          total: { subcomponent_values: [140.0], value: 140.0 },
        },
        total_bill_in_mail: {
          subcomponent_values: [18.75],
          value: 18.75,
        },
      },
    },
  ],
} as any as BillingYearWithId;

// Keep snake_case version for MSW handlers (matching raw Python API)
export const mockBillingYearSnakeCase = mockBillingYear;
