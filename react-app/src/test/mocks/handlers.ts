import { http, HttpResponse } from 'msw';
import { mockBillingYearSnakeCase } from './mockData/billingData';
import { mockBillingYear2023 } from './mockData/billingData2023';
import { mockBillingYear2025 } from './mockData/billingData2025';
import { mockFullMetadata } from './mockData/metadataFixtures';
import { mockFullTariffSchedule } from './mockData/tariffFixtures';

const API_BASE = 'http://localhost:5000';

// Default handler: returns single billing year
export const handlers = [
  // GET /api/billing-years
  // Returns snake_case format (matching Python API)
  http.get(`${API_BASE}/api/billing-years`, () => {
    const response = {
      billing_years: [mockBillingYearSnakeCase],
      count: 1,
    };
    return HttpResponse.json(response);
  }),

  // GET /api/billing-metadata
  // Returns metadata for all billing fields
  http.get(`${API_BASE}/api/billing-metadata`, () => {
    return HttpResponse.json(mockFullMetadata);
  }),

  // GET /api/tariff-schedule
  // Returns PG&E E-TOU-C tariff schedule
  http.get(`${API_BASE}/api/tariff-schedule`, () => {
    return HttpResponse.json(mockFullTariffSchedule);
  }),
];

// Additional handlers for testing multi-year scenarios

// Metadata handler (can be reused in stories)
export const metadataHandler = http.get(`${API_BASE}/api/billing-metadata`, () => {
  return HttpResponse.json(mockFullMetadata);
});

// Tariff schedule handler (can be reused in stories)
export const tariffScheduleHandler = http.get(`${API_BASE}/api/tariff-schedule`, () => {
  return HttpResponse.json(mockFullTariffSchedule);
});

// Handler returning 3 billing years
export const multipleYearsHandler = http.get(
  `${API_BASE}/api/billing-years`,
  () => {
    return HttpResponse.json({
      billing_years: [
        mockBillingYear2023, // May 2023 - April 2024 (12 months)
        mockBillingYearSnakeCase, // May 2024 - June 2024 (2 months)
        mockBillingYear2025, // May 2025 - July 2025 (3 months)
      ],
      count: 3,
    });
  }
);

// Handler returning empty array
export const emptyYearsHandler = http.get(`${API_BASE}/api/billing-years`, () => {
  return HttpResponse.json({
    billing_years: [],
    count: 0,
  });
});
