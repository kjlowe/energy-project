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
