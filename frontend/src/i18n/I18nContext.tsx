import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { SupportedLanguage, LanguageInfo, I18nContextType } from './types';
import { SUPPORTED_LANGUAGES } from './types';

import enTranslations from './locales/en.json';
import teTranslations from './locales/te.json';
import hiTranslations from './locales/hi.json';

const STORAGE_KEY = 'tailor_marketplace_lang';

const translations: Record<SupportedLanguage, Record<string, any>> = {
  en: enTranslations,
  te: teTranslations,
  hi: hiTranslations,
};

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj) return undefined;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (saved && (saved === 'en' || saved === 'te' || saved === 'hi')) {
        return saved;
      }
    } catch {
      // Ignore localStorage access errors
    }
    return 'en';
  });

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {
      // In non-browser environments
    }
  }, [language]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.warn('Failed to persist language in localStorage', e);
    }
  }, []);

  const t = useCallback(
    (
      key: string,
      paramsOrFallback?: Record<string, string | number> | string,
      fallback?: string
    ): string => {
      let params: Record<string, string | number> | undefined;
      let defaultVal: string | undefined;

      if (typeof paramsOrFallback === 'string') {
        defaultVal = paramsOrFallback;
      } else if (paramsOrFallback && typeof paramsOrFallback === 'object') {
        params = paramsOrFallback;
        defaultVal = fallback;
      }

      // 1. Try active language
      let text = getNestedValue(translations[language], key);

      // 2. Fallback to English
      if (text === undefined && language !== 'en') {
        text = getNestedValue(translations.en, key);
      }

      // 3. Fallback to defaultVal or key itself
      if (text === undefined) {
        text = defaultVal !== undefined ? defaultVal : key;
      }

      // 4. Parameter interpolation: replace {paramName}
      if (params && text) {
        Object.entries(params).forEach(([paramKey, val]) => {
          text = text!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
        });
      }

      return text;
    },
    [language]
  );

  const contextValue = useMemo<I18nContextType>(
    () => ({
      language,
      setLanguage,
      t,
      languages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
