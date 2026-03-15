import type {
  TariffSchedule,
  TariffPeriod,
  OptionalDouble,
  TOURates,
  SeasonalTOURates,
  BaselineQuantities,
  SeasonalBaselineQuantities,
  TOUPeriodDefinitions,
} from '@/types/generated/tariff';

/**
 * Create an OptionalDouble wrapper
 */
export function createOptionalDouble(value: number): OptionalDouble {
  return { value };
}

/**
 * Create SeasonalTOURates
 */
export function createSeasonalTOURates(
  peak: number | null,
  offPeak: number | null
): SeasonalTOURates {
  return {
    peak: peak !== null ? createOptionalDouble(peak) : undefined,
    off_peak: offPeak !== null ? createOptionalDouble(offPeak) : undefined,
  };
}

/**
 * Create TOURates for both seasons
 */
export function createTOURates(
  summerPeak: number | null,
  summerOffPeak: number | null,
  winterPeak: number | null,
  winterOffPeak: number | null
): TOURates {
  return {
    summer: createSeasonalTOURates(summerPeak, summerOffPeak),
    winter: createSeasonalTOURates(winterPeak, winterOffPeak),
  };
}

/**
 * Create SeasonalBaselineQuantities for Territory T
 */
export function createSeasonalBaselineQuantities(
  territoryTIndividuallyMetered: number
): SeasonalBaselineQuantities {
  return {
    territory_t_individually_metered: territoryTIndividuallyMetered,
  };
}

/**
 * Create BaselineQuantities with winter and summer values
 */
export function createBaselineQuantities(
  winterBaseline: number,
  summerBaseline: number,
  note: string = 'E-TOU-C Territory T individually metered only'
): BaselineQuantities {
  return {
    winter: createSeasonalBaselineQuantities(winterBaseline),
    summer: createSeasonalBaselineQuantities(summerBaseline),
    note,
  };
}

/**
 * Create TOUPeriodDefinitions
 */
export function createTOUPeriodDefinitions(
  peakHours: string = '4:00 PM to 9:00 PM',
  peakDays: string = 'Every day (including weekends and holidays)',
  offPeakHours: string = 'All other times',
  summerSeason: string = 'June - September',
  winterSeason: string = 'October - May'
): TOUPeriodDefinitions {
  return {
    peak_hours: peakHours,
    peak_days: peakDays,
    off_peak_hours: offPeakHours,
    summer_season: summerSeason,
    winter_season: winterSeason,
  };
}

/**
 * Create a complete TariffPeriod
 */
export function createTariffPeriod(
  sourceFile: string,
  effectiveStart: string,
  effectiveEnd: string,
  deliveryMin: number | null,
  meterCharge: number | null,
  baselineCredit: number | null,
  climateCredit: number | null,
  summerPeak: number | null,
  summerOffPeak: number | null,
  winterPeak: number | null,
  winterOffPeak: number | null,
  winterBaseline: number,
  summerBaseline: number,
  note: string = ''
): TariffPeriod {
  return {
    source_file: sourceFile,
    effective_start: effectiveStart,
    effective_end: effectiveEnd,
    delivery_minimum: deliveryMin !== null ? createOptionalDouble(deliveryMin) : undefined,
    total_meter_charge: meterCharge !== null ? createOptionalDouble(meterCharge) : undefined,
    baseline_credit: baselineCredit !== null ? createOptionalDouble(baselineCredit) : undefined,
    ca_climate_credit: climateCredit !== null ? createOptionalDouble(climateCredit) : undefined,
    tou_rates: createTOURates(summerPeak, summerOffPeak, winterPeak, winterOffPeak),
    baseline_quantities: createBaselineQuantities(winterBaseline, summerBaseline),
    tou_periods: createTOUPeriodDefinitions(),
    note,
  };
}

/**
 * Create a TariffSchedule with periods
 */
export function createTariffSchedule(
  tariffName: string = 'E-TOU-C',
  description: string = 'Residential Inclusive Time-of-Use',
  periods: TariffPeriod[]
): TariffSchedule {
  return {
    tariff_name: tariffName,
    description,
    periods,
  };
}

// ===== Mock Data =====

/**
 * Single tariff period (April - May 2024)
 */
export const mockSinglePeriod = createTariffPeriod(
  'Res_Inclu_TOU_240401-240531.xlsx',
  '2024-04-01',
  '2024-05-31',
  0.39167,
  0.25298,
  -0.1073,
  -55.17206,
  0.62647,
  0.54303,
  0.52376,
  0.49541,
  12.9,
  7.1
);

/**
 * Period with null rates (current period)
 */
export const mockCurrentPeriod = createTariffPeriod(
  'res-inclu-tou-current.xlsx',
  'current',
  'current',
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  12.9,
  7.1,
  'Current rates - check source file for exact effective dates'
);

/**
 * Full tariff schedule with multiple periods
 */
