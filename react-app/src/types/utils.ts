import type { EnergyMetric, EnergyMetricTOU } from './generated/billing';

/**
 * Safely extract value from EnergyMetric, defaulting to 0.
 * The backend calculates and adds a 'value' field (sum of subcomponent_values).
 */
export function getMetricValue(metric: EnergyMetric | undefined | null): number {
  if (!metric) return 0;

  // Backend adds a 'value' field (sum of subcomponent_values)
  // TypeScript doesn't know about this field since it's added by Python, not in proto
  const metricWithValue = metric as EnergyMetric & { value?: number };

  if (metricWithValue.value !== undefined && metricWithValue.value !== null) {
    return metricWithValue.value;
  }

  // Fallback: calculate from subcomponent_values if value is missing
  if (metric.subcomponent_values && metric.subcomponent_values.length > 0) {
    return metric.subcomponent_values.reduce((sum, val) => sum + val, 0);
  }

  return 0;
}

/**
 * Extract peak value from TOU metric
 */
export function getPeakValue(tou: EnergyMetricTOU | undefined | null): number {
  return getMetricValue(tou?.peak);
}

/**
 * Extract off-peak value from TOU metric
 */
export function getOffPeakValue(tou: EnergyMetricTOU | undefined | null): number {
  return getMetricValue(tou?.off_peak);
}

/**
 * Extract total value from TOU metric
 */
export function getTotalValue(tou: EnergyMetricTOU | undefined | null): number {
  return getMetricValue(tou?.total);
}

/**
 * Type guard: check if value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Format energy value for display (e.g., "123.45")
 */
export function formatEnergyValue(value: number): string {
  return value.toFixed(2);
}
