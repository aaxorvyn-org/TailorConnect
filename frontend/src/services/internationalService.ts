import { apiClient } from './api';
import type {
  CountryOption,
  CurrencyOption,
  PhoneValidationResult,
  AddressValidationResult,
} from '../types/international';

// Built-in fallback catalog ensuring UI is always responsive even offline
export const FALLBACK_COUNTRIES: CountryOption[] = [
  {
    code: 'IN',
    name: 'India',
    dial_code: '+91',
    currency: 'INR',
    currency_symbol: '₹',
    postal_label: 'PIN Code',
    postal_placeholder: '110001',
    postal_regex: '^\\d{6}$',
  },
  {
    code: 'US',
    name: 'United States',
    dial_code: '+1',
    currency: 'USD',
    currency_symbol: '$',
    postal_label: 'ZIP Code',
    postal_placeholder: '90210',
    postal_regex: '^\\d{5}(-\\d{4})?$',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dial_code: '+44',
    currency: 'GBP',
    currency_symbol: '£',
    postal_label: 'Postcode',
    postal_placeholder: 'W1S 3JN',
    postal_regex: '^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dial_code: '+971',
    currency: 'AED',
    currency_symbol: 'AED',
    postal_label: 'Area / PO Box',
    postal_placeholder: '00000',
    postal_regex: '^[A-Za-z0-9\\s\\-]{3,10}$',
  },
  {
    code: 'CA',
    name: 'Canada',
    dial_code: '+1',
    currency: 'CAD',
    currency_symbol: 'C$',
    postal_label: 'Postal Code',
    postal_placeholder: 'M5V 2T6',
    postal_regex: '^[A-Za-z]\\d[A-Za-z] ?\\d[A-Za-z]\\d$',
  },
  {
    code: 'AU',
    name: 'Australia',
    dial_code: '+61',
    currency: 'AUD',
    currency_symbol: 'A$',
    postal_label: 'Postal Code',
    postal_placeholder: '2000',
    postal_regex: '^\\d{4}$',
  },
  {
    code: 'SG',
    name: 'Singapore',
    dial_code: '+65',
    currency: 'SGD',
    currency_symbol: 'S$',
    postal_label: 'Postal Code',
    postal_placeholder: '238858',
    postal_regex: '^\\d{6}$',
  },
  {
    code: 'DE',
    name: 'Germany',
    dial_code: '+49',
    currency: 'EUR',
    currency_symbol: '€',
    postal_label: 'Postal Code (PLZ)',
    postal_placeholder: '10115',
    postal_regex: '^\\d{5}$',
  },
  {
    code: 'FR',
    name: 'France',
    dial_code: '+33',
    currency: 'EUR',
    currency_symbol: '€',
    postal_label: 'Code Postal',
    postal_placeholder: '75001',
    postal_regex: '^\\d{5}$',
  },
];

export const FALLBACK_CURRENCIES: CurrencyOption[] = [
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    exchange_rate_from_usd: 83.5,
    standard_delivery_fee: 60.0,
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    exchange_rate_from_usd: 1.0,
    standard_delivery_fee: 15.0,
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    exchange_rate_from_usd: 0.79,
    standard_delivery_fee: 12.0,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    exchange_rate_from_usd: 0.92,
    standard_delivery_fee: 14.0,
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED',
    exchange_rate_from_usd: 3.67,
    standard_delivery_fee: 55.0,
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    exchange_rate_from_usd: 1.36,
    standard_delivery_fee: 20.0,
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    exchange_rate_from_usd: 1.52,
    standard_delivery_fee: 22.0,
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    exchange_rate_from_usd: 1.34,
    standard_delivery_fee: 20.0,
  },
];

export const internationalService = {
  /**
   * Fetch active supported international countries
   */
  async getCountries(): Promise<CountryOption[]> {
    try {
      return await apiClient<CountryOption[]>('/api/international/countries', {
        method: 'GET',
      });
    } catch {
      return FALLBACK_COUNTRIES;
    }
  },

  /**
   * Fetch active supported billing currencies
   */
  async getCurrencies(): Promise<CurrencyOption[]> {
    try {
      return await apiClient<CurrencyOption[]>('/api/international/currencies', {
        method: 'GET',
      });
    } catch {
      return FALLBACK_CURRENCIES;
    }
  },

  /**
   * Validate international or domestic phone number via backend API
   */
  async validatePhone(phone: string, countryCode?: string): Promise<PhoneValidationResult> {
    return apiClient<PhoneValidationResult>('/api/international/validate-phone', {
      method: 'POST',
      body: JSON.stringify({ phone, country_code: countryCode }),
    });
  },

  /**
   * Validate international delivery address via backend API
   */
  async validateAddress(payload: {
    full_name: string;
    phone: string;
    address_line_1: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    country_code?: string;
  }): Promise<AddressValidationResult> {
    return apiClient<AddressValidationResult>('/api/international/validate-address', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Format numerical price with currency symbol and localized formatting
   */
  formatCurrency(amount: number, currencyCode: string = 'INR'): string {
    const code = currencyCode.toUpperCase();
    const curr = FALLBACK_CURRENCIES.find((c) => c.code === code) || FALLBACK_CURRENCIES[0];

    // Localized formatting
    const formattedNum = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    if (curr.code === 'INR') {
      return `₹${formattedNum}`;
    }
    if (curr.code === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    if (curr.code === 'GBP') {
      return `£${amount.toFixed(2)}`;
    }
    if (curr.code === 'EUR') {
      return `€${amount.toFixed(2)}`;
    }
    return `${curr.symbol} ${amount.toFixed(2)}`;
  },

  /**
   * Calculate converted prices for a base amount
   */
  convertFromBase(
    basePriceUsd: number,
    targetCurrencyCode: string = 'INR',
    currencies: CurrencyOption[] = FALLBACK_CURRENCIES
  ): { unitPrice: number; deliveryFee: number; totalAmount: number; symbol: string; currency: string } {
    const code = targetCurrencyCode.toUpperCase();
    const curr = currencies.find((c) => c.code === code) || currencies[0];
    const rate = curr.exchange_rate_from_usd;
    const unitPrice = Math.round(basePriceUsd * rate * 100) / 100;
    const deliveryFee = curr.standard_delivery_fee;
    const totalAmount = Math.round((unitPrice + deliveryFee) * 100) / 100;

    return {
      unitPrice,
      deliveryFee,
      totalAmount,
      symbol: curr.symbol,
      currency: curr.code,
    };
  },
};
