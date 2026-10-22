import React from 'react';
import { Scissors, Server } from 'lucide-react';
import { appConfig } from '../utils/env';

interface NavbarProps {
  isOnline: boolean;
  isLoading: boolean;
  latencyMs: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({ isOnline, isLoading, latencyMs }) => {
  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-white transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-white font-sans">
                  {appConfig.appName}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Phase 1
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Tailor Marketplace & Shop Management System
              </p>
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs sm:text-sm">
              <span className="relative flex h-2.5 w-2.5">
                {isLoading ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                ) : isOnline ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                ) : (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isLoading
                      ? 'bg-amber-500'
                      : isOnline
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                  }`}
                ></span>
              </span>

              <span className="font-medium text-slate-300 hidden xs:inline">
                API:
              </span>
              <span
                className={`font-semibold ${
                  isLoading
                    ? 'text-amber-400'
                    : isOnline
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {isLoading ? 'Checking...' : isOnline ? 'Online' : 'Offline'}
              </span>

              {isOnline && latencyMs !== null && (
                <span className="text-[11px] text-slate-500 hidden sm:inline pl-1 border-l border-slate-800">
                  {latencyMs}ms
                </span>
              )}
            </div>

            {/* API Docs Link */}
            <a
              href={`${appConfig.apiBaseUrl}/api/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-850 border border-transparent hover:border-slate-800 transition-all duration-200"
            >
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Swagger API Docs</span>
            </a>
          </div>

        </div>
      </div>
    </header>
  );
};
