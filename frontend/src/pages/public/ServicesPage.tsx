import React, { useState } from 'react';
import { 
  Scissors, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle,
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import { mockServices } from '../../mock';
import type { ServiceOffering } from '../../mock/services';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { BookAppointmentModal } from '../../components/shared/BookAppointmentModal';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from '../../i18n';

export const ServicesPage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [selectedService, setSelectedService] = useState<ServiceOffering | null>(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);

  const handleInquire = (service: ServiceOffering) => {
    setSelectedService(service);
    setInquiryModalOpen(true);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryModalOpen(false);
    showToast(
      'success',
      t('servicesPage.successToast'),
      t('servicesPage.successToastDesc', { serviceTitle: selectedService?.title || '' })
    );
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          {t('servicesPage.badge')}
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          {t('servicesPage.title')}
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          {t('servicesPage.subtitle')}
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockServices.map((service) => (
          <div
            key={service.id}
            className="glass-panel rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 flex flex-col justify-between group hover:border-slate-700 hover:shadow-2xl hover:shadow-emerald-950/20 transition-all duration-300"
          >
            <div>
              <div className="h-52 w-full overflow-hidden relative">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
                  {t('servicesPage.startsAt', { price: String(service.priceFrom) })}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {service.detailedDesc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    {t('servicesPage.serviceStandards')}
                  </span>
                  {service.features.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 border-t border-slate-800/60 mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{service.estimatedTimeline}</span>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleInquire(service)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {t('servicesPage.requestQuote')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Service Appointment Booking Modal */}
      <BookAppointmentModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        initialGarmentType={selectedService?.title}
      />
    </div>
  );
};
