import type { BillingYearWithId } from '@/types/api';

/**
 * Generate human-readable year label from billing year data.
 *
 * Examples:
 * - Full year: "May 2024 - April 2025"
 * - Partial year: "May 2024 - June 2024"
 * - Same month: "May 2024"
 * - Spanning years: "November 2024 - February 2025"
 *
 * @param billingYear The billing year data
 * @returns Formatted year label string
 */
export function generateYearLabel(billingYear: BillingYearWithId): string {
  if (!billingYear.months || billingYear.months.length === 0) {
    return 'No data available';
  }

  const firstMonth = billingYear.months[0];
  const lastMonth = billingYear.months[billingYear.months.length - 1];

  // Single month case
  if (billingYear.months.length === 1) {
    return `${firstMonth.month_name} ${firstMonth.year}`;
  }

  // Multiple months case
  return `${firstMonth.month_name} ${firstMonth.year} - ${lastMonth.month_name} ${lastMonth.year}`;
}
