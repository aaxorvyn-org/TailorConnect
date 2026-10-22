import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../i18n';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'switch';
  className?: string;
  showTooltip?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
  showTooltip = true,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useTranslation();

  const label = isDark 
    ? t('common.themeLight', 'Switch to Light Mode') 
    : t('common.themeDark', 'Switch to Dark Mode');

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        title={showTooltip ? label : undefined}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
          isDark
            ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border-zinc-800 hover:border-zinc-700 shadow-sm'
            : 'bg-white hover:bg-zinc-100 text-zinc-900 border-zinc-200 hover:border-zinc-300 shadow-sm'
        } ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-zinc-200 animate-in spin-in-180 duration-300" />
            <span className="text-zinc-200">{t('common.light', 'Light')}</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-zinc-900 animate-in spin-in-180 duration-300" />
            <span className="text-zinc-900">{t('common.dark', 'Dark')}</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'switch') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={!isDark}
        onClick={toggleTheme}
        aria-label={label}
        title={showTooltip ? label : undefined}
        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 ${
          isDark ? 'bg-zinc-800' : 'bg-black'
        } ${className}`}
      >
        <span
          className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white text-black shadow ring-0 transition duration-200 ease-in-out ${
            isDark ? 'translate-x-0 bg-zinc-900 text-zinc-200' : 'translate-x-6 bg-white text-zinc-950'
          }`}
        >
          {isDark ? (
            <Moon className="h-3.5 w-3.5 text-zinc-200" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-zinc-900" />
          )}
        </span>
      </button>
    );
  }

  // Default: 'icon'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={showTooltip ? label : undefined}
      className={`relative p-2 rounded-xl transition-all duration-200 border group flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-zinc-400 ${
        isDark
          ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border-zinc-800 hover:border-zinc-700 hover:shadow-md'
          : 'bg-white hover:bg-zinc-100 text-zinc-900 border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-zinc-200 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110" />
      ) : (
        <Moon className="w-4 h-4 text-zinc-900 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
      )}
    </button>
  );
};
