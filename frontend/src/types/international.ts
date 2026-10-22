export interface CountryOption {
  code: string;
  name: string;
  dial_code: string;
  currency: string;
  currency_symbol: string;
  postal_label: string;
  postal_placeholder: string;
  postal_regex?: string;
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  exchange_rate_from_usd: number;
  standard_delivery_fee: number;
}

export interface PhoneValidationResult {
  is_valid: boolean;
  normalized_phone?: string;
  country_code?: string;
  country_name?: string;
  error_message?: string;
}

export interface AddressValidationResult {
  is_valid: boolean;
  validated_address?: {
    full_name: string;
    phone: string;
    address_line_1: string;
    city: string;
    state: string;
    country: string;
    country_code: string;
    pincode: string;
    postal_code: string;
  };
  country_name?: string;
  country_code?: string;
  error_message?: string;
}
