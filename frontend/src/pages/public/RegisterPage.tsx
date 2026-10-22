import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  User,
  Store,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Building,
  Scissors,
  Check,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea, Select, Checkbox } from '../../components/common/FormFields';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { appConfig } from '../../utils/env';
import type { UserRole } from '../../types/auth';

type RegisterRole = 'CUSTOMER' | 'TAILOR' | 'ADMIN';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = (searchParams.get('role')?.toUpperCase() as RegisterRole) || 'CUSTOMER';
  const [selectedRole, setSelectedRole] = useState<RegisterRole>(
    ['CUSTOMER', 'TAILOR', 'ADMIN'].includes(initialRole) ? initialRole : 'CUSTOMER'
  );

  const { register, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const getUserDashboardPath = () => {
    if (!user) return '/dashboard/customer';
    if (user.role === 'CUSTOMER') return '/dashboard/customer';
    if (user.role === 'TAILOR') return '/dashboard/tailor';
    return '/dashboard/admin';
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getUserDashboardPath(), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Tailor-specific States
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [experienceYears, setExperienceYears] = useState('8');
  const [startingPrice, setStartingPrice] = useState('250');
  const [turnaroundDays, setTurnaroundDays] = useState('10');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState({
    suits: true,
    festive: true,
    bridal: false,
    alterations: true,
    traditional: false,
    shirts: false,
  });

  // Admin-specific States
  const [department, setDepartment] = useState('deptOperations');
  const [adminSecret, setAdminSecret] = useState('threadcraft_admin_2026');

  // UI state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleRoleChange = (role: RegisterRole) => {
    setSelectedRole(role);
    setFormError(null);
    setSearchParams({ role: role.toLowerCase() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Common validations
    if (fullName.trim().length < 2) {
      setFormError(t('tailorRegister.validation.masterMinChars', 'Full name must contain at least 2 characters.'));
      return;
    }
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setFormError(t('tailorRegister.validation.emailInvalid', 'Please enter a valid email address.'));
      return;
    }
    if (password.length < 8) {
      setFormError(t('tailorRegister.validation.passMinChars', 'Password must be at least 8 characters.'));
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setFormError(t('tailorRegister.validation.passAlphaNum', 'Password must include both letters and numbers.'));
      return;
    }
    if (password !== confirmPassword) {
      setFormError(t('tailorRegister.validation.passMismatch', 'Passwords do not match.'));
      return;
    }

    // Role-specific validations
    if (selectedRole === 'TAILOR') {
      if (!shopName.trim()) {
        setFormError(t('tailorRegister.validation.shopRequired', 'Shop name is required.'));
        return;
      }
      if (!city.trim()) {
        setFormError('City / Area location is required for tailor shop discovery.');
        return;
      }
      if (!agreeTerms) {
        setFormError(t('tailorRegister.validation.agreeRequired', 'Please accept the platform quality oath to continue.'));
        return;
      }
    }

    if (selectedRole === 'ADMIN') {
      if (!adminSecret.trim()) {
        setFormError('Admin master passcode is required for administrative registration.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formattedSpecialties =
        selectedRole === 'TAILOR'
          ? Object.entries(specialties)
              .filter(([_, val]) => val)
              .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
              .join(', ')
          : undefined;

      const newUser = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role: selectedRole,
        shop_name: selectedRole === 'TAILOR' ? shopName.trim() : undefined,
        city: city.trim() || undefined,
        address: selectedRole === 'TAILOR' ? shopAddress.trim() : undefined,
        experience_years: selectedRole === 'TAILOR' ? parseInt(experienceYears, 10) || 0 : undefined,
        specialties: formattedSpecialties,
        currency,
        admin_secret: selectedRole === 'ADMIN' ? adminSecret.trim() : undefined,
      });

      // Role-specific toast & redirect
      if (selectedRole === 'CUSTOMER') {
        showToast('success', t('registration.successCustomer'), `${newUser.full_name}`);
        navigate('/dashboard/customer', { replace: true });
      } else if (selectedRole === 'TAILOR') {
        showToast('success', t('registration.successTailor'), `${newUser.shop_name || newUser.full_name}`);
        navigate('/dashboard/tailor', { replace: true });
      } else {
        showToast('success', t('registration.successAdmin'), `${newUser.full_name}`);
        navigate('/dashboard/admin', { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || t('common.error', 'An error occurred during registration.');
      setFormError(msg);
      showToast('error', t('common.error'), msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Brand & Page Header */}
      <div className="text-center space-y-3">
        <Link to={isAuthenticated ? getUserDashboardPath() : '/'} className="inline-flex items-center space-x-2 text-white group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-all">
            <Scissors className="w-5 h-5 text-slate-950 transform -rotate-45 font-bold" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight">ThreadCraft</span>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {t('registration.pageTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          {t('registration.pageSubtitle')}
        </p>
      </div>

      {/* Role Selector Tabs: Customer / Tailor / Admin */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <button
          type="button"
          onClick={() => handleRoleChange('CUSTOMER')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            selectedRole === 'CUSTOMER'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold ring-1 ring-emerald-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>{t('registration.tabCustomer')}</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('TAILOR')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            selectedRole === 'TAILOR'
              ? 'bg-indigo-500 text-white shadow-md font-extrabold ring-1 ring-indigo-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Store className="w-4 h-4 shrink-0" />
          <span>{t('registration.tabTailor')}</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('ADMIN')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            selectedRole === 'ADMIN'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold ring-1 ring-amber-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{t('registration.tabAdmin')}</span>
        </button>
      </div>

      {/* Global Error Banner */}
      {formError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-300 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div className="leading-relaxed">{formError}</div>
        </div>
      )}

      {/* Form Shell */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ================================================================= */}
        {/* 1. CUSTOMER REGISTRATION FORM */}
        {/* ================================================================= */}
        {selectedRole === 'CUSTOMER' && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {t('registration.customerTitle')}
                </h3>
                <p className="text-xs text-slate-400">
                  {t('registration.customerSubtitle')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('registration.fullName')}
                placeholder={t('registration.fullNamePlaceholder')}
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4 text-emerald-400" />}
              />
              <Input
                label={t('registration.email')}
                type="email"
                placeholder={t('registration.emailPlaceholder')}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-emerald-400" />}
              />
              <Input
                label={t('registration.phone')}
                type="tel"
                placeholder={t('registration.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4 text-emerald-400" />}
              />
              <Input
                label={t('registration.city')}
                placeholder={t('registration.cityPlaceholder')}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4 text-emerald-400" />}
              />
              <Input
                label={t('registration.password')}
                type="password"
                placeholder={t('registration.passwordPlaceholder')}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-emerald-400" />}
              />
              <Input
                label={t('registration.confirmPassword')}
                type="password"
                placeholder={t('registration.confirmPasswordPlaceholder')}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-emerald-400" />}
              />
            </div>

            {/* Realtime password checklist */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
              <span className="font-semibold text-slate-300 block mb-1">
                {t('tailorRegister.securityChecklist')}
              </span>
              <div className={`flex items-center space-x-1.5 ${password.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('registration.reqLength')}</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${/[A-Za-z]/.test(password) && /[0-9]/.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('registration.reqAlphaNum')}</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${password && password === confirmPassword ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('registration.reqMatch')}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting ? t('registration.submitting') : t('registration.submitCustomer')}
            </Button>
          </Card>
        )}

        {/* ================================================================= */}
        {/* 2. TAILOR SHOP REGISTRATION FORM */}
        {/* ================================================================= */}
        {selectedRole === 'TAILOR' && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {t('registration.tailorTitle')}
                </h3>
                <p className="text-xs text-slate-400">
                  {t('registration.tailorSubtitle')}
                </p>
              </div>
            </div>

            {/* Shop & Master Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('registration.shopName')}
                placeholder={t('registration.shopNamePlaceholder')}
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                leftIcon={<Building className="w-4 h-4 text-indigo-400" />}
              />
              <Input
                label={t('registration.fullName')}
                placeholder={t('registration.fullNamePlaceholder')}
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4 text-indigo-400" />}
              />
              <Input
                label={t('registration.email')}
                type="email"
                placeholder={t('registration.emailPlaceholder')}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-indigo-400" />}
              />
              <Input
                label={t('registration.phone')}
                type="tel"
                placeholder={t('registration.phonePlaceholder')}
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4 text-indigo-400" />}
              />
              <Input
                label={t('registration.city')}
                placeholder={t('registration.cityPlaceholder')}
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4 text-indigo-400" />}
              />
              <Input
                label={t('registration.address')}
                placeholder={t('registration.addressPlaceholder')}
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
              />
              <Input
                label={t('registration.experienceYears')}
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
              />
              <Input
                label={t('registration.turnaroundDays')}
                type="number"
                value={turnaroundDays}
                onChange={(e) => setTurnaroundDays(e.target.value)}
              />
            </div>

            {/* Garment Specialties Checkboxes */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                {t('registration.specialties')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'suits', label: t('categories.suits', 'Suits & Blazers') },
                  { key: 'festive', label: t('categories.tuxedos', 'Festive & Party') },
                  { key: 'bridal', label: t('categories.bridal', 'Bridal & Blouses') },
                  { key: 'alterations', label: t('categories.alterations', 'Alterations') },
                  { key: 'traditional', label: t('categories.sherwanis', 'Sherwanis & Kurtas') },
                  { key: 'shirts', label: t('categories.linen', 'Shirts & Pants') },
                ].map((spec) => (
                  <div
                    key={spec.key}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      id={`spec-${spec.key}`}
                      checked={(specialties as any)[spec.key]}
                      onChange={(e) =>
                        setSpecialties({
                          ...specialties,
                          [spec.key]: e.target.checked,
                        })
                      }
                      className="rounded bg-slate-800 text-indigo-500 border-slate-700"
                    />
                    <label htmlFor={`spec-${spec.key}`} className="text-xs text-slate-200 cursor-pointer">
                      {spec.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Textarea
              label={t('registration.bio')}
              rows={3}
              placeholder={t('registration.bioPlaceholder')}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('registration.password')}
                type="password"
                placeholder={t('registration.passwordPlaceholder')}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-indigo-400" />}
              />
              <Input
                label={t('registration.confirmPassword')}
                type="password"
                placeholder={t('registration.confirmPasswordPlaceholder')}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-indigo-400" />}
              />
            </div>

            <Checkbox
              label={t('registration.agreeTerms')}
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full shadow-lg"
              isLoading={isSubmitting}
              leftIcon={<Store className="w-4 h-4" />}
            >
              {isSubmitting ? t('registration.submitting') : t('registration.submitTailor')}
            </Button>
          </Card>
        )}

        {/* ================================================================= */}
        {/* 3. ADMIN REGISTRATION FORM */}
        {/* ================================================================= */}
        {selectedRole === 'ADMIN' && (
          <Card className="p-6 sm:p-8 space-y-6 border-amber-500/20">
            <div className="pb-4 border-b border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {t('registration.adminTitle')}
                </h3>
                <p className="text-xs text-slate-400">
                  {t('registration.adminSubtitle')}
                </p>
              </div>
            </div>

            {/* Admin Key Notice Banner */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-amber-200 text-xs">
              <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-bold block mb-0.5">Admin Security Passcode Active</span>
                <span>{t('registration.adminKeyHelp')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('registration.fullName')}
                placeholder="e.g. Vikram Rao (Admin)"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4 text-amber-400" />}
              />
              <Input
                label={t('registration.email')}
                type="email"
                placeholder="admin@threadcraft.luxury"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-amber-400" />}
              />
              <Input
                label={t('registration.phone')}
                type="tel"
                placeholder="+91 98765 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4 text-amber-400" />}
              />
              <Select
                label={t('registration.department')}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={[
                  { value: 'deptOperations', label: t('registration.deptOperations') },
                  { value: 'deptQuality', label: t('registration.deptQuality') },
                  { value: 'deptSuper', label: t('registration.deptSuper') },
                ]}
              />
            </div>

            {/* Security Passcode Field */}
            <Input
              label={t('registration.adminKey')}
              type="password"
              placeholder={t('registration.adminKeyPlaceholder')}
              required
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4 text-amber-400" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('registration.password')}
                type="password"
                placeholder={t('registration.passwordPlaceholder')}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-amber-400" />}
              />
              <Input
                label={t('registration.confirmPassword')}
                type="password"
                placeholder={t('registration.confirmPasswordPlaceholder')}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-amber-400" />}
              />
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full shadow-lg"
              isLoading={isSubmitting}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              {isSubmitting ? t('registration.submitting') : t('registration.submitAdmin')}
            </Button>
          </Card>
        )}
      </form>

      {/* Footer Switcher */}
      <div className="text-center space-y-2 pt-2">
        <p className="text-xs text-slate-400">
          {t('registration.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-emerald-400 font-bold hover:underline">
            {t('registration.signInHere')}
          </Link>
        </p>
      </div>
    </div>
  );
};
