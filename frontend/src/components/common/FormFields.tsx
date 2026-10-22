import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      type,
      showPasswordToggle = true,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isPasswordType = type === 'password';
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const effectiveType = isPasswordType && isPasswordVisible ? 'text' : type;

    const renderPasswordToggle = () => {
      if (!isPasswordType || !showPasswordToggle) return null;
      return (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsPasswordVisible((prev) => !prev)}
          className="text-slate-400 hover:text-white transition-colors focus:outline-none p-1 rounded-lg hover:bg-slate-800 focus:ring-1 focus:ring-emerald-500/50 cursor-pointer"
          title={isPasswordVisible ? 'Hide password' : 'Show password'}
          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
        >
          {isPasswordVisible ? (
            <EyeOff className="w-4 h-4 text-emerald-400" />
          ) : (
            <Eye className="w-4 h-4 text-slate-400 hover:text-slate-200" />
          )}
        </button>
      );
    };

    const hasRightElement = Boolean(rightIcon || (isPasswordType && showPasswordToggle));

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            className={cn(
              'block w-full rounded-xl bg-slate-900/90 border border-slate-750 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500',
              'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors duration-150',
              leftIcon && 'pl-10',
              hasRightElement && 'pr-11',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
              className
            )}
            {...props}
          />
          {hasRightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightIcon ? (
                <div className="pointer-events-none text-slate-400">{rightIcon}</div>
              ) : (
                renderPasswordToggle()
              )}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-slate-400">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';


export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'block w-full rounded-xl bg-slate-900/90 border border-slate-750 p-3.5 text-sm text-slate-100 placeholder-slate-500',
            'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors duration-150',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-slate-400">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'block w-full rounded-xl bg-slate-900/90 border border-slate-750 px-3.5 py-2.5 text-sm text-slate-100',
            'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors duration-150',
            error && 'border-rose-500',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const checkId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex items-start space-x-3 text-left">
        <input
          ref={ref}
          id={checkId}
          type="checkbox"
          className={cn(
            'h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 mt-0.5',
            className
          )}
          {...props}
        />
        <div>
          <label htmlFor={checkId} className="text-xs sm:text-sm font-medium text-slate-200 cursor-pointer">
            {label}
          </label>
          {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
