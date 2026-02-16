import React from 'react';
import type { BillingYearWithId } from '@/types/api';
import { getOffPeakValue, getPeakValue } from '@/types/utils';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import { renderDataTable } from '@/utils/tableDataTransform';
import MonthSelector from './MonthSelector';
import SolarChart from './SolarChart';
import RawDataTable from './RawDataTable';

interface SolarProps {
  data: BillingYearWithId | null;
  width?: number;
  height?: number;
}


const Solar: React.FC<SolarProps> = ({ data, width = 100, height = 100 }) => {
  const totalMonths = data?.billing_months?.length ?? 0;
  const { monthIdx, setMonthIdx, handlePrevMonth, handleNextMonth } = useMonthNavigation(totalMonths);

  if (!data || !data.billing_months || data.billing_months.length === 0) {
    return <div>No billing data available</div>;
  }

  const currentMonth = data.billing_months[monthIdx];
  if (!currentMonth) {
    return <div>Invalid month index</div>;
  }

  // Extract energy values using type utilities
  const offPeakExport = getOffPeakValue(currentMonth.main?.energy_export_meter_channel_2);
  const peakExport = getPeakValue(currentMonth.main?.energy_export_meter_channel_2);
  const offPeakImport = getOffPeakValue(currentMonth.main?.energy_import_meter_channel_1);
  const peakImport = getPeakValue(currentMonth.main?.energy_import_meter_channel_1);
  const monthName = currentMonth.month_label?.month_name ?? 'N/A';

  const tableData = renderDataTable(currentMonth as unknown as Record<string, unknown>);

  return (
    <div>
      <MonthSelector
        monthIdx={monthIdx}
        totalMonths={data.billing_months.length}
        monthName={monthName}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onMonthChange={setMonthIdx}
      />
      <div style={{ display: 'flex', gap: '20px' }}>
        <SolarChart
          width={width}
          height={height}
          offPeakExport={offPeakExport}
          peakExport={peakExport}
          offPeakImport={offPeakImport}
          peakImport={peakImport}
        />

        <RawDataTable
          tableData={tableData}
          maxHeight={height}
        />
      </div>
    </div>
  );
};

export default Solar;
