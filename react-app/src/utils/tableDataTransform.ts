export interface TableRow {
  key: string;
  value: string;
  unit: string;
}

export function renderDataValue(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') return value.toFixed(2);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function renderDataTable(
  obj: Record<string, unknown>,
  prefix = ''
): TableRow[] {
  const rows: TableRow[] = [];

  const traverse = (dataObj: Record<string, unknown>, path: string) => {
    Object.keys(dataObj).forEach((key) => {
      const value = dataObj[key];
      const currentPath = path ? `${path}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const objValue = value as Record<string, unknown>;
        if (objValue.value === undefined) {
          traverse(objValue, currentPath);
        } else {
          rows.push({
            key: currentPath,
            value: renderDataValue(objValue.value),
            unit: (objValue.unit as string) || '',
          });
        }
      } else if (typeof value !== 'object') {
        rows.push({
          key: currentPath,
          value: renderDataValue(value),
          unit: '',
        });
      }
    });
  };

  traverse(obj, prefix);
  return rows;
}
