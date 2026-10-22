import React from 'react';
import { FolderTree, LayoutGrid, Server } from 'lucide-react';

export const ArchitectureGrid: React.FC = () => {
  const frontendFolders = [
    { name: 'pages', desc: 'Route-level view components (HomePage)' },
    { name: 'components', desc: 'Reusable modular UI building blocks' },
    { name: 'layouts', desc: 'Global shells, responsive layout wrappers' },
    { name: 'services', desc: 'Centralized API communication & clients' },
    { name: 'hooks', desc: 'Custom stateful hooks (useHealthCheck)' },
    { name: 'utils', desc: 'Config wrappers and formatting helpers' },
    { name: 'types', desc: 'TypeScript interface contracts & models' },
    { name: 'assets', desc: 'Static media, SVGs, icons, and stylesheets' },
  ];

  const backendFolders = [
    { name: 'api', desc: 'FastAPI routing & dependency injection' },
    { name: 'models', desc: 'SQLAlchemy ORM entity models & mixins' },
    { name: 'schemas', desc: 'Pydantic request & response validation' },
    { name: 'services', desc: 'Encapsulated business logic layer' },
    { name: 'repositories', desc: 'Data access & generic CRUD operations' },
    { name: 'database', desc: 'Engine, session pooling, and Base' },
    { name: 'core', desc: 'Environment config (pydantic-settings)' },
    { name: 'utils', desc: 'Structured logging and helpers' },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
      
      {/* Title */}
      <div className="flex items-center space-x-3 pb-6 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
          <FolderTree className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Scalable Full-Stack Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Phase 1 modular structure implemented according to clean enterprise standards
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Frontend Column */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
              <LayoutGrid className="w-4 h-4" />
              <span>/frontend (React + Vite + TypeScript)</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Tailwind CSS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {frontendFolders.map((item) => (
              <div key={item.name} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs hover:border-slate-700 transition-colors">
                <div className="font-mono font-semibold text-emerald-300">
                  src/{item.name}/
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backend Column */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
              <Server className="w-4 h-4" />
              <span>/backend (FastAPI + Python 3.14)</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              SQLAlchemy &amp; Alembic
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {backendFolders.map((item) => (
              <div key={item.name} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs hover:border-slate-700 transition-colors">
                <div className="font-mono font-semibold text-indigo-300">
                  app/{item.name}/
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
