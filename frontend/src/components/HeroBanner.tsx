import React from 'react';
import { Layers, Smartphone, Tablet, Monitor, CheckCircle2 } from 'lucide-react';
import { appConfig } from '../utils/env';

export const HeroBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden py-10 sm:py-14 border-b border-slate-900 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-48 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Foundation Tag */}
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-6 shadow-sm">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-emerald-400">Phase 1 Foundation</span>
          <span className="text-slate-500">•</span>
          <span>Scalable Multi-Vendor Architecture</span>
        </div>

        {/* Dynamic App Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          {appConfig.appName}
        </h1>

        <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Full-Stack Multi-Vendor Tailor Marketplace and Tailor Shop Management Platform built with React, Vite, TypeScript, FastAPI, and PostgreSQL.
        </p>

        {/* Responsive Device Support Indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-slate-300">
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span>Desktop</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-slate-300">
            <Tablet className="w-4 h-4 text-teal-400" />
            <span>Tablet</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-slate-300">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Mobile</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>PostgreSQL ORM Ready</span>
          </div>
        </div>

      </div>
    </div>
  );
};
