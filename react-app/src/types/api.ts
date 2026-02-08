import type { BillingYear } from './generated/billing';

/**
 * Response from GET /api/billing-years
 */
export interface BillingYearsResponse {
  billing_years: BillingYearWithId[];
  count: number;
}

/**
 * BillingYear with database ID added by backend
 */
export interface BillingYearWithId extends BillingYear {
  id: number;
}

/**
 * Response from GET /api/data (FlowChart data)
 */
export interface FlowChartDataResponse {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    x: number;
    y: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    value: number;
  }>;
}

/**
 * Response from GET /api/filters
 */
export interface FiltersResponse {
  categories: string[];
  timeframes: string[];
}
