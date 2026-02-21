import type {
  BillingStructureMetadata,
  MeterMetadata,
  FieldMetadata,
  DateFieldMetadata,
  SimpleFieldMetadata,
  TOUFieldMetadata,
  TOUComponentMetadata,
  FieldSource,
} from '@/types/generated/metadata';
import { WhereFrom, Unit } from '@/types/generated/metadata';

/**
 * Create a FieldSource object
 */
export function createFieldSource(
  where_from: WhereFrom,
  where_on_pdf: string = '',
  kevins_number_code?: number
): FieldSource {
  return {
    where_from: WhereFrom[where_from] as unknown as WhereFrom, // Convert enum to string name
    where_on_pdf,
    kevins_number_code: kevins_number_code !== undefined ? kevins_number_code : null,
  };
}

/**
 * Create DateFieldMetadata
 */
export function createDateField(sources: FieldSource[]): FieldMetadata {
  return {
    metadata: {
      $case: 'date_field',
      date_field: {
        where_found: sources,
      },
    },
  };
}

/**
 * Create SimpleFieldMetadata
 */
export function createSimpleField(unit: Unit, sources: FieldSource[]): FieldMetadata {
  return {
    metadata: {
      $case: 'simple_field',
      simple_field: {
        unit: Unit[unit] as unknown as Unit, // Convert enum to string name
        where_found: sources,
      },
    },
  };
}

/**
 * Create TOUComponentMetadata
 */
export function createTOUComponent(unit: Unit, sources: FieldSource[]): TOUComponentMetadata {
  return {
    unit: Unit[unit] as unknown as Unit, // Convert enum to string name
    where_found: sources,
  };
}

/**
 * Create TOUFieldMetadata
 */
export function createTOUField(
  peakUnit: Unit,
  peakSources: FieldSource[],
  offPeakUnit: Unit,
  offPeakSources: FieldSource[],
  totalUnit: Unit,
  totalSources: FieldSource[]
): FieldMetadata {
  return {
    metadata: {
      $case: 'tou_field',
      tou_field: {
        peak: createTOUComponent(peakUnit, peakSources),
        off_peak: createTOUComponent(offPeakUnit, offPeakSources),
        total: createTOUComponent(totalUnit, totalSources),
      },
    },
  };
}

/**
 * Create MeterMetadata with custom fields
 */
export function createMeterMetadata(fields: { [key: string]: FieldMetadata }): MeterMetadata {
  return { fields };
}

/**
 * Create complete BillingStructureMetadata
 */
export function createBillingStructureMetadata(
  generationMeter?: MeterMetadata,
  benefitMeter?: MeterMetadata
): BillingStructureMetadata {
  return {
    generation_meter: generationMeter,
    benefit_meter: benefitMeter,
  };
}

// ===== Pre-built Fixtures =====

/**
 * Complete metadata with all field types
 */
export const mockFullMetadata: BillingStructureMetadata = createBillingStructureMetadata(
  createMeterMetadata({
    billing_date: createDateField([
      createFieldSource(WhereFrom.PDF_BILL, 'Header', 43),
    ]),
    service_end_date: createDateField([
      createFieldSource(WhereFrom.PDF_BILL, 'Header'),
      createFieldSource(WhereFrom.PDF_DETAIL_OF_BILL, 'Page 1'),
    ]),
    pce_energy_cost: createTOUField(
      Unit.DOLLARS,
      [createFieldSource(WhereFrom.CALCULATED, '')],
      Unit.DOLLARS,
      [createFieldSource(WhereFrom.CALCULATED, '')],
      Unit.DOLLARS,
      [createFieldSource(WhereFrom.PDF_DETAIL_OF_BILL, 'Page 3', 25)]
    ),
    california_climate_credit: createSimpleField(Unit.DOLLARS, [
      createFieldSource(WhereFrom.PDF_BILL, 'Electric Delivery Charges', 46),
    ]),
    total_bill_in_mail: createSimpleField(Unit.DOLLARS, [
      createFieldSource(WhereFrom.PDF_BILL, 'Amount Due', 42),
    ]),
  }),
  createMeterMetadata({
    billing_date: createDateField([
      createFieldSource(WhereFrom.PDF_BILL, 'Header', 43),
    ]),
    pce_energy_cost: createTOUField(
      Unit.DOLLARS,
      [createFieldSource(WhereFrom.CALCULATED, '')],
      Unit.DOLLARS,
      [createFieldSource(WhereFrom.CALCULATED, '')],
      Unit.DOLLARS,
      [createFieldSource(WhereFrom.PDF_DETAIL_OF_BILL, 'Page 3', 25)]
    ),
    california_climate_credit: createSimpleField(Unit.DOLLARS, [
      createFieldSource(WhereFrom.PDF_BILL, 'Electric Delivery Charges', 46),
    ]),
  })
);

/**
 * Metadata with only date fields
 */
export const mockDateFieldsOnly: BillingStructureMetadata = createBillingStructureMetadata(
  createMeterMetadata({
    billing_date: createDateField([
      createFieldSource(WhereFrom.PDF_BILL, 'Header', 43),
    ]),
    service_end_date: createDateField([
      createFieldSource(WhereFrom.PDF_BILL, 'Header'),
      createFieldSource(WhereFrom.PDF_DETAIL_OF_BILL, 'Page 1'),
    ]),
  }),
  undefined
);

