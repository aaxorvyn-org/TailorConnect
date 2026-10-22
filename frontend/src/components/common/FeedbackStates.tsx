import React from 'react';
import { Loader2, AlertCircle, RefreshCw, Scissors, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading tailor data...',
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-12 space-y-3', className)}>
      <Loader2 className={cn('animate-spin text-emerald-400', sizes[size])} />
      {label && <p className="text-xs sm:text-sm text-slate-400 font-medium">{label}</p>}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('glass-panel rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4', className)}>
      <div className="h-44 bg-slate-800/60 rounded-xl" />
      <div className="h-4 bg-slate-800/80 rounded w-3/4" />
      <div className="h-3 bg-slate-800/50 rounded w-1/2" />
      <div className="flex items-center justify-between pt-2">
        <div className="h-6 bg-slate-800/60 rounded w-20" />
        <div className="h-8 bg-slate-800/60 rounded w-24" />
      </div>
    </div>
  );
};

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'glass-panel rounded-2xl p-8 sm:p-12 text-center border border-dashed border-slate-800 max-w-lg mx-auto my-8',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
        {icon || <Scissors className="w-6 h-6 transform -rotate-45" />}
      </div>
      <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button variant="primary" size="sm" onClick={onAction}>
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error loading the atelier and tailor information. Please try again.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'glass-panel rounded-2xl p-6 sm:p-8 border border-rose-500/30 bg-rose-500/5 text-center max-w-lg mx-auto my-6',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-rose-300">{title}</h3>
      <p className="text-xs sm:text-sm text-rose-300/80 mt-1.5 max-w-sm mx-auto leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-rose-400" />}
            className="border-rose-500/40 hover:bg-rose-500/10 text-rose-300"
          >
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
};
