import { apiClient } from './api';
import type { HealthResponse, DetailedHealthResponse } from '../types/health';

export const healthService = {
  /**
   * Calls GET /api/health to verify server status
   */
  async getHealth(): Promise<HealthResponse> {
    return apiClient<HealthResponse>('/api/health');
  },

  /**
   * Calls GET /api/health/detailed to obtain system and database diagnostics
   */
  async getDetailedHealth(): Promise<DetailedHealthResponse> {
    return apiClient<DetailedHealthResponse>('/api/health/detailed');
  },
};
