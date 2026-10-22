import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ruler,
  User,
  MapPin,
  Save,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Globe,
  Coins,
  Phone,
  Check,
  AlertCircle,
  Truck,
} from 'lucide-react';

import { mockCustomerProfile } from '../../../mock';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input, Select } from '../../../components/common/FormFields';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from '../../../i18n';
import {
  internationalService,
  FALLBACK_COUNTRIES,
  FALLBACK_CURRENCIES,
} from '../../../services/internationalService';

export const CustomerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(mockCustomerProfile);
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');

  // International Jurisdiction & Preferences
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(
    user?.country === 'United Kingdom' ? 'GB' : 'IN'
  );
  const [country, setCountry] = useState<string>(user?.country || 'India');
  const [currency, setCurrency] = useState<string>(user?.currency || 'INR');

  // International Primary Delivery Address
  const [fullName, setFullName] = useState<string>(user?.full_name || profile.name);
  const [phone, setPhone] = useState<string>(user?.phone || '+91 98765 43210');
  const [addressLine1, setAddressLine1] = useState<string>('42 Marine Drive, Nariman Point');
  const [addressLine2, setAddressLine2] = useState<string>('Flat 8B, Sea View Tower');
  const [city, setCity] = useState<string>('Mumbai');
  const [state, setState] = useState<string>('Maharashtra');
  const [pincode, setPincode] = useState<string>('400021');

  // Live Verification States
  const [isValidatingAddress, setIsValidatingAddress] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const activeCountry =
    FALLBACK_COUNTRIES.find((c) => c.code === selectedCountryCode) || FALLBACK_COUNTRIES[0];
  const activeCurrency =
    FALLBACK_CURRENCIES.find((c) => c.code === currency) || FALLBACK_CURRENCIES[0];

  const handleCountryChange = (newCode: string) => {
    setSelectedCountryCode(newCode);
    const countryObj = FALLBACK_COUNTRIES.find((c) => c.code === newCode);
    if (countryObj) {
      setCountry(countryObj.name);
      if (countryObj.currency) {
        setCurrency(countryObj.currency);
      }
      const prevDial = activeCountry.dial_code;
      if (phone.startsWith(prevDial)) {
        setPhone(phone.replace(prevDial, countryObj.dial_code));
      } else if (!phone || phone.startsWith('+')) {
        setPhone(`${countryObj.dial_code} `);
      }
    }
    setValidationResult(null);
  };

  const handleVerifyAddress = async () => {
    setIsValidatingAddress(true);
    setValidationResult(null);
    try {
      const res = await internationalService.validateAddress({
        full_name: fullName.trim(),
        phone: phone.trim(),
        address_line_1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        pincode: pincode.trim(),
        country_code: selectedCountryCode,
      });

      if (res.is_valid) {
        setValidationResult({
          valid: true,
          message: `Address and ${activeCountry.postal_label} verified for ${res.country_name || country}.`,
        });
        showToast('success', 'Address Verified', 'International delivery location formatted and validated.');
      } else {
        setValidationResult({
          valid: false,
          message: res.error_message || 'Address format validation failed.',
        });
        showToast('error', 'Validation Notice', res.error_message || 'Address requires correction.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not verify address';
      setValidationResult({ valid: false, message: msg });
      showToast('error', 'Verification Failed', msg);
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      'success',
      'Bespoke Profile Saved',
      `Your preferences (${country}, ${currency}) and contact details have been securely synced.`
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Digital Anatomical Profile &amp; International Demographics
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {t('customer.profile.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('customer.profile.subtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 pl-2 font-medium">Unit:</span>
          {(['cm', 'in'] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-1 rounded-lg font-semibold uppercase transition-colors ${
                unit === u
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Contact & International Region */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                {t('customer.profile.personalInfo')}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {activeCountry.code} • {activeCurrency.code} ({activeCurrency.symbol})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label={t('customer.profile.fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label={t('customer.profile.email')}
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              required
            />
            <Select
              label={t('customer.profile.country')}
              value={selectedCountryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              options={FALLBACK_COUNTRIES.map((c) => ({
                value: c.code,
                label: `${c.name} (${c.dial_code})`,
              }))}
            />
            <Select
              label={t('customer.profile.currency')}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={FALLBACK_CURRENCIES.map((c) => ({
                value: c.code,
                label: `${c.code} - ${c.name} (${c.symbol})`,
              }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <Input
                label={`${t('customer.profile.phone')} (${activeCountry.dial_code})`}
                placeholder={`e.g. ${activeCountry.dial_code} 9876543210`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                E.164 compliant with domestic Indian 10-digit auto-formatting.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Active Courier Tier
              </label>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  Insured Atelier Courier Delivery:
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {activeCurrency.symbol} {activeCurrency.standard_delivery_fee.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* International Primary Delivery Address */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {t('customer.profile.deliveryAddress')}
                </h3>
                <p className="text-xs text-slate-400">
                  Used for verified atelier garment dispatches and fitting appointments.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleVerifyAddress}
              isLoading={isValidatingAddress}
              leftIcon={<Check className="w-3.5 h-3.5 text-emerald-400" />}
            >
              {isValidatingAddress ? t('customer.profile.verifying') : t('customer.profile.verifyAddress')}
            </Button>
          </div>

          {validationResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                validationResult.valid
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              {validationResult.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{validationResult.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2 lg:col-span-3">
              <Input
                label={t('customer.profile.addressLine')}
                placeholder="e.g. 42 Marine Drive / 14 Savile Row"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Input
                label="Address Line 2 (Apartment, Suite, Unit)"
                placeholder="e.g. Suite 4B, Penthouse West"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
            </div>
            <Input
              label={t('customer.profile.city')}
              placeholder="e.g. Mumbai / London / New York"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Input
              label={t('customer.profile.state')}
              placeholder="e.g. Maharashtra / Greater London / NY"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
            <Input
              label={activeCountry.postal_label || 'PIN / Postal Code'}
              placeholder={`e.g. ${activeCountry.postal_placeholder || '400001'}`}
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Phase 8 Dynamic Garment Measurement Profiles Callout */}
        <div className="p-5 rounded-2xl glass-panel border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Phase 8 Feature
              </span>
              <h3 className="text-sm font-bold text-white">Dynamic Garment Measurement Management</h3>
            </div>
            <p className="text-xs text-slate-400">
              Manage custom profiles for Shirts, Pants, Blouses, Suits, Dresses, and Lehengas with dynamic backend templates.
            </p>
          </div>
          <Link to="/dashboard/customer/measurements" className="shrink-0">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open My Measurements
            </Button>
          </Link>
        </div>

        {/* 32-Point Measurements Grid */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <Ruler className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Tailored Anatomical Measurements
                </h3>
                <p className="text-xs text-slate-400">
                  Last verified by Vance &amp; Co. Atelier (values in {unit})
                </p>
              </div>
            </div>

            <div className="hidden sm:inline-flex items-center space-x-1 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Master Verified</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(profile.measurements).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')} ({unit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={val}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        measurements: {
                          ...profile.measurements,
                          [key]: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Need updated measurements? Book a <span className="text-slate-200 font-medium">Doorstep Master Measuring</span> appointment or visit any partner atelier for complimentary laser 3D recording.
            </p>
          </div>
        </Card>

        {/* Saved Global Addresses */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Saved Global Fitting &amp; Delivery Locations
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Mumbai Residence</span>
                  <span className="text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    India (INR)
                  </span>
                </div>
                <span className="text-slate-400 mt-1 block">
                  42 Marine Drive, Nariman Point, Mumbai, Maharashtra 400021, India
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Primary
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">London Atelier Residence</span>
                  <span className="text-[10px] text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                    United Kingdom (GBP)
                  </span>
                </div>
                <span className="text-slate-400 mt-1 block">
                  14 Savile Row, Suite 4B, Mayfair, London W1S 3JN, United Kingdom
                </span>
              </div>
              <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                International
              </span>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
            {t('customer.profile.saveProfile')}
          </Button>
        </div>
      </form>
    </div>
  );
};
