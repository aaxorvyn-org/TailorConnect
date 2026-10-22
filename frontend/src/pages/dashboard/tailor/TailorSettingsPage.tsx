import React, { useState } from 'react';
import { Settings, Save, Bell, Clock, ShieldCheck, DollarSign } from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input, Checkbox, Select } from '../../../components/common/FormFields';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from '../../../i18n';

export const TailorSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    defaultTurnaround: '14',
    consultationDeposit: '50',
    expressSurcharge: '120',
    measuringRadiusKm: '15',
    smsNotifications: true,
    emailDailyDigest: true,
    autoAcceptFittings: false,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      'success',
      'Atelier Settings Saved',
      'Operating constraints and client consultation rules updated.'
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Studio Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {t('tailor.settings.title', 'Atelier Operating Settings')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('tailor.settings.subtitle', 'Configure workshop lead times, booking policies, and automated client alerts.')}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSave}
          leftIcon={<Save className="w-3.5 h-3.5" />}
        >
          {t('common.save', 'Save Settings')}
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Production Lead Times &amp; Deposits
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Standard Turnaround (Days)"
              type="number"
              value={settings.defaultTurnaround}
              onChange={(e) => setSettings({ ...settings, defaultTurnaround: e.target.value })}
            />
            <Input
              label="Consultation Deposit ($)"
              type="number"
              value={settings.consultationDeposit}
              onChange={(e) => setSettings({ ...settings, consultationDeposit: e.target.value })}
            />
            <Input
              label="Express Rush Surcharge ($)"
              type="number"
              value={settings.expressSurcharge}
              onChange={(e) => setSettings({ ...settings, expressSurcharge: e.target.value })}
            />
            <Input
              label="Doorstep Service Radius (km)"
              type="number"
              value={settings.measuringRadiusKm}
              onChange={(e) => setSettings({ ...settings, measuringRadiusKm: e.target.value })}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              {t('tailor.settings.notifications', 'Notification & Client Communication')}
            </h3>
          </div>

          <div className="space-y-3">
            <Checkbox
              label="SMS Alerts for New Consultations"
              description="Receive instant SMS notifications on your registered atelier mobile phone."
              checked={settings.smsNotifications}
              onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
            />
            <Checkbox
              label="Daily Workshop Production Digest"
              description="Email summary of cutting and fitting milestones due tomorrow morning."
              checked={settings.emailDailyDigest}
              onChange={(e) => setSettings({ ...settings, emailDailyDigest: e.target.checked })}
            />
            <Checkbox
              label="Instant Auto-Accept Standard Fittings"
              description="Automatically reserve available fitting slots without manual cutter review."
              checked={settings.autoAcceptFittings}
              onChange={(e) => setSettings({ ...settings, autoAcceptFittings: e.target.checked })}
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
            {t('tailor.settings.saveSettings', 'Apply Atelier Settings')}
          </Button>
        </div>
      </form>
    </div>
  );
};
