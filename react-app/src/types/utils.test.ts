import { describe, it, expect } from 'vitest';
import {
  getMetricValue,
  getPeakValue,
  getOffPeakValue,
  getTotalValue,
  isValidNumber,
  formatEnergyValue,
} from './utils';
import type { EnergyMetric, EnergyMetricTOU } from './generated/billing';

describe('Type Utilities', () => {
  describe('getMetricValue', () => {
    it('should return value from metric with value field', () => {
      const metric = {
        subcomponent_values: [100.5],
        value: 100.5,
        unit: 'kWh',
      } as EnergyMetric & { value: number };

      expect(getMetricValue(metric)).toBe(100.5);
    });

    it('should return 0 for undefined metric', () => {
      expect(getMetricValue(undefined)).toBe(0);
    });

    it('should return 0 for null metric', () => {
      expect(getMetricValue(null)).toBe(0);
    });

    it('should calculate from subcomponent_values if value is missing', () => {
      const metric: EnergyMetric = {
        subcomponent_values: [50.0, 25.0, 25.5],
      };
      expect(getMetricValue(metric)).toBe(100.5);
    });
  });

  describe('getPeakValue', () => {
    it('should extract peak value from TOU metric', () => {
      const tou: EnergyMetricTOU = {
        peak: { subcomponent_values: [50.0] },
        off_peak: { subcomponent_values: [100.0] },
        total: { subcomponent_values: [150.0] },
      };
      const touWithValue = {
        ...tou,
        peak: { ...tou.peak, value: 50.0 },
      } as EnergyMetricTOU & { peak: EnergyMetric & { value: number } };

      expect(getPeakValue(touWithValue)).toBe(50.0);
    });

    it('should return 0 for undefined TOU metric', () => {
      expect(getPeakValue(undefined)).toBe(0);
    });
  });

  describe('isValidNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isValidNumber(123)).toBe(true);
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(-456.78)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber(Infinity)).toBe(false);
      expect(isValidNumber(-Infinity)).toBe(false);
      expect(isValidNumber('123')).toBe(false);
      expect(isValidNumber(null)).toBe(false);
      expect(isValidNumber(undefined)).toBe(false);
    });
  });

  describe('formatEnergyValue', () => {
    it('should format value with default unit', () => {
      expect(formatEnergyValue(123.456)).toBe('123.46 kWh');
    });

    it('should format value with custom unit', () => {
      expect(formatEnergyValue(789.012, 'MWh')).toBe('789.01 MWh');
    });

    it('should handle negative values', () => {
      expect(formatEnergyValue(-50.5)).toBe('-50.50 kWh');
    });
  });
});
