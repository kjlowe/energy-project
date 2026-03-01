import type { NEM2AAggregationBillingMonth, EnergyMetric, EnergyMetricTOU } from '@/types/generated/billing';

/**
 * Extended EnergyMetric type that includes runtime-added fields from Python backend
 */
export interface EnergyMetricWithValue extends EnergyMetric {
  value: number;
}

/**
 * Column configuration for Excel-style table rendering
 */
export interface ColumnConfig {
  /** Unique column identifier */
  id: string;

  /** Multi-level headers */
  headers: {
    /** Level 1: Unit identifier (main, adu) */
    unit?: string;
    /** Level 2: Category grouping (API field name) */
    category?: string;
    /** Level 3: Metric name (API field name) */
    subheader: string;
  };

  /** Data accessor function - returns full object with value and subcomponent_values */
  accessor: (billingMonth: NEM2AAggregationBillingMonth) => EnergyMetricWithValue | { value: string } | null;

  /** Formatting type */
  format?: 'number' | 'currency' | 'date' | 'percentage';

  /** Number of decimal places */
  decimals?: number;

  /** Visual grouping for styling */
  group: 'dates' | 'energy_export' | 'energy_import' | 'allocation' | 'allocated_credits' | 'net_energy' | 'pce' | 'pge' | 'totals';

  /** Metadata lookup information for header rows */
  metadata?: {
    /** Field name in MeterMetadata (e.g., 'energy_export_meter_channel_2') */
    fieldName: string;
    /** For TOU fields, which component (peak, off_peak, total) */
    touComponent?: 'peak' | 'off_peak' | 'total';
  };
}

/**
 * Table configuration with columns for both units
 */
export interface TableConfig {
  main: ColumnConfig[];
  adu: ColumnConfig[];
}

/**
 * Main unit column definitions
 */
