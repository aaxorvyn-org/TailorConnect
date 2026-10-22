import React from 'react';
import { Scissors } from 'lucide-react';
import { appConfig } from '../utils/env';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-400">
              {appConfig.appName}
            </span>
            <span>— Phase 1 Foundation</span>
          </div>

          <div className="flex items-center space-x-1">
            <span>FastAPI • React • TypeScript • PostgreSQL</span>
          </div>

        </div>
      </div>
    </footer>
  );
};
