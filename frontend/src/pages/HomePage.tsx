import React from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { HealthStatusCard } from '../components/HealthStatusCard';
import { DatabaseStatusCard } from '../components/DatabaseStatusCard';
import { ArchitectureGrid } from '../components/ArchitectureGrid';
import { QuickStartCard } from '../components/QuickStartCard';
import type { UseHealthCheckReturn } from '../hooks/useHealthCheck';

interface HomePageProps {
  healthState: UseHealthCheckReturn;
}

export const HomePage: React.FC<HomePageProps> = ({ healthState }) => {
  const {
    health,
    detailed,
    isLoading,
    isRefreshing,
    error,
    latencyMs,
    lastChecked,
    checkHealth,
  } = healthState;

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Welcome Banner */}
      <HeroBanner />

      {/* Main Content Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 flex-1 w-full">
        
        {/* Row 1: System Health & Database Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          <HealthStatusCard
            health={health}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            error={error}
            latencyMs={latencyMs}
            lastChecked={lastChecked}
            onRefresh={checkHealth}
          />

          <DatabaseStatusCard
            databaseHealth={detailed?.database}
            isLoading={isLoading}
          />
        </div>

        {/* Row 2: Architecture Diagram & Breakdown */}
        <ArchitectureGrid />

        {/* Row 3: Quick Start Guide */}
        <QuickStartCard />

      </div>
    </div>
  );
};
