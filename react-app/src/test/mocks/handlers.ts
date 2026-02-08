import { http, HttpResponse } from 'msw';
import { mockBillingYearSnakeCase } from './mockData/billingData';

const API_BASE = 'http://localhost:5000';

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
];
