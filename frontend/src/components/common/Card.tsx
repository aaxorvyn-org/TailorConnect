import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass-panel rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl relative overflow-hidden backdrop-blur-md',
          hoverEffect &&
            'transition-all duration-300 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('pb-4 border-b border-slate-800/80 mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={cn('text-lg font-bold text-white tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-xs sm:text-sm text-slate-400 mt-1', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('space-y-4', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between', className)} {...props}>
    {children}
  </div>
);

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'positive',
  icon,
  subtitle,
}) => {
  return (
    <Card hoverEffect className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="w-10 h-10 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-center text-zinc-100">
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {value}
        </div>
        <div className="mt-1 flex items-center space-x-2 text-xs">
          {change && (
            <span
              className={cn(
                'font-medium px-1.5 py-0.5 rounded',
                changeType === 'positive' && 'bg-zinc-800 text-zinc-200 border border-zinc-700',
                changeType === 'negative' && 'bg-rose-500/10 text-rose-400',
                changeType === 'neutral' && 'bg-slate-800 text-slate-400'
              )}
            >
              {change}
            </span>
          )}
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
        </div>
      </div>
    </Card>
  );
};
