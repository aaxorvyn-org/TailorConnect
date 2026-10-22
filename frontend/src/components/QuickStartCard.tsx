import React from 'react';
import { Terminal, Play, Database, Globe } from 'lucide-react';

export const QuickStartCard: React.FC = () => {
  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
      <div className="flex items-center space-x-3 pb-6 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Developer Quick Start Guide
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Commands to run, test, and manage both frontend and backend
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        
        {/* Backend Command */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-2">
            <Play className="w-3.5 h-3.5" />
            <span>1. Start Backend API</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800/80">
            <span className="text-slate-500"># Inside /backend</span>
            <br />
            <span className="text-emerald-400">.\.venv\Scripts\uvicorn</span> app.main:app --reload --port 8000
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Serves API at <span className="text-slate-300">http://127.0.0.1:8000</span>
          </p>
        </div>

        {/* Frontend Command */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>2. Start Frontend App</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800/80">
            <span className="text-slate-500"># Inside /frontend</span>
            <br />
            <span className="text-emerald-400">npm</span> run dev
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Launches Vite UI at <span className="text-slate-300">http://localhost:5173</span>
          </p>
        </div>

        {/* PostgreSQL & Migrations */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-2 text-teal-400 font-semibold text-xs uppercase tracking-wider mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>3. PostgreSQL &amp; Alembic</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800/80">
            <span className="text-slate-500"># Inside /backend</span>
            <br />
            <span className="text-emerald-400">.\.venv\Scripts\alembic</span> upgrade head
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Applies migrations using credentials in <span className="text-slate-300">backend/.env</span>
          </p>
        </div>

      </div>
    </div>
  );
};
