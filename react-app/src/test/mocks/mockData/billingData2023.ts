import type { BillingYearWithId } from '@/types/api';
import { NEM2AMeterType } from '@/types/generated/billing';

// Mock billing data for full 12-month year (May 2023 - April 2024)
// Matches Python API structure (snake_case)
export const mockBillingYear2023 = {
  id: 2,
  start_month: 5,
  start_year: 2023,
  num_months: 12,
  months: [
    { month_name: 'May', year: 2023 },
    { month_name: 'June', year: 2023 },
    { month_name: 'July', year: 2023 },
    { month_name: 'August', year: 2023 },
    { month_name: 'September', year: 2023 },
    { month_name: 'October', year: 2023 },
    { month_name: 'November', year: 2023 },
    { month_name: 'December', year: 2023 },
    { month_name: 'January', year: 2024 },
    { month_name: 'February', year: 2024 },
    { month_name: 'March', year: 2024 },
    { month_name: 'April', year: 2024 },
  ],
  billing_months: [
    {
      year: 2023,
      month: 5,
      month_label: { month_name: 'May', year: 2023 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2023-05-14' },
        service_end_date: { value: '2023-05-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-120.0], value: -120.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [-900.0], value: -900.0, unit: 'kWh' },
          total: { subcomponent_values: [-1020.0], value: -1020.0, unit: 'kWh' },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [90.0], value: 90.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [300.0], value: 300.0, unit: 'kWh' },
          total: { subcomponent_values: [390.0], value: 390.0, unit: 'kWh' },
        },
        total_bill_in_mail: {
          subcomponent_values: [70.0],
          value: 70.0,
          unit: '$',
        },
      },
    },
    {
      year: 2023,
      month: 6,
      month_label: { month_name: 'June', year: 2023 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2023-06-14' },
        service_end_date: { value: '2023-06-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-140.0], value: -140.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [-950.0], value: -950.0, unit: 'kWh' },
          total: { subcomponent_values: [-1090.0], value: -1090.0, unit: 'kWh' },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [80.0], value: 80.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [270.0], value: 270.0, unit: 'kWh' },
          total: { subcomponent_values: [350.0], value: 350.0, unit: 'kWh' },
        },
        total_bill_in_mail: {
          subcomponent_values: [58.0],
          value: 58.0,
          unit: '$',
        },
      },
    },
    {
      year: 2023,
      month: 7,
      month_label: { month_name: 'July', year: 2023 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2023-07-14' },
        service_end_date: { value: '2023-07-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-160.0], value: -160.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [-1000.0], value: -1000.0, unit: 'kWh' },
          total: { subcomponent_values: [-1160.0], value: -1160.0, unit: 'kWh' },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [70.0], value: 70.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [250.0], value: 250.0, unit: 'kWh' },
          total: { subcomponent_values: [320.0], value: 320.0, unit: 'kWh' },
        },
        total_bill_in_mail: {
          subcomponent_values: [45.0],
          value: 45.0,
          unit: '$',
        },
      },
    },
    {
      year: 2023,
      month: 8,
      month_label: { month_name: 'August', year: 2023 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2023-08-14' },
        service_end_date: { value: '2023-08-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-155.0], value: -155.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [-980.0], value: -980.0, unit: 'kWh' },
          total: { subcomponent_values: [-1135.0], value: -1135.0, unit: 'kWh' },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [75.0], value: 75.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [260.0], value: 260.0, unit: 'kWh' },
          total: { subcomponent_values: [335.0], value: 335.0, unit: 'kWh' },
        },
        total_bill_in_mail: {
          subcomponent_values: [48.0],
          value: 48.0,
          unit: '$',
        },
      },
    },
    {
      year: 2023,
      month: 9,
      month_label: { month_name: 'September', year: 2023 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2023-09-14' },
        service_end_date: { value: '2023-09-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-130.0], value: -130.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [-870.0], value: -870.0, unit: 'kWh' },
          total: { subcomponent_values: [-1000.0], value: -1000.0, unit: 'kWh' },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [85.0], value: 85.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [280.0], value: 280.0, unit: 'kWh' },
          total: { subcomponent_values: [365.0], value: 365.0, unit: 'kWh' },
        },
        total_bill_in_mail: {
          subcomponent_values: [62.0],
          value: 62.0,
          unit: '$',
        },
      },
    },
    {
      year: 2023,
      month: 10,
      month_label: { month_name: 'October', year: 2023 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2023-10-14' },
        service_end_date: { value: '2023-10-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-105.0], value: -105.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [-780.0], value: -780.0, unit: 'kWh' },
          total: { subcomponent_values: [-885.0], value: -885.0, unit: 'kWh' },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [95.0], value: 95.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [310.0], value: 310.0, unit: 'kWh' },
          total: { subcomponent_values: [405.0], value: 405.0, unit: 'kWh' },
        },
        total_bill_in_mail: {
          subcomponent_values: [75.0],
          value: 75.0,
          unit: '$',
        },
      },
    },
    {
      year: 2023,
      month: 11,
      month_label: { month_name: 'November', year: 2023 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2023-11-14' },
        service_end_date: { value: '2023-11-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-85.0], value: -85.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [-650.0], value: -650.0, unit: 'kWh' },
          total: { subcomponent_values: [-735.0], value: -735.0, unit: 'kWh' },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [110.0], value: 110.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [350.0], value: 350.0, unit: 'kWh' },
          total: { subcomponent_values: [460.0], value: 460.0, unit: 'kWh' },
        },
        total_bill_in_mail: {
          subcomponent_values: [92.0],
          value: 92.0,
          unit: '$',
        },
      },
    },
    {
      year: 2023,
      month: 12,
      month_label: { month_name: 'December', year: 2023 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2023-12-14' },
        service_end_date: { value: '2023-12-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-75.0], value: -75.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [-580.0], value: -580.0, unit: 'kWh' },
          total: { subcomponent_values: [-655.0], value: -655.0, unit: 'kWh' },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [120.0], value: 120.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [380.0], value: 380.0, unit: 'kWh' },
          total: { subcomponent_values: [500.0], value: 500.0, unit: 'kWh' },
        },
        total_bill_in_mail: {
          subcomponent_values: [105.0],
          value: 105.0,
          unit: '$',
        },
      },
    },
    {
      year: 2024,
      month: 1,
      month_label: { month_name: 'January', year: 2024 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2024-01-14' },
        service_end_date: { value: '2024-01-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-70.0], value: -70.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [-550.0], value: -550.0, unit: 'kWh' },
          total: { subcomponent_values: [-620.0], value: -620.0, unit: 'kWh' },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [125.0], value: 125.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [400.0], value: 400.0, unit: 'kWh' },
          total: { subcomponent_values: [525.0], value: 525.0, unit: 'kWh' },
        },
        total_bill_in_mail: {
          subcomponent_values: [112.0],
          value: 112.0,
          unit: '$',
        },
      },
    },
    {
      year: 2024,
      month: 2,
      month_label: { month_name: 'February', year: 2024 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2024-02-14' },
        service_end_date: { value: '2024-02-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-80.0], value: -80.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [-620.0], value: -620.0, unit: 'kWh' },
          total: { subcomponent_values: [-700.0], value: -700.0, unit: 'kWh' },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [105.0], value: 105.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [340.0], value: 340.0, unit: 'kWh' },
          total: { subcomponent_values: [445.0], value: 445.0, unit: 'kWh' },
        },
        total_bill_in_mail: {
          subcomponent_values: [98.0],
          value: 98.0,
          unit: '$',
        },
      },
    },
    {
      year: 2024,
      month: 3,
      month_label: { month_name: 'March', year: 2024 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2024-03-14' },
        service_end_date: { value: '2024-03-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-100.0], value: -100.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [-750.0], value: -750.0, unit: 'kWh' },
          total: { subcomponent_values: [-850.0], value: -850.0, unit: 'kWh' },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [92.0], value: 92.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [305.0], value: 305.0, unit: 'kWh' },
          total: { subcomponent_values: [397.0], value: 397.0, unit: 'kWh' },
        },
        total_bill_in_mail: {
          subcomponent_values: [80.0],
          value: 80.0,
          unit: '$',
        },
      },
    },
    {
      year: 2024,
      month: 4,
      month_label: { month_name: 'April', year: 2024 },
      main: {
        nem2a_meter_type: NEM2AMeterType.GENERATION_METER,
        billing_date: { value: '2024-04-14' },
        service_end_date: { value: '2024-04-07' },
        energy_export_meter_channel_2: {
          peak: { subcomponent_values: [-110.0], value: -110.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [-820.0], value: -820.0, unit: 'kWh' },
          total: { subcomponent_values: [-930.0], value: -930.0, unit: 'kWh' },
        },
        energy_import_meter_channel_1: {
          peak: { subcomponent_values: [87.0], value: 87.0, unit: 'kWh' },
          off_peak: { subcomponent_values: [295.0], value: 295.0, unit: 'kWh' },
          total: { subcomponent_values: [382.0], value: 382.0, unit: 'kWh' },
        },
        total_bill_in_mail: {
          subcomponent_values: [72.0],
          value: 72.0,
          unit: '$',
        },
      },
    },
  ],
} as any as BillingYearWithId;
