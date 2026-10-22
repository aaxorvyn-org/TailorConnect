import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors, MapPin, Mail, Phone, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../hooks/useAuth';
import { appConfig } from '../../utils/env';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const getBrandHomePath = () => {
    if (!isAuthenticated || !user) return '/';
    if (user.role === 'CUSTOMER') return '/dashboard/customer';
    if (user.role === 'TAILOR') return '/dashboard/tailor';
    return '/dashboard/admin';
  };

  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950 text-slate-400 text-xs">
      {/* Top Banner */}
      <div className="border-b border-slate-900 bg-slate-900/40 py-8">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {t('footer.bannerTitle')}
              </h4>
              <p className="text-xs text-slate-400">
                {t('footer.bannerSubtitle')}
              </p>
            </div>
          </div>
          <Link
            to="/register-tailor"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs shadow-md transition-all shrink-0 dark:bg-white dark:text-zinc-950"
          >
            {t('footer.bannerBtn')}
          </Link>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to={getBrandHomePath()} className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 border border-zinc-700 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Scissors className="w-4 h-4 text-zinc-950 font-bold transform -rotate-45" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight group-hover:text-zinc-300 transition-colors">
                {appConfig.appName}
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {t('footer.desc')}
            </p>
            <div className="pt-2 flex items-center space-x-4 text-slate-400">
              <div className="flex items-center space-x-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-zinc-300" />
                <span>{t('footer.verifiedBadge')}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-zinc-300" />
                <span>{t('footer.guaranteeBadge')}</span>
              </div>
            </div>
          </div>

          {/* Column: Public Marketplace */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              {t('footer.colMarketplace')}
            </h5>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/tailors" className="hover:text-white transition-colors">
                  {t('nav.findTailors')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  {t('nav.services')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column: Dashboards */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              {t('footer.colPortals')}
            </h5>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard/customer" className="hover:text-white transition-colors">
                  {t('customer.sidebar.overview')}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/customer/nearby" className="hover:text-white transition-colors">
                  {t('customer.sidebar.nearby')}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/customer/orders" className="hover:text-white transition-colors">
                  {t('customer.sidebar.orders')}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/tailor" className="hover:text-white transition-colors">
                  {t('tailor.sidebar.dashboard')}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/admin" className="hover:text-white transition-colors">
                  {t('admin.nav.dashboard')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column: Contact & Concierge */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              {t('footer.colContact')}
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <span>12 Savile Row, Mayfair, London W1S 3PQ</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>concierge@threadcraft.luxury</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>+44 (0) 20 7946 0888</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 {appConfig.appName}. {t('footer.copyright')}</p>
          <div className="flex items-center space-x-4">
            <Link to="/about" className="hover:text-slate-300">Privacy Policy</Link>
            <Link to="/about" className="hover:text-slate-300">Terms of Bespoke Service</Link>
            <Link to="/contact" className="hover:text-slate-300">Security</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

