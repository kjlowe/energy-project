import { http, HttpResponse } from 'msw';
import { mockBillingYearSnakeCase } from './mockData/billingData';
import type {
  FlowChartDataResponse,
  FiltersResponse,
} from '@/types/api';

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

  // GET /api/data (FlowChart)
  http.get(`${API_BASE}/api/data`, () => {
    const response: FlowChartDataResponse = {
      nodes: [
        { id: '1', label: 'Start', type: 'start', x: 100, y: 100 },
        { id: '2', label: 'Process', type: 'process', x: 300, y: 100 },
        { id: '3', label: 'End', type: 'end', x: 500, y: 100 },
      ],
      edges: [
        { source: '1', target: '2', value: 100 },
        { source: '2', target: '3', value: 150 },
      ],
    };
    return HttpResponse.json(response);
  }),

  // GET /api/filters
  http.get(`${API_BASE}/api/filters`, () => {
    const response: FiltersResponse = {
      categories: ['Solar', 'Grid', 'Battery'],
      timeframes: ['Daily', 'Monthly', 'Yearly'],
    };
    return HttpResponse.json(response);
  }),
];
