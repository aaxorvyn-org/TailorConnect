import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Scissors, 
  Sparkles, 
  Ruler, 
  HeartHandshake, 
  CheckCircle2, 
  Leaf,
  ArrowRight
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useTranslation } from '../../i18n';
import { appConfig } from '../../utils/env';

export const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  const pillars = [
    {
      title: t('about.pillar1Title'),
      desc: t('about.pillar1Desc'),
      icon: <Scissors className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: t('about.pillar2Title'),
      desc: t('about.pillar2Desc'),
      icon: <Ruler className="w-5 h-5 text-amber-400" />,
    },
    {
      title: t('about.pillar3Title'),
      desc: t('about.pillar3Desc'),
      icon: <Leaf className="w-5 h-5 text-teal-400" />,
    },
    {
      title: t('about.pillar4Title'),
      desc: t('about.pillar4Desc'),
      icon: <HeartHandshake className="w-5 h-5 text-indigo-400" />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Banner */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-900 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('about.badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {t('about.heroTitle')}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t('about.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {t('about.visionBadge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {t('about.visionTitle')}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('about.visionP1')}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('about.visionP2')}
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t('about.check1')}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t('about.check2')}</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden glass-panel border border-slate-800 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80"
              alt="Tailor cutting pattern"
              className="w-full h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs">
              <p className="font-semibold text-white">{t('about.masterBenchTitle')}</p>
              <p className="text-slate-400 mt-0.5">{t('about.masterBenchSubtitle')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars */}
      <section className="bg-slate-900/40 border-y border-slate-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              {t('about.pillarsBadge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              {t('about.pillarsTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((pillar) => (
              <Card key={pillar.title} hoverEffect className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center">
                  {pillar.icon}
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {pillar.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {t('about.ctaTitle')}
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          {t('about.ctaSubtitle')}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link to="/tailors">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {t('about.findTailorBtn')}
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline" size="md">
              {t('about.contactUsBtn')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
