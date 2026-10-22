import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  Sparkles, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea, Select } from '../../components/common/FormFields';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from '../../i18n';
import { appConfig } from '../../utils/env';

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'customOrder',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast(
        'success',
        t('contact.toastSuccess'),
        t('contact.toastSuccessDesc')
      );
      setFormData({
        name: '',
        email: '',
        phone: '',
        inquiryType: 'customOrder',
        message: '',
      });
    }, 1000);
  };

  const atelierOffices = [
    {
      city: t('contact.offices.office1City'),
      address: t('contact.offices.office1Address'),
      phone: '+91 40 2345 6789',
      hours: t('contact.offices.office1Hours'),
    },
    {
      city: t('contact.offices.office2City'),
      address: t('contact.offices.office2Address'),
      phone: '+91 22 2678 1234',
      hours: t('contact.offices.office2Hours'),
    },
    {
      city: t('contact.offices.office3City'),
      address: t('contact.offices.office3Address'),
      phone: '+91 866 245 8901',
      hours: t('contact.offices.office3Hours'),
    },
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          {t('contact.badge')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {t('contact.title')}
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {t('contact.formTitle')}
                </h3>
                <p className="text-xs text-slate-400">
                  {t('contact.formSubtitle')}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('contact.fullName')}
                  placeholder={t('contact.namePlaceholder')}
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label={t('contact.email')}
                  type="email"
                  placeholder={t('contact.emailPlaceholder')}
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('contact.phone')}
                  placeholder={t('contact.phonePlaceholder')}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Select
                  label={t('contact.inquiryType')}
                  value={formData.inquiryType}
                  onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                  options={[
                    { value: 'customOrder', label: t('contact.types.customOrder') },
                    { value: 'tailorPartner', label: t('contact.types.tailorPartner') },
                    { value: 'doorstep', label: t('contact.types.doorstep') },
                    { value: 'fabrics', label: t('contact.types.fabrics') },
                    { value: 'general', label: t('contact.types.general') },
                  ]}
                />
              </div>

              <Textarea
                label={t('contact.message')}
                rows={4}
                required
                placeholder={t('contact.messagePlaceholder')}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />

              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('contact.confidential')}</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  {isSubmitting ? t('contact.sending') : t('contact.sendBtn')}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Global Support Centers */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {t('contact.directLineTitle')}
            </h4>
            <p className="text-slate-400 leading-relaxed">
              {t('contact.directLineDesc')}
            </p>
            <div className="mt-3 flex items-center space-x-3 font-mono font-bold text-emerald-400">
              <Phone className="w-4 h-4" />
              <span>+91 98765 43210</span>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">
            {t('contact.supportCentersTitle')}
          </h3>

          {atelierOffices.map((office) => (
            <Card key={office.city} className="p-5 space-y-2">
              <h4 className="text-sm font-bold text-white tracking-tight">
                {office.city}
              </h4>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{office.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-mono">{office.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{office.hours}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
