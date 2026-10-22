import React from 'react';
import { Database, CheckCircle2, AlertTriangle, ShieldCheck, GitFork } from 'lucide-react';
import type { DatabaseHealth } from '../types/health';

interface DatabaseStatusCardProps {
  databaseHealth?: DatabaseHealth | null;
  isLoading: boolean;
}

export const DatabaseStatusCard: React.FC<DatabaseStatusCardProps> = ({
  databaseHealth,
  isLoading,
}) => {
  const isConnected = Boolean(databaseHealth?.connected);

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
      
      {/* Card Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                PostgreSQL & ORM Structure
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                SQLAlchemy 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Connection pooling, Declarative Base, and Alembic migrations ready
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400">
          <GitFork className="w-3.5 h-3.5 text-indigo-400" />
          <span>Alembic Enabled</span>
        </div>
      </div>

      {/* Database Diagnostic Details */}
      <div className="mt-6 space-y-4">
        
        {/* Status Callout */}
        <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
        }`}>
          {isConnected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-xs sm:text-sm">
            <div className="font-semibold">
              {isLoading
                ? 'Probing database connection...'
                : isConnected
                ? 'PostgreSQL Database Connected'
                : 'Connection Structure Ready (Server Waiting for DB Instance)'}
            </div>
            <p className="mt-1 text-slate-400 leading-relaxed">
              {databaseHealth?.message ||
                'SQLAlchemy ORM engine, session dependency generator, and Alembic migration scripts are completely configured.'}
            </p>
          </div>
        </div>

        {/* Configuration Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Host / Port</span>
            <span className="font-mono font-medium text-slate-200">
              {databaseHealth?.host || 'localhost'}:5432
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Target Database</span>
            <span className="font-mono font-medium text-slate-200">
              {databaseHealth?.database || 'tailor_marketplace_dev'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Security Credentials</span>
            <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Loaded via .env</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Migration Tool</span>
            <span className="font-mono font-medium text-indigo-300">alembic/</span>
          </div>
        </div>

      </div>

    </div>
  );
};