export const mockFullTariffSchedule = createTariffSchedule(
  'E-TOU-C',
  'Residential Inclusive Time-of-Use',
  [
    createTariffPeriod(
      'Res_Inclu_TOU_240401-240531.xlsx',
      '2024-04-01',
      '2024-05-31',
      0.39167,
      0.25298,
      -0.1073,
      -55.17206,
      0.62647,
      0.54303,
      0.52376,
      0.49541,
      12.9,
      7.1
    ),
    createTariffPeriod(
      'Res_Inclu_TOU_240601-240930.xlsx',
      '2024-06-01',
      '2024-09-30',
      0.39745,
      0.25689,
      -0.10854,
      null,
      0.63547,
      0.55203,
      0.53276,
      0.50441,
      12.9,
      7.1
    ),
    createTariffPeriod(
      'Res_Inclu_TOU_241001-241231.xlsx',
      '2024-10-01',
      '2024-12-31',
      0.38923,
      0.25140,
      -0.10614,
      -73.48206,
      0.62141,
      0.53997,
      0.49378,
      0.46378,
      12.9,
      7.1
    ),
    createTariffPeriod(
      'Res_Inclu_TOU_250101-250228.xlsx',
      '2025-01-01',
      '2025-02-28',
      0.39261,
      0.25356,
      -0.10764,
      null,
      0.62801,
      0.54657,
      0.49312,
      0.46312,
      12.9,
      7.1
    ),
    createTariffPeriod(
      'Res_Inclu_TOU_250301-250831.xlsx',
      '2025-03-01',
      '2025-08-31',
      0.40035,
      0.25866,
      -0.10914,
      -55.17206,
      0.64221,
      0.56077,
      0.50086,
      0.47086,
      12.9,
      7.1
    ),
    mockCurrentPeriod,
  ]
);

/**
 * Tariff schedule with single period
 */
export const mockSinglePeriodSchedule = createTariffSchedule(
  'E-TOU-C',
  'Residential Inclusive Time-of-Use',
  [mockSinglePeriod]
);

/**
 * Empty tariff schedule
 */
export const mockEmptyTariffSchedule = createTariffSchedule(
  'E-TOU-C',
  'Residential Inclusive Time-of-Use',
  []
);

/**
 * Long tariff schedule (many periods for scroll testing)
 */
export const mockLongTariffSchedule = createTariffSchedule(
  'E-TOU-C',
  'Residential Inclusive Time-of-Use',
  [
    createTariffPeriod('Period_2020_Q1.xlsx', '2020-01-01', '2020-03-31', 0.35, 0.23, -0.09, null, 0.58, 0.50, 0.48, 0.45, 12.9, 7.1),
    createTariffPeriod('Period_2020_Q2.xlsx', '2020-04-01', '2020-06-30', 0.36, 0.24, -0.095, -50.0, 0.59, 0.51, 0.49, 0.46, 12.9, 7.1),
    createTariffPeriod('Period_2020_Q3.xlsx', '2020-07-01', '2020-09-30', 0.37, 0.245, -0.10, null, 0.60, 0.52, 0.50, 0.47, 12.9, 7.1),
    createTariffPeriod('Period_2020_Q4.xlsx', '2020-10-01', '2020-12-31', 0.38, 0.25, -0.105, -70.0, 0.61, 0.53, 0.51, 0.48, 12.9, 7.1),
    createTariffPeriod('Period_2021_Q1.xlsx', '2021-01-01', '2021-03-31', 0.37, 0.24, -0.10, null, 0.60, 0.52, 0.50, 0.47, 12.9, 7.1),
    createTariffPeriod('Period_2021_Q2.xlsx', '2021-04-01', '2021-06-30', 0.38, 0.245, -0.105, -52.0, 0.61, 0.53, 0.51, 0.48, 12.9, 7.1),
    createTariffPeriod('Period_2021_Q3.xlsx', '2021-07-01', '2021-09-30', 0.39, 0.25, -0.11, null, 0.62, 0.54, 0.52, 0.49, 12.9, 7.1),
    createTariffPeriod('Period_2021_Q4.xlsx', '2021-10-01', '2021-12-31', 0.40, 0.255, -0.115, -75.0, 0.63, 0.55, 0.53, 0.50, 12.9, 7.1),
    createTariffPeriod('Period_2022_Q1.xlsx', '2022-01-01', '2022-03-31', 0.38, 0.25, -0.10, null, 0.61, 0.53, 0.51, 0.48, 12.9, 7.1),
    createTariffPeriod('Period_2022_Q2.xlsx', '2022-04-01', '2022-06-30', 0.39, 0.255, -0.105, -53.0, 0.62, 0.54, 0.52, 0.49, 12.9, 7.1),
    createTariffPeriod('Period_2022_Q3.xlsx', '2022-07-01', '2022-09-30', 0.40, 0.26, -0.11, null, 0.63, 0.55, 0.53, 0.50, 12.9, 7.1),
    createTariffPeriod('Period_2022_Q4.xlsx', '2022-10-01', '2022-12-31', 0.41, 0.265, -0.115, -77.0, 0.64, 0.56, 0.54, 0.51, 12.9, 7.1),
    createTariffPeriod('Period_2023_Q1.xlsx', '2023-01-01', '2023-03-31', 0.39, 0.26, -0.11, null, 0.62, 0.54, 0.52, 0.49, 12.9, 7.1),
    createTariffPeriod('Period_2023_Q2.xlsx', '2023-04-01', '2023-06-30', 0.40, 0.265, -0.115, -54.0, 0.63, 0.55, 0.53, 0.50, 12.9, 7.1),
    createTariffPeriod('Period_2023_Q3.xlsx', '2023-07-01', '2023-09-30', 0.41, 0.27, -0.12, null, 0.64, 0.56, 0.54, 0.51, 12.9, 7.1),
    createTariffPeriod('Period_2023_Q4.xlsx', '2023-10-01', '2023-12-31', 0.42, 0.275, -0.125, -78.0, 0.65, 0.57, 0.55, 0.52, 12.9, 7.1),
    mockSinglePeriod,
    mockCurrentPeriod,
  ]
);
