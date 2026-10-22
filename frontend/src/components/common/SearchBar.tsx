import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onFilterClick?: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search bespoke tailors, designs, garments...',
  onClear,
  onFilterClick,
  className,
}) => {
  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4 text-emerald-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-20 py-2.5 bg-slate-900/90 border border-slate-750 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors shadow-sm"
      />
      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center space-x-1">
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              onClear?.();
            }}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {onFilterClick && (
          <button
            type="button"
            onClick={onFilterClick}
            className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
