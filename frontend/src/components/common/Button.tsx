import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variants = {
      primary:
        'bg-black text-white hover:bg-zinc-800 border border-black shadow-md focus:ring-zinc-500 font-semibold dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:border-white dark:shadow-white/5',
      gold:
        'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700 font-semibold shadow-sm focus:ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:border-white',
      secondary:
        'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-300 focus:ring-zinc-400 shadow-sm dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-850 dark:border-zinc-800',
      outline:
        'bg-transparent text-zinc-800 hover:bg-zinc-100 border border-zinc-300 hover:border-zinc-400 focus:ring-zinc-400 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-850 dark:hover:border-zinc-500',
      ghost:
        'bg-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border-transparent focus:ring-zinc-400 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-850',
      danger:
        'bg-zinc-900 text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 focus:ring-rose-500 dark:bg-zinc-900 dark:text-rose-400 dark:border-rose-900/70',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