export const mainColumns: ColumnConfig[] = [
  // Dates
  {
    id: 'main_service_end_date',
    headers: {
      unit: 'main',
      category: 'dates',
      subheader: 'service_end_date',
    },
    accessor: (month) => month.main?.service_end_date ? { value: month.main.service_end_date.value } : null,
    format: 'text',
    group: 'dates',
    metadata: {
      fieldName: 'service_end_date',
    },
  },
  {
    id: 'main_billing_date',
    headers: {
      unit: 'main',
      category: 'dates',
      subheader: 'billing_date',
    },
    accessor: (month) => month.main?.billing_date ? { value: month.main.billing_date.value } : null,
    format: 'text',
    group: 'dates',
    metadata: {
      fieldName: 'billing_date',
    },
  },

  // energy_export_meter_channel_2
  {
    id: 'main_export_off_peak',
    headers: {
      unit: 'main',
      category: 'energy_export_meter_channel_2',
      subheader: 'off_peak',
    },
    accessor: (month) => month.main?.energy_export_meter_channel_2?.off_peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'energy_export',
    metadata: {
      fieldName: 'energy_export_meter_channel_2',
      touComponent: 'off_peak',
    },
  },
  {
    id: 'main_export_peak',
    headers: {
      unit: 'main',
      category: 'energy_export_meter_channel_2',
      subheader: 'peak',
    },
    accessor: (month) => month.main?.energy_export_meter_channel_2?.peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'energy_export',
    metadata: {
      fieldName: 'energy_export_meter_channel_2',
      touComponent: 'peak',
    },
  },
  {
    id: 'main_export_total',
    headers: {
      unit: 'main',
      category: 'energy_export_meter_channel_2',
      subheader: 'total',
    },
    accessor: (month) => month.main?.energy_export_meter_channel_2?.total as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'energy_export',
    metadata: {
      fieldName: 'energy_export_meter_channel_2',
      touComponent: 'total',
    },
  },

  // energy_import_meter_channel_1
  {
    id: 'main_import_off_peak',
    headers: {
      unit: 'main',
      category: 'energy_import_meter_channel_1',
      subheader: 'off_peak',
    },
    accessor: (month) => month.main?.energy_import_meter_channel_1?.off_peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'energy_import',
    metadata: {
      fieldName: 'energy_import_meter_channel_1',
      touComponent: 'off_peak',
    },
  },
  {
    id: 'main_import_peak',
    headers: {
      unit: 'main',
      category: 'energy_import_meter_channel_1',
      subheader: 'peak',
    },
    accessor: (month) => month.main?.energy_import_meter_channel_1?.peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'energy_import',
    metadata: {
      fieldName: 'energy_import_meter_channel_1',
      touComponent: 'peak',
    },
  },
  {
    id: 'main_import_total',
    headers: {
      unit: 'main',
      category: 'energy_import_meter_channel_1',
      subheader: 'total',
    },
    accessor: (month) => month.main?.energy_import_meter_channel_1?.total as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'energy_import',
    metadata: {
      fieldName: 'energy_import_meter_channel_1',
      touComponent: 'total',
    },
  },

  // allocation
  {
    id: 'main_allocation_import_percentage',
    headers: {
      unit: 'main',
      category: 'allocation',
      subheader: 'import %',
    },
    accessor: (month) => month.main?.allocation_import_percentage as EnergyMetricWithValue | null ?? null,
    format: 'percentage',
    decimals: 2,
    group: 'allocation',
    metadata: {
      fieldName: 'allocation_import_percentage',
    },
  },
  {
    id: 'main_allocation_credits_percentage',
    headers: {
      unit: 'main',
      category: 'allocation',
      subheader: 'credits %',
    },
    accessor: (month) => month.main?.allocation_credits_percentage as EnergyMetricWithValue | null ?? null,
    format: 'percentage',
    decimals: 2,
    group: 'allocation',
    metadata: {
      fieldName: 'allocation_credits_percentage',
    },
  },
  {
    id: 'main_allocation_cumulative_energy',
    headers: {
      unit: 'main',
      category: 'allocation',
      subheader: 'cumulative kWh',
    },
    accessor: (month) => month.main?.allocation_cumulative_energy as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'allocation',
    metadata: {
      fieldName: 'allocation_cumulative_energy',
    },
  },
  {
    id: 'main_allocation_cumulative_percentage',
    headers: {
      unit: 'main',
      category: 'allocation',
      subheader: 'cumulative %',
    },
    accessor: (month) => month.main?.allocation_cumulative_percentage as EnergyMetricWithValue | null ?? null,
    format: 'percentage',
    decimals: 2,
    group: 'allocation',
    metadata: {
      fieldName: 'allocation_cumulative_percentage',
    },
  },

  // allocated_export_energy_credits
  {
    id: 'main_allocated_off_peak',
    headers: {
      unit: 'main',
      category: 'allocated_export_energy_credits',
      subheader: 'off_peak',
    },
    accessor: (month) => month.main?.allocated_export_energy_credits?.off_peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'allocated_credits',
    metadata: {
      fieldName: 'allocated_export_energy_credits',
      touComponent: 'off_peak',
    },
  },
  {
    id: 'main_allocated_peak',
    headers: {
      unit: 'main',
      category: 'allocated_export_energy_credits',
      subheader: 'peak',
    },
    accessor: (month) => month.main?.allocated_export_energy_credits?.peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'allocated_credits',
    metadata: {
      fieldName: 'allocated_export_energy_credits',
      touComponent: 'peak',
    },
  },
  {
    id: 'main_allocated_total',
    headers: {
      unit: 'main',
      category: 'allocated_export_energy_credits',
      subheader: 'total',
    },
    accessor: (month) => month.main?.allocated_export_energy_credits?.total as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'allocated_credits',
    metadata: {
      fieldName: 'allocated_export_energy_credits',
      touComponent: 'total',
    },
  },

  // net_energy_usage_after_credits
  {
    id: 'main_net_off_peak',
    headers: {
      unit: 'main',
      category: 'net_energy_usage_after_credits',
      subheader: 'off_peak',
    },
    accessor: (month) => month.main?.net_energy_usage_after_credits?.off_peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'net_energy',
    metadata: {
      fieldName: 'net_energy_usage_after_credits',
      touComponent: 'off_peak',
    },
  },
  {
    id: 'main_net_peak',
    headers: {
      unit: 'main',
      category: 'net_energy_usage_after_credits',
      subheader: 'peak',
    },
    accessor: (month) => month.main?.net_energy_usage_after_credits?.peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'net_energy',
    metadata: {
      fieldName: 'net_energy_usage_after_credits',
      touComponent: 'peak',
    },
  },
  {
    id: 'main_net_total',
    headers: {
      unit: 'main',
      category: 'net_energy_usage_after_credits',
      subheader: 'total',
    },
    accessor: (month) => month.main?.net_energy_usage_after_credits?.total as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'net_energy',
    metadata: {
      fieldName: 'net_energy_usage_after_credits',
      touComponent: 'total',
    },
  },

  // pce_energy_cost (TOU)
  {
    id: 'main_pce_cost_off_peak',
    headers: {
      unit: 'main',
      category: 'pce_energy_cost',
      subheader: 'off_peak',
    },
    accessor: (month) => month.main?.pce_energy_cost?.off_peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_energy_cost',
      touComponent: 'off_peak',
    },
  },
  {
    id: 'main_pce_cost_peak',
    headers: {
      unit: 'main',
      category: 'pce_energy_cost',
      subheader: 'peak',
    },
    accessor: (month) => month.main?.pce_energy_cost?.peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_energy_cost',
      touComponent: 'peak',
    },
  },
  {
    id: 'main_pce_cost_total',
    headers: {
      unit: 'main',
      category: 'pce_energy_cost',
      subheader: 'total',
    },
    accessor: (month) => month.main?.pce_energy_cost?.total as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_energy_cost',
      touComponent: 'total',
    },
  },

  // pce_energy_rates (TOU) - $/kWh rates
  {
    id: 'main_pce_rates_off_peak',
    headers: {
      unit: 'main',
      category: 'pce_energy_rates',
      subheader: 'off_peak',
    },
    accessor: (month) => month.main?.pce_energy_rates?.off_peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 4,  // 4 decimals for $/kWh precision (e.g., 0.2174)
    group: 'pce',
    metadata: {
      fieldName: 'pce_energy_rates',
      touComponent: 'off_peak',
    },
  },
  {
    id: 'main_pce_rates_peak',
    headers: {
      unit: 'main',
      category: 'pce_energy_rates',
      subheader: 'peak',
    },
    accessor: (month) => month.main?.pce_energy_rates?.peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 4,  // 4 decimals for $/kWh precision
    group: 'pce',
    metadata: {
      fieldName: 'pce_energy_rates',
      touComponent: 'peak',
    },
  },

  // PCE single-value columns
  {
    id: 'main_pce_net_generation_bonus',
    headers: {
      unit: 'main',
      category: 'pce',
      subheader: 'pce_net_generation_bonus',
    },
    accessor: (month) => month.main?.pce_net_generation_bonus as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_net_generation_bonus',
    },
  },
  {
    id: 'main_pce_energy_commission_surcharge',
    headers: {
      unit: 'main',
      category: 'pce',
      subheader: 'pce_energy_commission_surcharge',
    },
    accessor: (month) => month.main?.pce_energy_commission_surcharge as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_energy_commission_surcharge',
    },
  },
  {
    id: 'main_pce_total_energy_charges',
    headers: {
      unit: 'main',
      category: 'pce',
      subheader: 'pce_total_energy_charges',
    },
    accessor: (month) => month.main?.pce_total_energy_charges as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_total_energy_charges',
    },
  },
  {
    id: 'main_pce_nem_credit',
    headers: {
      unit: 'main',
      category: 'pce',
      subheader: 'pce_nem_credit',
    },
    accessor: (month) => month.main?.pce_nem_credit as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_nem_credit',
    },
  },
  {
    id: 'main_pce_generation_charges_due_cash',
    headers: {
      unit: 'main',
      category: 'pce',
      subheader: 'pce_generation_charges_due_cash',
    },
    accessor: (month) => month.main?.pce_generation_charges_due_cash as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_generation_charges_due_cash',
    },
  },

  // PG&E columns
  {
    id: 'main_pge_res_energy_charges',
    headers: {
      unit: 'main',
      category: 'pge',
      subheader: 'pge_res_energy_charges',
    },
    accessor: (month) => month.main?.pge_res_energy_charges as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_res_energy_charges',
    },
  },
  {
    id: 'main_pge_baseline_credit',
    headers: {
      unit: 'main',
      category: 'pge',
      subheader: 'pge_baseline_credit',
    },
    accessor: (month) => month.main?.pge_baseline_credit as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_baseline_credit',
    },
  },
  {
    id: 'main_pge_da_cca_charges',
    headers: {
      unit: 'main',
      category: 'pge',
      subheader: 'pge_da_cca_charges',
    },
    accessor: (month) => month.main?.pge_da_cca_charges as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_da_cca_charges',
    },
  },
  {
    id: 'main_pge_total_energy_charges',
    headers: {
      unit: 'main',
      category: 'pge',
      subheader: 'pge_total_energy_charges',
    },
    accessor: (month) => month.main?.pge_total_energy_charges as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_total_energy_charges',
    },
  },
  {
    id: 'main_pge_nem_billing',
    headers: {
      unit: 'main',
      category: 'pge',
      subheader: 'pge_nem_billing',
    },
    accessor: (month) => month.main?.pge_nem_billing as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_nem_billing',
    },
  },
  {
    id: 'main_pge_minimum_delivery_charge',
    headers: {
      unit: 'main',
      category: 'pge',
      subheader: 'pge_minimum_delivery_charge',
    },
    accessor: (month) => month.main?.pge_minimum_delivery_charge as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_minimum_delivery_charge',
    },
  },
  {
    id: 'main_pge_nem_true_up_adjustment',
    headers: {
      unit: 'main',
      category: 'pge',
      subheader: 'pge_nem_true_up_adjustment',
    },
    accessor: (month) => month.main?.pge_nem_true_up_adjustment as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_nem_true_up_adjustment',
    },
  },
  {
    id: 'main_pge_electric_delivery_charges',
    headers: {
      unit: 'main',
      category: 'pge',
      subheader: 'pge_electric_delivery_charges',
    },
    accessor: (month) => month.main?.pge_electric_delivery_charges as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_electric_delivery_charges',
    },
  },

  // Totals
  {
    id: 'main_california_climate_credit',
    headers: {
      unit: 'main',
      category: 'totals',
      subheader: 'california_climate_credit',
    },
    accessor: (month) => month.main?.california_climate_credit as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'totals',
    metadata: {
      fieldName: 'california_climate_credit',
    },
  },
  {
    id: 'main_total_bill_in_mail',
    headers: {
      unit: 'main',
      category: 'totals',
      subheader: 'total_bill_in_mail',
    },
    accessor: (month) => month.main?.total_bill_in_mail as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'totals',
    metadata: {
      fieldName: 'total_bill_in_mail',
    },
  },
];

