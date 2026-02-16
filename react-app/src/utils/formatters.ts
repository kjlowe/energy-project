/**
 * Formatting utilities for displaying billing data values
 */

export type FormatType = 'number' | 'currency' | 'date' | 'percentage' | 'text';

/**
 * Format a value according to the specified format type
 *
 * @param value - The value to format (can be string, number, or null/undefined)
 * @param format - The format type to apply
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string, or em dash (—) for missing values
 */
export function formatValue(
  value: string | number | null | undefined,
  format: FormatType = 'number',
  decimals: number = 2
): string {
  // Handle missing values
  if (value === null || value === undefined || value === '') {
    return '—'; // Em dash for missing values
  }

  try {
    switch (format) {
      case 'number':
        return Number(value).toFixed(decimals);

      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(Number(value));

      case 'date':
        // Handle date strings
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return String(value); // Return as-is if not a valid date
        }
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

      case 'percentage':
        return `${(Number(value) * 100).toFixed(decimals)}%`;

      case 'text':
        return String(value);

      default:
        return String(value);
    }
  } catch (error) {
    // If formatting fails for any reason, return the value as a string
    return String(value);
  }
}
