import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldCheck, 
  FileCheck, 
  Lock, 
  Mail, 
  User, 
  Building, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input, Textarea, Checkbox } from '../../components/common/FormFields';
import { Card } from '../../components/common/Card';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';

export const TailorRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { register } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    shopName: '',
    masterName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    area: '',
    experienceYears: '10',
    startingPrice: '250',
    turnaroundDays: '14',
    bio: '',
    portfolioLink: '',
    specialties: {
      suits: true,
      tuxedos: true,
      bridal: false,
      alterations: false,
      traditional: false,
      denim: false,
    },
    agreeTerms: false,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Frontend validation
    if (!formData.shopName.trim()) {
      setFormError(t('tailorRegister.validation.shopRequired'));
      return;
    }
    if (formData.masterName.trim().length < 2) {
      setFormError(t('tailorRegister.validation.masterMinChars'));
      return;
    }
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setFormError(t('tailorRegister.validation.emailInvalid'));
      return;
    }
    if (formData.password.length < 8) {
      setFormError(t('tailorRegister.validation.passMinChars'));
      return;
    }
    if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setFormError(t('tailorRegister.validation.passAlphaNum'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError(t('tailorRegister.validation.passMismatch'));
      return;
    }
    if (!formData.agreeTerms) {
      setFormError(t('tailorRegister.validation.agreeRequired'));
      showToast('error', t('common.error'), t('tailorRegister.validation.agreeRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const specialtiesFormatted = Object.entries(formData.specialties)
        .filter(([_, val]) => val)
        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
        .join(', ');

      const newTailor = await register({
        full_name: formData.masterName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        role: 'TAILOR',
        shop_name: formData.shopName.trim(),
        city: formData.city.trim() || undefined,
        experience_years: parseInt(formData.experienceYears, 10) || 0,
        specialties: specialtiesFormatted || undefined,
      });

      showToast(
        'success',
        t('common.success'),
        `${newTailor.full_name}`
      );
      navigate('/dashboard/tailor', { replace: true });
    } catch (err: any) {
      const msg = err.message || t('common.error');
      setFormError(msg);
      showToast('error', t('common.error'), msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      {/* Page Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('tailorRegister.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {t('tailorRegister.title')}
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          {t('tailorRegister.subtitle')}
        </p>
      </div>

      {formError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div className="leading-relaxed">{formError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Atelier Details */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t('tailorRegister.step1Title')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('tailorRegister.step1Subtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('tailorRegister.shopName')}
              placeholder={t('tailorRegister.shopNamePlaceholder')}
              required
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              leftIcon={<Building className="w-4 h-4 text-emerald-400" />}
            />
            <Input
              label={t('tailorRegister.masterName')}
              placeholder={t('tailorRegister.masterNamePlaceholder')}
              required
              value={formData.masterName}
              onChange={(e) => setFormData({ ...formData, masterName: e.target.value })}
              leftIcon={<User className="w-4 h-4 text-emerald-400" />}
            />
            <Input
              label={t('tailorRegister.businessEmail')}
              type="email"
              placeholder={t('tailorRegister.emailPlaceholder')}
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              leftIcon={<Mail className="w-4 h-4 text-emerald-400" />}
            />
            <Input
              label={t('tailorRegister.phone')}
              type="tel"
              placeholder={t('tailorRegister.phonePlaceholder')}
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label={t('tailorRegister.password')}
              type="password"
              placeholder={t('tailorRegister.passwordPlaceholder')}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              leftIcon={<Lock className="w-4 h-4 text-emerald-400" />}
            />
            <Input
              label={t('tailorRegister.confirmPassword')}
              type="password"
              placeholder={t('tailorRegister.confirmPasswordPlaceholder')}
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              leftIcon={<Lock className="w-4 h-4 text-emerald-400" />}
            />
            <Input
              label={t('tailorRegister.city')}
              placeholder={t('tailorRegister.cityPlaceholder')}
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label={t('tailorRegister.address')}
              placeholder={t('tailorRegister.addressPlaceholder')}
              required
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
          </div>

          {/* Password Validation Checklist */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
            <span className="font-semibold text-slate-300 block mb-1">
              {t('tailorRegister.securityChecklist')}
            </span>
            <div
              className={`flex items-center space-x-1.5 ${
                formData.password.length >= 8 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('tailorRegister.reqLength')}</span>
            </div>
            <div
              className={`flex items-center space-x-1.5 ${
                /[A-Za-z]/.test(formData.password) && /[0-9]/.test(formData.password)
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('tailorRegister.reqAlphaNum')}</span>
            </div>
            <div
              className={`flex items-center space-x-1.5 ${
                formData.password && formData.password === formData.confirmPassword
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('tailorRegister.reqMatch')}</span>
            </div>
          </div>
        </Card>

        {/* Section 2: Craft & Capabilities */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t('tailorRegister.step2Title')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('tailorRegister.step2Subtitle')}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              {t('tailorRegister.specialtiesLabel')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'suits', label: t('tailorRegister.specs.suits') },
                { key: 'tuxedos', label: t('tailorRegister.specs.tuxedos') },
                { key: 'bridal', label: t('tailorRegister.specs.bridal') },
                { key: 'alterations', label: t('tailorRegister.specs.alterations') },
                { key: 'traditional', label: t('tailorRegister.specs.traditional') },
                { key: 'denim', label: t('tailorRegister.specs.denim') },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    id={`spec-${item.key}`}
                    checked={(formData.specialties as any)[item.key]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialties: {
                          ...formData.specialties,
                          [item.key]: e.target.checked,
                        },
                      })
                    }
                    className="rounded bg-slate-800 text-emerald-500 border-slate-700"
                  />
                  <label htmlFor={`spec-${item.key}`} className="text-xs text-slate-200 cursor-pointer">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Input
              label={t('tailorRegister.experienceYears')}
              type="number"
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
            />
            <Input
              label={t('tailorRegister.startingPrice')}
              type="number"
              value={formData.startingPrice}
              onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
            />
            <Input
              label={t('tailorRegister.turnaroundDays')}
              type="number"
              value={formData.turnaroundDays}
              onChange={(e) => setFormData({ ...formData, turnaroundDays: e.target.value })}
            />
          </div>

          <Textarea
            label={t('tailorRegister.bio')}
            placeholder={t('tailorRegister.bioPlaceholder')}
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          />

          <Input
            label={t('tailorRegister.portfolioLink')}
            placeholder={t('tailorRegister.portfolioPlaceholder')}
            value={formData.portfolioLink}
            onChange={(e) => setFormData({ ...formData, portfolioLink: e.target.value })}
          />
        </Card>

        {/* Section 3: Standards & Submission */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t('tailorRegister.step3Title')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('tailorRegister.step3Subtitle')}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-850 space-y-2 text-xs text-slate-300">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('tailorRegister.oathTitle')}</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              {t('tailorRegister.oathDesc')}
            </p>
          </div>

          <Checkbox
            label={t('tailorRegister.agreeTerms')}
            description={t('tailorRegister.reviewNotice')}
            checked={formData.agreeTerms}
            onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
          />

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/login" className="text-xs text-slate-400 hover:text-white">
              {t('tailorRegister.alreadyRegistered')}{' '}
              <span className="text-emerald-400 underline">{t('tailorRegister.signInLink')}</span>
            </Link>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              isLoading={isSubmitting}
              leftIcon={<FileCheck className="w-4 h-4" />}
            >
              {isSubmitting ? t('tailorRegister.submitting') : t('tailorRegister.submitBtn')}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

