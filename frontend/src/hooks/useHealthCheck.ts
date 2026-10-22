import { useState, useEffect, useCallback } from 'react';
import { healthService } from '../services/healthService';
import type { HealthResponse, DetailedHealthResponse } from '../types/health';

export interface UseHealthCheckReturn {
  health: HealthResponse | null;
  detailed: DetailedHealthResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  latencyMs: number | null;
  lastChecked: Date | null;
  checkHealth: () => Promise<void>;
}

export function useHealthCheck(): UseHealthCheckReturn {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [detailed, setDetailed] = useState<DetailedHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    const startTime = performance.now();

    try {
      // 1. Call GET /api/health directly (primary requirement)
      const healthData = await healthService.getHealth();
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      setHealth(healthData);

      // 2. Fetch detailed diagnostics in background if possible
      try {
        const detailedData = await healthService.getDetailedHealth();
        setDetailed(detailedData);
      } catch {
        // Detailed check is supplementary
      }

      setLastChecked(new Date());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reach API server';
      setError(message);
      setHealth(null);
      setLatencyMs(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    health,
    detailed,
    isLoading,
    isRefreshing,
    error,
    latencyMs,
    lastChecked,
    checkHealth,
  };
}