/**
 * Metadata with only simple fields
 */
export const mockSimpleFieldsOnly: BillingStructureMetadata = createBillingStructureMetadata(
  createMeterMetadata({
    california_climate_credit: createSimpleField(Unit.DOLLARS, [
      createFieldSource(WhereFrom.PDF_BILL, 'Electric Delivery Charges', 46),
    ]),
    total_bill_in_mail: createSimpleField(Unit.DOLLARS, [
      createFieldSource(WhereFrom.PDF_BILL, 'Amount Due', 42),
    ]),
  }),
  undefined
);

/**
 * Metadata with only TOU fields
 */
export const mockTOUFieldsOnly: BillingStructureMetadata = createBillingStructureMetadata(
  createMeterMetadata({
    energy_export_meter_channel_2: createTOUField(
      Unit.KILOWATT_HOURS,
      [createFieldSource(WhereFrom.CALCULATED)],
      Unit.KILOWATT_HOURS,
      [createFieldSource(WhereFrom.CALCULATED)],
      Unit.KILOWATT_HOURS,
      [createFieldSource(WhereFrom.PDF_DETAIL_OF_BILL, 'Page 3', 10)]
    ),
    energy_import_meter_channel_1: createTOUField(
      Unit.KILOWATT_HOURS,
      [createFieldSource(WhereFrom.PDF_DETAIL_OF_BILL, 'Page 3', 8)],
      Unit.KILOWATT_HOURS,
      [createFieldSource(WhereFrom.PDF_DETAIL_OF_BILL, 'Page 3', 9)],
      Unit.KILOWATT_HOURS,
      [createFieldSource(WhereFrom.PDF_DETAIL_OF_BILL, 'Page 3', 7)]
    ),
  }),
  undefined
);

/**
 * Generation meter only (benefit meter empty)
 */
export const mockGenerationMeterOnly: BillingStructureMetadata = createBillingStructureMetadata(
  createMeterMetadata({
    billing_date: createDateField([
      createFieldSource(WhereFrom.PDF_BILL, 'Header'),
    ]),
    total_bill_in_mail: createSimpleField(Unit.DOLLARS, [
      createFieldSource(WhereFrom.PDF_BILL, 'Amount Due'),
    ]),
  }),
  createMeterMetadata({})  // Empty benefit meter
);

/**
 * Benefit meter only (generation meter empty)
 */
export const mockBenefitMeterOnly: BillingStructureMetadata = createBillingStructureMetadata(
  createMeterMetadata({}),  // Empty generation meter
  createMeterMetadata({
    billing_date: createDateField([
      createFieldSource(WhereFrom.PDF_BILL, 'Header'),
    ]),
    california_climate_credit: createSimpleField(Unit.DOLLARS, [
      createFieldSource(WhereFrom.PDF_BILL, 'Electric Delivery Charges'),
    ]),
  })
);

/**
 * Long metadata for scroll testing (many fields)
 */
export const mockLongMetadata: BillingStructureMetadata = createBillingStructureMetadata(
  createMeterMetadata({
    billing_date: createDateField([createFieldSource(WhereFrom.PDF_BILL, 'Header')]),
    service_end_date: createDateField([createFieldSource(WhereFrom.PDF_BILL, 'Header')]),
    service_start_date: createDateField([createFieldSource(WhereFrom.PDF_BILL, 'Header')]),
    field_3: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
    field_4: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
    field_5: createSimpleField(Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.PDF_BILL, 'Page 1')]),
    field_6: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
    field_7: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
    field_8: createTOUField(
      Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.CALCULATED)],
      Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.CALCULATED)],
      Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.PDF_BILL, 'Page 1')]
    ),
    field_9: createTOUField(
      Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)],
      Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)],
      Unit.DOLLARS, [createFieldSource(WhereFrom.PDF_BILL, 'Page 2')]
    ),
    field_10: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
    field_11: createSimpleField(Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.PDF_BILL, 'Page 2')]),
    field_12: createTOUField(
      Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.CALCULATED)],
      Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.CALCULATED)],
      Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.PDF_BILL, 'Page 3')]
    ),
    field_13: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
    field_14: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
    field_15: createSimpleField(Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.PDF_BILL, 'Page 3')]),
    field_16: createTOUField(
      Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)],
      Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)],
      Unit.DOLLARS, [createFieldSource(WhereFrom.PDF_BILL, 'Page 4')]
    ),
    field_17: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
    field_18: createSimpleField(Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.PDF_BILL, 'Page 4')]),
    field_19: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
    field_20: createTOUField(
      Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.CALCULATED)],
      Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.CALCULATED)],
      Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.PDF_BILL, 'Page 5')]
    ),
  }),
  createMeterMetadata({
    billing_date: createDateField([createFieldSource(WhereFrom.PDF_BILL, 'Header')]),
    service_end_date: createDateField([createFieldSource(WhereFrom.PDF_BILL, 'Header')]),
    service_start_date: createDateField([createFieldSource(WhereFrom.PDF_BILL, 'Header')]),
    field_3: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
    field_4: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
    field_5: createSimpleField(Unit.KILOWATT_HOURS, [createFieldSource(WhereFrom.PDF_BILL, 'Page 1')]),
    field_6: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
    field_7: createSimpleField(Unit.DOLLARS, [createFieldSource(WhereFrom.CALCULATED)]),
  })
);
