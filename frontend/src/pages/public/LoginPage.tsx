import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Scissors, 
  User, 
  Store, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight,
  Sparkles,
  Phone,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  LogIn
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input, Checkbox } from '../../components/common/FormFields';
import { Card } from '../../components/common/Card';
import { ForgotPasswordModal } from '../../components/shared/ForgotPasswordModal';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { appConfig } from '../../utils/env';
import type { UserRole } from '../../types/auth';

type AuthMode = 'login' | 'register';
type LoginRoleTab = 'customer' | 'tailor' | 'admin';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { login, register, isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);

  // If already authenticated, redirect to appropriate workspace dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'CUSTOMER') navigate('/dashboard/customer', { replace: true });
      else if (user.role === 'TAILOR') navigate('/dashboard/tailor', { replace: true });
      else if (user.role === 'ADMIN') navigate('/dashboard/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Mode: Sign In or Register (Customer)
  const [mode, setMode] = useState<AuthMode>('login');

  // Login state
  const [roleTab, setRoleTab] = useState<LoginRoleTab>('customer');
  const [loginEmail, setLoginEmail] = useState('alexander.hayes@mayfair.co.uk');
  const [loginPassword, setLoginPassword] = useState('Password123');
  const [rememberMe, setRememberMe] = useState(true);

  // Registration state (Customer)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // UI state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email format regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Destination route after login
  const fromPath = (location.state as any)?.from?.pathname;

  const handleRoleTabChange = (newRole: LoginRoleTab) => {
    setRoleTab(newRole);
    setFormError(null);
    if (newRole === 'customer') {
      setLoginEmail('alexander.hayes@mayfair.co.uk');
      setLoginPassword('Password123');
    } else if (newRole === 'tailor') {
      setLoginEmail('master.vance@vanceatelier.com');
      setLoginPassword('Password123');
    } else {
      setLoginEmail('admin@threadcraft.luxury');
      setLoginPassword('Password123');
    }
  };

  // Quick sign-in helper with specific credentials
  const handleQuickLogin = async (email: string, role: UserRole) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const loggedUser = await login({ email, password: 'Password123' });
      showToast(
        'success',
        `${loggedUser.full_name}`,
        `${loggedUser.role}`
      );

      if (fromPath) {
        navigate(fromPath, { replace: true });
      } else if (role === 'CUSTOMER') {
        navigate('/dashboard/customer', { replace: true });
      } else if (role === 'TAILOR') {
        navigate('/dashboard/tailor', { replace: true });
      } else {
        navigate('/dashboard/admin', { replace: true });
      }
    } catch (err: any) {
      setFormError(err.message || t('common.error'));
      showToast('error', t('common.error'), err.message || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Frontend validation
    if (!loginEmail.trim()) {
      setFormError(t('auth.validation.enterEmail'));
      return;
    }
    if (!emailRegex.test(loginEmail.trim())) {
      setFormError(t('auth.validation.validEmail'));
      return;
    }
    if (!loginPassword) {
      setFormError(t('auth.validation.enterPassword'));
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      showToast(
        'success',
        `${loggedUser.full_name}`,
        `${loggedUser.role}`
      );

      // Determine redirect destination
      if (fromPath) {
        navigate(fromPath, { replace: true });
      } else if (loggedUser.role === 'CUSTOMER') {
        navigate('/dashboard/customer', { replace: true });
      } else if (loggedUser.role === 'TAILOR') {
        navigate('/dashboard/tailor', { replace: true });
      } else {
        navigate('/dashboard/admin', { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || t('common.error');
      setFormError(msg);
      showToast('error', t('common.error'), msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Customer Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Frontend validation
    if (regFullName.trim().length < 2) {
      setFormError(t('auth.validation.nameMinChars'));
      return;
    }
    if (!regEmail.trim()) {
      setFormError(t('auth.validation.enterEmail'));
      return;
    }
    if (!emailRegex.test(regEmail.trim())) {
      setFormError(t('auth.validation.validEmail'));
      return;
    }
    if (regPassword.length < 8) {
      setFormError(t('auth.validation.passMinChars'));
      return;
    }
    if (!/[A-Za-z]/.test(regPassword) || !/[0-9]/.test(regPassword)) {
      setFormError(t('auth.validation.passLetterNum'));
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setFormError(t('auth.validation.passMismatch'));
      return;
    }

    setIsSubmitting(true);
    try {
      const registeredUser = await register({
        full_name: regFullName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim() || undefined,
        password: regPassword,
        role: 'CUSTOMER',
      });

      showToast(
        'success',
        t('common.success'),
        `${registeredUser.full_name}`
      );

      navigate('/dashboard/customer', { replace: true });
    } catch (err: any) {
      const msg = err.message || t('common.error');
      setFormError(msg);
      showToast('error', t('common.error'), msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleDisplayName = (role: LoginRoleTab) => {
    if (role === 'customer') return t('auth.roleCustomer');
    if (role === 'tailor') return t('auth.roleTailor');
    return t('auth.roleAdmin');
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-14">
      <div className="max-w-md w-full space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40">
              <Scissors className="w-5 h-5 transform -rotate-45" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">
              {appConfig.appName}
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login'
              ? t('auth.loginSubtitle')
              : t('auth.registerSubtitle')}
          </p>
        </div>

        {/* Mode Switcher: Sign In vs Sign Up */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setFormError(null);
            }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t('auth.signInTab')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setFormError(null);
            }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t('auth.registerCustomerTab')}</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {formError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="leading-relaxed">{formError}</div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <>
            {/* Role Selection Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => handleRoleTabChange('customer')}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg font-medium transition-all ${
                  roleTab === 'customer'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{t('auth.roleCustomer')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('tailor')}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg font-medium transition-all ${
                  roleTab === 'tailor'
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>{t('auth.roleTailor')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('admin')}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg font-medium transition-all ${
                  roleTab === 'admin'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('auth.roleAdmin')}</span>
              </button>
            </div>

            {/* Login Card */}
            <Card className="p-6 sm:p-8 space-y-5">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <Input
                  label={t('auth.email')}
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  leftIcon={<Mail className="w-4 h-4 text-emerald-400" />}
                />

                <Input
                  label={t('auth.password')}
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  leftIcon={<Lock className="w-4 h-4 text-emerald-400" />}
                />

                <div className="flex items-center justify-between text-xs">
                  <Checkbox
                    label={t('auth.rememberMe')}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-emerald-400 hover:underline cursor-pointer font-medium"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {t('auth.signInAsRole', { role: getRoleDisplayName(roleTab) })}
                </Button>
              </form>

              {/* Instant One-Click Demo Role Logins */}
              <div className="pt-4 border-t border-slate-800 text-center space-y-2.5">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                  {t('auth.quickDemoLogin')}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() =>
                      handleQuickLogin('alexander.hayes@mayfair.co.uk', 'CUSTOMER')
                    }
                    className="text-xs py-1.5 px-2 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    {t('auth.roleCustomer')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() =>
                      handleQuickLogin('master.vance@vanceatelier.com', 'TAILOR')
                    }
                    className="text-xs py-1.5 px-2 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10"
                  >
                    {t('auth.roleTailor')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() =>
                      handleQuickLogin('admin@threadcraft.luxury', 'ADMIN')
                    }
                    className="text-xs py-1.5 px-2 text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                  >
                    {t('auth.roleAdmin')}
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* CUSTOMER REGISTRATION FORM */}
        {mode === 'register' && (
          <Card className="p-6 sm:p-8 space-y-5">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white tracking-tight">
                {t('auth.newCustomerAccount')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('auth.newCustomerSubtitle')}
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <Input
                label={t('auth.fullName')}
                placeholder={t('auth.fullNamePlaceholder')}
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                required
                leftIcon={<User className="w-4 h-4 text-emerald-400" />}
              />

              <Input
                label={t('auth.email')}
                type="email"
                placeholder={t('auth.emailRegPlaceholder')}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4 text-emerald-400" />}
              />

              <Input
                label={t('auth.phoneOptional')}
                type="tel"
                placeholder={t('auth.phonePlaceholder')}
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4 text-emerald-400" />}
              />

              <Input
                label={t('auth.password')}
                type="password"
                placeholder={t('auth.passwordReqPlaceholder')}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4 text-emerald-400" />}
              />

              <Input
                label={t('auth.confirmPassword')}
                type="password"
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4 text-emerald-400" />}
              />

              {/* Real-time Password Requirements Checklist */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                <span className="font-semibold text-slate-300 block mb-1">
                  {t('auth.passwordRequirements')}
                </span>
                <div
                  className={`flex items-center space-x-1.5 ${
                    regPassword.length >= 8 ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('auth.reqMinChars')}</span>
                </div>
                <div
                  className={`flex items-center space-x-1.5 ${
                    /[A-Za-z]/.test(regPassword) && /[0-9]/.test(regPassword)
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('auth.reqLettersNumbers')}</span>
                </div>
                <div
                  className={`flex items-center space-x-1.5 ${
                    regPassword && regPassword === regConfirmPassword
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('auth.reqMatch')}</span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t('auth.createAccountBtn')}
              </Button>
            </form>
          </Card>
        )}

        {/* Footer: Tailor Onboarding Link */}
        <div className="text-center text-xs text-slate-400 pt-2">
          {t('auth.tailorQuestion')}{' '}
          <Link
            to="/register-tailor"
            className="text-emerald-400 font-semibold hover:underline inline-flex items-center space-x-1"
          >
            <span>{t('auth.registerAsAtelier')}</span>
            <Sparkles className="w-3 h-3 ml-0.5 text-amber-400" />
          </Link>
        </div>

      </div>

      {/* Real Functional Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={loginEmail}
        onSuccess={(newPwd, resetEmail) => {
          setLoginEmail(resetEmail);
          setLoginPassword(newPwd);
          setFormError(null);
        }}
      />
    </div>
  );
};

