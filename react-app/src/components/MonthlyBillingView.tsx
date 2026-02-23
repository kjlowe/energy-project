import React from 'react';
import type { BillingYearWithId } from '@/types/api';
import type { BillingStructureMetadata } from '@/types/generated/metadata';
import { getOffPeakValue, getPeakValue } from '@/types/utils';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import MonthSelector from './MonthSelector';
import { MeterChart } from './MeterChart';
import { BillingMetadataTable } from './BillingMetadataTable';

interface SolarProps {
  data: BillingYearWithId | null;
  metadata: BillingStructureMetadata | null;
  width?: number;
  height?: number;
}


const Solar: React.FC<SolarProps> = ({ data, metadata, width = 100, height = 100 }) => {
  const totalMonths = data?.billing_months?.length ?? 0;
  const { monthIdx, setMonthIdx, handlePrevMonth, handleNextMonth } = useMonthNavigation(totalMonths);

  if (!data || !data.billing_months || data.billing_months.length === 0) {
    return <div>No billing data available</div>;
  }

  const currentMonth = data.billing_months[monthIdx];
  if (!currentMonth) {
    return <div>Invalid month index</div>;
  }

  // Extract energy values for generation meter (from main)
  const generationOffPeakExport = getOffPeakValue(currentMonth.main?.energy_export_meter_channel_2);
  const generationPeakExport = getPeakValue(currentMonth.main?.energy_export_meter_channel_2);
  const generationOffPeakImport = getOffPeakValue(currentMonth.main?.energy_import_meter_channel_1);
  const generationPeakImport = getPeakValue(currentMonth.main?.energy_import_meter_channel_1);

  // Extract energy values for benefit meter (from adu)
  const benefitOffPeakExport = getOffPeakValue(currentMonth.adu?.energy_export_meter_channel_2);
  const benefitPeakExport = getPeakValue(currentMonth.adu?.energy_export_meter_channel_2);
  const benefitOffPeakImport = getOffPeakValue(currentMonth.adu?.energy_import_meter_channel_1);
  const benefitPeakImport = getPeakValue(currentMonth.adu?.energy_import_meter_channel_1);

  const monthName = currentMonth.month_label?.month_name ?? 'N/A';

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

      {/* Generation Meter Section (TOP) */}
      {currentMonth.main && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '12px',
            color: '#2c3e50',
            borderBottom: '2px solid #3498db',
            paddingBottom: '8px'
          }}>
            Generation Meter
          </h3>
          <div style={{ display: 'flex', gap: '20px' }}>
            <MeterChart
              width={width}
              height={height}
              offPeakExport={generationOffPeakExport}
              peakExport={generationPeakExport}
              offPeakImport={generationOffPeakImport}
              peakImport={generationPeakImport}
              meterType="generation"
            />

            <BillingMetadataTable
              meterData={currentMonth.main}
              meterMetadata={metadata?.generation_meter}
              maxHeight={height}
            />
          </div>
        </div>
      )}

      {/* Benefit Meter Section (BOTTOM) */}
      {currentMonth.adu && (
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '12px',
            color: '#2c3e50',
            borderBottom: '2px solid #27ae60',
            paddingBottom: '8px'
          }}>
            Benefit Meter
          </h3>
          <div style={{ display: 'flex', gap: '20px' }}>
            <MeterChart
              width={width}
              height={height}
              offPeakExport={benefitOffPeakExport}
              peakExport={benefitPeakExport}
              offPeakImport={benefitOffPeakImport}
              peakImport={benefitPeakImport}
              meterType="benefit"
            />

            <BillingMetadataTable
              meterData={currentMonth.adu}
              meterMetadata={metadata?.benefit_meter}
              maxHeight={height}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Solar;
