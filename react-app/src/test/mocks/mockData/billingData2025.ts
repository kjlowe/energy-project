import type { BillingYearWithId } from '@/types/api';
import { NEM2AMeterType } from '@/types/generated/billing';

// Mock billing data for 3-month partial year (May 2025 - July 2025)
// Matches Python API structure (snake_case)
export const mockBillingYear2025 = {
  id: 3,
  start_month: 5,
  start_year: 2025,
  num_months: 3,
  months: [
    { month_name: 'May', year: 2025 },
    { month_name: 'June', year: 2025 },
    { month_name: 'July', year: 2025 },
  ],
  billing_months: [
    {
      year: 2025,
      month: 5,
      month_label: { month_name: 'May', year: 2025 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2025-05-14' },
        service_end_date: { value: '2025-05-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-125.0], value: -125.0 },
          off_peak: { subcomponent_values: [-920.0], value: -920.0 },
          total: { subcomponent_values: [-1045.0], value: -1045.0 },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [92.0], value: 92.0 },
          off_peak: { subcomponent_values: [305.0], value: 305.0 },
          total: { subcomponent_values: [397.0], value: 397.0 },
        },
        total_bill_in_mail: {
          subcomponent_values: [72.5],
          value: 72.5,
        },
      },
    },
    {
      year: 2025,
      month: 6,
      month_label: { month_name: 'June', year: 2025 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2025-06-14' },
        service_end_date: { value: '2025-06-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-145.0], value: -145.0 },
          off_peak: { subcomponent_values: [-970.0], value: -970.0 },
          total: { subcomponent_values: [-1115.0], value: -1115.0 },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [83.0], value: 83.0 },
          off_peak: { subcomponent_values: [275.0], value: 275.0 },
          total: { subcomponent_values: [358.0], value: 358.0 },
        },
        total_bill_in_mail: {
          subcomponent_values: [60.25],
          value: 60.25,
        },
      },
    },
    {
      year: 2025,
      month: 7,
      month_label: { month_name: 'July', year: 2025 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2025-07-14' },
        service_end_date: { value: '2025-07-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-165.0], value: -165.0 },
          off_peak: { subcomponent_values: [-1020.0], value: -1020.0 },
          total: { subcomponent_values: [-1185.0], value: -1185.0 },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [72.0], value: 72.0 },
          off_peak: { subcomponent_values: [255.0], value: 255.0 },
          total: { subcomponent_values: [327.0], value: 327.0 },
        },
        total_bill_in_mail: {
          subcomponent_values: [47.75],
          value: 47.75,
        },
      },
    },
  ],
} as any as BillingYearWithId;