/**
 * ADU unit column definitions (same structure as main, but accessing adu field)
 */
export const aduColumns: ColumnConfig[] = [
  // Dates
  {
    id: 'adu_service_end_date',
    headers: {
      unit: 'adu',
      category: 'dates',
      subheader: 'service_end_date',
    },
    accessor: (month) => month.adu?.service_end_date ? { value: month.adu.service_end_date.value } : null,
    format: 'text',
    group: 'dates',
    metadata: {
      fieldName: 'service_end_date',
    },
  },
  {
    id: 'adu_billing_date',
    headers: {
      unit: 'adu',
      category: 'dates',
      subheader: 'billing_date',
    },
    accessor: (month) => month.adu?.billing_date ? { value: month.adu.billing_date.value } : null,
    format: 'text',
    group: 'dates',
    metadata: {
      fieldName: 'billing_date',
    },
  },

  // energy_export_meter_channel_2
  {
    id: 'adu_export_off_peak',
    headers: {
      unit: 'adu',
      category: 'energy_export_meter_channel_2',
      subheader: 'off_peak',
    },
    accessor: (month) => month.adu?.energy_export_meter_channel_2?.off_peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'energy_export',
    metadata: {
      fieldName: 'energy_export_meter_channel_2',
      touComponent: 'off_peak',
    },
  },
  {
    id: 'adu_export_peak',
    headers: {
      unit: 'adu',
      category: 'energy_export_meter_channel_2',
      subheader: 'peak',
    },
    accessor: (month) => month.adu?.energy_export_meter_channel_2?.peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'energy_export',
    metadata: {
      fieldName: 'energy_export_meter_channel_2',
      touComponent: 'peak',
    },
  },
  {
    id: 'adu_export_total',
    headers: {
      unit: 'adu',
      category: 'energy_export_meter_channel_2',
      subheader: 'total',
    },
    accessor: (month) => month.adu?.energy_export_meter_channel_2?.total as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'energy_export',
    metadata: {
      fieldName: 'energy_export_meter_channel_2',
      touComponent: 'total',
    },
  },

  // energy_import_meter_channel_1
  {
    id: 'adu_import_off_peak',
    headers: {
      unit: 'adu',
      category: 'energy_import_meter_channel_1',
      subheader: 'off_peak',
    },
    accessor: (month) => month.adu?.energy_import_meter_channel_1?.off_peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'energy_import',
    metadata: {
      fieldName: 'energy_import_meter_channel_1',
      touComponent: 'off_peak',
    },
  },
  {
    id: 'adu_import_peak',
    headers: {
      unit: 'adu',
      category: 'energy_import_meter_channel_1',
      subheader: 'peak',
    },
    accessor: (month) => month.adu?.energy_import_meter_channel_1?.peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'energy_import',
    metadata: {
      fieldName: 'energy_import_meter_channel_1',
      touComponent: 'peak',
    },
  },
  {
    id: 'adu_import_total',
    headers: {
      unit: 'adu',
      category: 'energy_import_meter_channel_1',
      subheader: 'total',
    },
    accessor: (month) => month.adu?.energy_import_meter_channel_1?.total as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'energy_import',
    metadata: {
      fieldName: 'energy_import_meter_channel_1',
      touComponent: 'total',
    },
  },

  // allocation
  {
    id: 'adu_allocation_import_percentage',
    headers: {
      unit: 'adu',
      category: 'allocation',
      subheader: 'import %',
    },
    accessor: (month) => month.adu?.allocation_import_percentage as EnergyMetricWithValue | null ?? null,
    format: 'percentage',
    decimals: 2,
    group: 'allocation',
    metadata: {
      fieldName: 'allocation_import_percentage',
    },
  },
  {
    id: 'adu_benefit_allocation_credits_percentage',
    headers: {
      unit: 'adu',
      category: 'allocation',
      subheader: 'credits %',
    },
    accessor: (month) => month.adu?.allocation_credits_percentage as EnergyMetricWithValue | null ?? null,
    format: 'percentage',
    decimals: 2,
    group: 'allocation',
    metadata: {
      fieldName: 'allocation_credits_percentage',
    },
  },
  {
    id: 'adu_allocation_cumulative_energy',
    headers: {
      unit: 'adu',
      category: 'allocation',
      subheader: 'cumulative kWh',
    },
    accessor: (month) => month.adu?.allocation_cumulative_energy as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'allocation',
    metadata: {
      fieldName: 'allocation_cumulative_energy',
    },
  },
  {
    id: 'adu_allocation_cumulative_percentage',
    headers: {
      unit: 'adu',
      category: 'allocation',
      subheader: 'cumulative %',
    },
    accessor: (month) => month.adu?.allocation_cumulative_percentage as EnergyMetricWithValue | null ?? null,
    format: 'percentage',
    decimals: 2,
    group: 'allocation',
    metadata: {
      fieldName: 'allocation_cumulative_percentage',
    },
  },

  // allocated_export_energy_credits
  {
    id: 'adu_allocated_off_peak',
    headers: {
      unit: 'adu',
      category: 'allocated_export_energy_credits',
      subheader: 'off_peak',
    },
    accessor: (month) => month.adu?.allocated_export_energy_credits?.off_peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'allocated_credits',
    metadata: {
      fieldName: 'allocated_export_energy_credits',
      touComponent: 'off_peak',
    },
  },
  {
    id: 'adu_allocated_peak',
    headers: {
      unit: 'adu',
      category: 'allocated_export_energy_credits',
      subheader: 'peak',
    },
    accessor: (month) => month.adu?.allocated_export_energy_credits?.peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'allocated_credits',
    metadata: {
      fieldName: 'allocated_export_energy_credits',
      touComponent: 'peak',
    },
  },
  {
    id: 'adu_allocated_total',
    headers: {
      unit: 'adu',
      category: 'allocated_export_energy_credits',
      subheader: 'total',
    },
    accessor: (month) => month.adu?.allocated_export_energy_credits?.total as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'allocated_credits',
    metadata: {
      fieldName: 'allocated_export_energy_credits',
      touComponent: 'total',
    },
  },

  // net_energy_usage_after_credits
  {
    id: 'adu_net_off_peak',
    headers: {
      unit: 'adu',
      category: 'net_energy_usage_after_credits',
      subheader: 'off_peak',
    },
    accessor: (month) => month.adu?.net_energy_usage_after_credits?.off_peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'net_energy',
    metadata: {
      fieldName: 'net_energy_usage_after_credits',
      touComponent: 'off_peak',
    },
  },
  {
    id: 'adu_net_peak',
    headers: {
      unit: 'adu',
      category: 'net_energy_usage_after_credits',
      subheader: 'peak',
    },
    accessor: (month) => month.adu?.net_energy_usage_after_credits?.peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'net_energy',
    metadata: {
      fieldName: 'net_energy_usage_after_credits',
      touComponent: 'peak',
    },
  },
  {
    id: 'adu_net_total',
    headers: {
      unit: 'adu',
      category: 'net_energy_usage_after_credits',
      subheader: 'total',
    },
    accessor: (month) => month.adu?.net_energy_usage_after_credits?.total as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'net_energy',
    metadata: {
      fieldName: 'net_energy_usage_after_credits',
      touComponent: 'total',
    },
  },

  // pce_energy_cost (TOU)
  {
    id: 'adu_pce_cost_off_peak',
    headers: {
      unit: 'adu',
      category: 'pce_energy_cost',
      subheader: 'off_peak',
    },
    accessor: (month) => month.adu?.pce_energy_cost?.off_peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_energy_cost',
      touComponent: 'off_peak',
    },
  },
  {
    id: 'adu_pce_cost_peak',
    headers: {
      unit: 'adu',
      category: 'pce_energy_cost',
      subheader: 'peak',
    },
    accessor: (month) => month.adu?.pce_energy_cost?.peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_energy_cost',
      touComponent: 'peak',
    },
  },
  {
    id: 'adu_pce_cost_total',
    headers: {
      unit: 'adu',
      category: 'pce_energy_cost',
      subheader: 'total',
    },
    accessor: (month) => month.adu?.pce_energy_cost?.total as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_energy_cost',
      touComponent: 'total',
    },
  },

  // pce_energy_rates (TOU) - $/kWh rates
  {
    id: 'adu_pce_rates_off_peak',
    headers: {
      unit: 'adu',
      category: 'pce_energy_rates',
      subheader: 'off_peak',
    },
    accessor: (month) => month.adu?.pce_energy_rates?.off_peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 4,  // 4 decimals for $/kWh precision
    group: 'pce',
    metadata: {
      fieldName: 'pce_energy_rates',
      touComponent: 'off_peak',
    },
  },
  {
    id: 'adu_pce_rates_peak',
    headers: {
      unit: 'adu',
      category: 'pce_energy_rates',
      subheader: 'peak',
    },
    accessor: (month) => month.adu?.pce_energy_rates?.peak as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 4,  // 4 decimals for $/kWh precision
    group: 'pce',
    metadata: {
      fieldName: 'pce_energy_rates',
      touComponent: 'peak',
    },
  },

  // PCE single-value columns
  {
    id: 'adu_pce_net_generation_bonus',
    headers: {
      unit: 'adu',
      category: 'pce',
      subheader: 'pce_net_generation_bonus',
    },
    accessor: (month) => month.adu?.pce_net_generation_bonus as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_net_generation_bonus',
    },
  },
  {
    id: 'adu_pce_energy_commission_surcharge',
    headers: {
      unit: 'adu',
      category: 'pce',
      subheader: 'pce_energy_commission_surcharge',
    },
    accessor: (month) => month.adu?.pce_energy_commission_surcharge as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_energy_commission_surcharge',
    },
  },
  {
    id: 'adu_pce_total_energy_charges',
    headers: {
      unit: 'adu',
      category: 'pce',
      subheader: 'pce_total_energy_charges',
    },
    accessor: (month) => month.adu?.pce_total_energy_charges as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_total_energy_charges',
    },
  },
  {
    id: 'adu_pce_nem_credit',
    headers: {
      unit: 'adu',
      category: 'pce',
      subheader: 'pce_nem_credit',
    },
    accessor: (month) => month.adu?.pce_nem_credit as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_nem_credit',
    },
  },
  {
    id: 'adu_pce_generation_charges_due_cash',
    headers: {
      unit: 'adu',
      category: 'pce',
      subheader: 'pce_generation_charges_due_cash',
    },
    accessor: (month) => month.adu?.pce_generation_charges_due_cash as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pce',
    metadata: {
      fieldName: 'pce_generation_charges_due_cash',
    },
  },

  // PG&E columns
  {
    id: 'adu_pge_res_energy_charges',
    headers: {
      unit: 'adu',
      category: 'pge',
      subheader: 'pge_res_energy_charges',
    },
    accessor: (month) => month.adu?.pge_res_energy_charges as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_res_energy_charges',
    },
  },
  {
    id: 'adu_pge_baseline_credit',
    headers: {
      unit: 'adu',
      category: 'pge',
      subheader: 'pge_baseline_credit',
    },
    accessor: (month) => month.adu?.pge_baseline_credit as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_baseline_credit',
    },
  },
  {
    id: 'adu_pge_da_cca_charges',
    headers: {
      unit: 'adu',
      category: 'pge',
      subheader: 'pge_da_cca_charges',
    },
    accessor: (month) => month.adu?.pge_da_cca_charges as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_da_cca_charges',
    },
  },
  {
    id: 'adu_pge_total_energy_charges',
    headers: {
      unit: 'adu',
      category: 'pge',
      subheader: 'pge_total_energy_charges',
    },
    accessor: (month) => month.adu?.pge_total_energy_charges as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_total_energy_charges',
    },
  },
  {
    id: 'adu_pge_nem_billing',
    headers: {
      unit: 'adu',
      category: 'pge',
      subheader: 'pge_nem_billing',
    },
    accessor: (month) => month.adu?.pge_nem_billing as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_nem_billing',
    },
  },
  {
    id: 'adu_pge_minimum_delivery_charge',
    headers: {
      unit: 'adu',
      category: 'pge',
      subheader: 'pge_minimum_delivery_charge',
    },
    accessor: (month) => month.adu?.pge_minimum_delivery_charge as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_minimum_delivery_charge',
    },
  },
  {
    id: 'adu_pge_nem_true_up_adjustment',
    headers: {
      unit: 'adu',
      category: 'pge',
      subheader: 'pge_nem_true_up_adjustment',
    },
    accessor: (month) => month.adu?.pge_nem_true_up_adjustment as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_nem_true_up_adjustment',
    },
  },
  {
    id: 'adu_pge_electric_delivery_charges',
    headers: {
      unit: 'adu',
      category: 'pge',
      subheader: 'pge_electric_delivery_charges',
    },
    accessor: (month) => month.adu?.pge_electric_delivery_charges as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'pge',
    metadata: {
      fieldName: 'pge_electric_delivery_charges',
    },
  },

  // Totals
  {
    id: 'adu_california_climate_credit',
    headers: {
      unit: 'adu',
      category: 'totals',
      subheader: 'california_climate_credit',
    },
    accessor: (month) => month.adu?.california_climate_credit as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'totals',
    metadata: {
      fieldName: 'california_climate_credit',
    },
  },
  {
    id: 'adu_total_bill_in_mail',
    headers: {
      unit: 'adu',
      category: 'totals',
      subheader: 'total_bill_in_mail',
    },
    accessor: (month) => month.adu?.total_bill_in_mail as EnergyMetricWithValue | null ?? null,
    format: 'number',
    decimals: 2,
    group: 'totals',
    metadata: {
      fieldName: 'total_bill_in_mail',
    },
  },
];

/**
 * Complete table configuration
 */
export const tableConfig: TableConfig = {
  main: mainColumns,
  adu: aduColumns,
};
