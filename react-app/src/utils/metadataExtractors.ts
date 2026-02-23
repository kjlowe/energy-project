import type {
  BillingStructureMetadata,
  FieldMetadata,
  FieldSource,
  TOUFieldMetadata,
  Unit,
  WhereFrom,
} from '@/types/generated/metadata';

/**
 * ColumnConfig interface subset for metadata extraction
 * (Full definition in yearlyBillingTableConfig.ts)
 */
export interface ColumnConfigMetadata {
  headers: {
    unit?: string; // 'main' | 'adu'
  };
  metadata?: {
    fieldName: string;
    touComponent?: 'peak' | 'off_peak' | 'total';
  };
}

/**
 * Extracted metadata information for a column
 */
export interface ColumnMetadataInfo {
  units: string;           // "kWh", "$", or "—"
  whereFrom: string;       // "PDF_BILL", "CALCULATED", etc.
  whereOnPdf: string;      // "Page 3", "Header", etc.
  kevinsNumberCode: string; // "42", "—"
}

/**
 * Extract first source from date_field or simple_field metadata
 * Pattern from BillingMetadataTable.tsx lines 43-59
 */
function getFirstSource(fieldMeta: FieldMetadata | undefined | null): FieldSource | null {
  if (!fieldMeta) return null;

  const fieldType = fieldMeta.metadata?.$case;

  if (fieldType === 'date_field') {
    const sources = fieldMeta.metadata.date_field.where_found;
    return (sources && sources.length > 0 ? sources[0] : null) ?? null;
  }

  if (fieldType === 'simple_field') {
    const sources = fieldMeta.metadata.simple_field.where_found;
    return (sources && sources.length > 0 ? sources[0] : null) ?? null;
  }

  return null;
}

/**
 * Extract source from TOU component metadata
 * Pattern from BillingMetadataTable.tsx lines 64-75
 */
function getTOUComponentSource(
  touMeta: TOUFieldMetadata | undefined | null,
  component: 'peak' | 'off_peak' | 'total'
): FieldSource | null {
  if (!touMeta) return null;

  const componentMeta = touMeta[component];
  if (!componentMeta?.where_found) return null;

  const sources = componentMeta.where_found;
  return (sources && sources.length > 0 ? sources[0] : null) ?? null;
}

/**
 * Convert Unit enum to display string
 * Handles both numeric enum values (1, 2) and string enum names ("DOLLARS", "KILOWATT_HOURS")
 */
export function formatUnit(unit: Unit | undefined): string {
  if (!unit) return '—';

  // Handle string enum names (from mock data)
  const unitStr = unit as unknown as string;
  if (unitStr === 'DOLLARS' || unitStr === '1') {
    return '$';
  }
  if (unitStr === 'KILOWATT_HOURS' || unitStr === '2') {
    return 'kWh';
  }

  // Handle numeric enum values
  switch (unit) {
    case 1: // Unit.DOLLARS
      return '$';
    case 2: // Unit.KILOWATT_HOURS
      return 'kWh';
    default:
      return '—';
  }
}

/**
 * Convert WhereFrom enum to display string
 * Handles both numeric enum values and string enum names
 * Uses same pattern as BillingMetadataTable: cast to string
 */
export function formatWhereFrom(whereFrom: WhereFrom | undefined): string {
  if (!whereFrom) return '—';

  // Cast enum value to string (matches BillingMetadataTable pattern)
  const whereFromStr = (whereFrom as unknown as string) || '';

  // Return the enum key name
  return whereFromStr || '—';
}

/**
 * Extract metadata information for a column
 */
export function extractColumnMetadata(
  column: ColumnConfigMetadata,
  metadata: BillingStructureMetadata | null
): ColumnMetadataInfo {
  // Default values if metadata is missing
  const defaultInfo: ColumnMetadataInfo = {
    units: '—',
    whereFrom: '—',
    whereOnPdf: '—',
    kevinsNumberCode: '—',
  };

  if (!metadata || !column.metadata) {
    return defaultInfo;
  }

  // Determine meter type from column.headers.unit
  // "main" → generation_meter, "adu" → benefit_meter
  const meterType = column.headers.unit === 'main' ? 'generation_meter' : 'benefit_meter';
  const meterMetadata = meterType === 'generation_meter' ? metadata.generation_meter : metadata.benefit_meter;

  if (!meterMetadata) {
    return defaultInfo;
  }

  // Look up field metadata
  const fieldMeta = meterMetadata.fields[column.metadata.fieldName];

  if (!fieldMeta) {
    return defaultInfo;
  }

  const fieldType = fieldMeta.metadata?.$case;

  // Handle different field types
  // Helper to extract kevins_number_code (handles both OptionalInt32 and direct number)
  const extractNumberCode = (source: FieldSource | null): string => {
    if (!source?.kevins_number_code) return '—';
    // Handle OptionalInt32 type (has .value property)
    if (typeof source.kevins_number_code === 'object' && 'value' in source.kevins_number_code) {
      return source.kevins_number_code.value?.toString() || '—';
    }
    // Handle direct number (from fixtures)
    if (typeof source.kevins_number_code === 'number') {
      return source.kevins_number_code.toString();
    }
    return '—';
  };

  if (fieldType === 'date_field') {
    // Date fields have no units, only sources
    const source = getFirstSource(fieldMeta);
    return {
      units: '—',
      whereFrom: source ? formatWhereFrom(source.where_from) : '—',
      whereOnPdf: source?.where_on_pdf || '—',
      kevinsNumberCode: extractNumberCode(source),
    };
  }

  if (fieldType === 'simple_field') {
    // Simple fields have unit and sources
    const simpleField = fieldMeta.metadata.simple_field;
    const source = getFirstSource(fieldMeta);
    return {
      units: formatUnit(simpleField.unit),
      whereFrom: source ? formatWhereFrom(source.where_from) : '—',
      whereOnPdf: source?.where_on_pdf || '—',
      kevinsNumberCode: extractNumberCode(source),
    };
  }

  if (fieldType === 'tou_field' && column.metadata.touComponent) {
    // TOU fields: extract component metadata
    const touField = fieldMeta.metadata.tou_field;
    const component = column.metadata.touComponent;
    const componentMeta = touField[component];
    const source = getTOUComponentSource(touField, component);

    return {
      units: formatUnit(componentMeta?.unit),
      whereFrom: source ? formatWhereFrom(source.where_from) : '—',
      whereOnPdf: source?.where_on_pdf || '—',
      kevinsNumberCode: extractNumberCode(source),
    };
  }

  return defaultInfo;
}
