import React, { useState } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Check, 
  Copy, 
  AlertCircle, 
  Zap, 
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { appConfig } from '../utils/env';
import type { HealthResponse } from '../types/health';

interface HealthStatusCardProps {
  health: HealthResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  latencyMs: number | null;
  lastChecked: Date | null;
  onRefresh: () => void;
}

export const HealthStatusCard: React.FC<HealthStatusCardProps> = ({
  health,
  isLoading,
  isRefreshing,
  error,
  latencyMs,
  lastChecked,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(false);
  const endpointUrl = `${appConfig.apiBaseUrl}/api/health`;

  const copyPayload = () => {
    if (health) {
      navigator.clipboard.writeText(JSON.stringify(health, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHealthy = Boolean(health && health.status === 'ok');

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden transition-all duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            isHealthy 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Backend Health API
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                isHealthy
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}>
                {isLoading ? 'Checking' : isHealthy ? 'HTTP 200 OK' : 'Unavailable'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Endpoint: <code className="text-emerald-400 font-mono">GET /api/health</code>
            </p>
          </div>
        </div>

        {/* Action Button: Ping Health API */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 font-medium text-xs sm:text-sm shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
            id="ping-api-btn"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Pinging...' : 'Ping Health API'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Status</span>
            <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          </div>
          <div className={`font-semibold text-sm sm:text-base capitalize ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isLoading ? 'Connecting...' : health?.status || 'Offline'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Latency</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="font-semibold text-sm sm:text-base text-white font-mono">
            {latencyMs !== null ? `${latencyMs} ms` : '—'}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Last Check</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="font-semibold text-xs sm:text-sm text-slate-300">
            {lastChecked ? lastChecked.toLocaleTimeString() : 'Pending'}
          </div>
        </div>
      </div>

      {/* Response Box / Error Banner */}
      {isHealthy && health ? (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Live JSON Response from Backend
            </span>
            <button
              onClick={copyPayload}
              className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-slate-900/95 border border-slate-800 font-mono text-xs sm:text-sm p-4">
            <pre className="text-emerald-300 whitespace-pre overflow-x-auto">
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Verified Response Schema: <code className="text-slate-400">{`{ "status": "${health.status}", "message": "${health.message}" }`}</code></span>
            <a
              href={endpointUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-emerald-400 hover:underline"
            >
              <span>Direct Link</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-semibold text-rose-300">
                Backend API is not responding at {endpointUrl}
              </p>
              <p className="mt-1 text-rose-300/80 leading-relaxed">
                {error || 'Connection refused. Ensure the FastAPI backend server is running on port 8000.'}
              </p>
              <div className="mt-3 bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
                <code>cd backend &amp;&amp; .\.venv\Scripts\uvicorn app.main:app --reload --port 8000</code>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
