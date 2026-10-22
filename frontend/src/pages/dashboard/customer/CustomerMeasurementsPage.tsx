import React, { useState, useEffect, useCallback } from 'react';
import {
  Ruler,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Scissors,
  Layers,
  Info,
  Calendar,
  X,
  FileText,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input, Textarea } from '../../../components/common/FormFields';
import { Modal } from '../../../components/common/Modal';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../hooks/useAuth';
import { measurementService } from '../../../services/measurementService';
import { useTranslation } from '../../../i18n';
import type {
  CustomerMeasurement,
  MeasurementTemplateSummary,
  MeasurementTemplateDetail,
  MeasurementField,
  CustomerMeasurementCreatePayload,
  CustomerMeasurementUpdatePayload,
} from '../../../types/measurement';

export const CustomerMeasurementsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();

  // State: Measurements list & Templates
  const [measurements, setMeasurements] = useState<CustomerMeasurement[]>([]);
  const [templates, setTemplates] = useState<MeasurementTemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGarmentFilter, setSelectedGarmentFilter] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Active items for View / Edit / Delete
  const [activeMeasurement, setActiveMeasurement] = useState<CustomerMeasurement | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dynamic Form State for Add / Edit
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTemplateDetail, setSelectedTemplateDetail] = useState<MeasurementTemplateDetail | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState<boolean>(false);

  // Form input fields
  const [formProfileName, setFormProfileName] = useState<string>('');
  const [formUnit, setFormUnit] = useState<'inches' | 'cm'>('inches');
  const [formNotes, setFormNotes] = useState<string>('');
  // Map of field_id -> numeric string value
  const [fieldValues, setFieldValues] = useState<Record<number, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [generalFormError, setGeneralFormError] = useState<string | null>(null);

  /**
   * Fetch templates and customer measurements from backend API
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedTemplates, fetchedMeasurements] = await Promise.all([
        measurementService.getTemplates(),
        measurementService.getCustomerMeasurements(),
      ]);
      setTemplates(fetchedTemplates);
      setMeasurements(fetchedMeasurements);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to measurements API';
      setError(msg);
      showToast('error', 'API Connection Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * When user selects a garment template, dynamically query the backend for template fields
   */
  const handleSelectTemplate = async (templateId: number) => {
    setSelectedTemplateId(templateId);
    setIsLoadingTemplate(true);
    setFieldErrors({});
    setGeneralFormError(null);
    try {
      const detail = await measurementService.getTemplateById(templateId);
      setSelectedTemplateDetail(detail);

      // Pre-fill default profile name if empty
      if (!formProfileName) {
        setFormProfileName(`My Bespoke ${detail.name}`);
      }

      // Initialize empty field values
      const initialValues: Record<number, string> = {};
      detail.fields.forEach((field) => {
        initialValues[field.id] = '';
      });
      setFieldValues(initialValues);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch garment fields';
      setGeneralFormError(msg);
      showToast('error', 'Template Error', msg);
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  /**
   * Open the Add Measurement modal
   */
  const handleOpenAddModal = () => {
    setFormProfileName('');
    setFormUnit('inches');
    setFormNotes('');
    setFieldValues({});
    setFieldErrors({});
    setGeneralFormError(null);
    setSelectedTemplateDetail(null);

    // If templates exist, select first one automatically
    if (templates.length > 0) {
      const firstId = templates[0].id;
      setSelectedTemplateId(firstId);
      handleSelectTemplate(firstId);
    } else {
      setSelectedTemplateId(null);
    }

    setIsAddModalOpen(true);
  };

  /**
   * Open the View modal
   */
  const handleOpenViewModal = (measurement: CustomerMeasurement) => {
    setActiveMeasurement(measurement);
    setIsViewModalOpen(true);
  };

  /**
   * Open the Edit modal and populate fields
   */
  const handleOpenEditModal = async (measurement: CustomerMeasurement) => {
    setActiveMeasurement(measurement);
    setFormProfileName(measurement.measurement_name);
    setFormUnit(measurement.unit === 'cm' ? 'cm' : 'inches');
    setFormNotes(measurement.notes || '');
    setFieldErrors({});
    setGeneralFormError(null);
    setSelectedTemplateId(measurement.template_id);
    setIsLoadingTemplate(true);
    setIsEditModalOpen(true);

    try {
      const detail = await measurementService.getTemplateById(measurement.template_id);
      setSelectedTemplateDetail(detail);

      // Populate existing values
      const existingValuesMap: Record<number, string> = {};
      // Initialize with empty for all template fields
      detail.fields.forEach((f) => {
        existingValuesMap[f.id] = '';
      });
      // Fill from measurement.values
      measurement.values.forEach((v) => {
        existingValuesMap[v.field_id] = String(v.value);
      });
      setFieldValues(existingValuesMap);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch template details';
      setGeneralFormError(msg);
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  /**
   * Validate all form fields dynamically against template specifications
   */
  const validateForm = (fields: MeasurementField[]): boolean => {
    const errors: Record<number, string> = {};
    let isValid = true;

    if (!formProfileName.trim()) {
      setGeneralFormError('Please provide a profile name (e.g., "Slim Fit Shirt").');
      isValid = false;
    }

    fields.forEach((field) => {
      const rawVal = fieldValues[field.id];
      if (field.required && (!rawVal || rawVal.trim() === '')) {
        errors[field.id] = `${field.field_label} is required.`;
        isValid = false;
        return;
      }

      if (rawVal && rawVal.trim() !== '') {
        const numVal = parseFloat(rawVal);
        if (isNaN(numVal) || numVal <= 0) {
          errors[field.id] = 'Must be a positive number.';
          isValid = false;
          return;
        }

        // Unit multiplier for min/max check (templates define limits in inches)
        const scale = formUnit === 'cm' ? 2.54 : 1.0;
        if (field.min_value !== null && field.min_value !== undefined) {
          const scaledMin = field.min_value * scale;
          if (numVal < scaledMin) {
            errors[field.id] = `Min expected: ${scaledMin.toFixed(1)} ${formUnit}`;
            isValid = false;
            return;
          }
        }
        if (field.max_value !== null && field.max_value !== undefined) {
          const scaledMax = field.max_value * scale;
          if (numVal > scaledMax) {
            errors[field.id] = `Max expected: ${scaledMax.toFixed(1)} ${formUnit}`;
            isValid = false;
            return;
          }
        }
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  /**
   * Submit Add Measurement to backend API
   */
  const handleSaveNewMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateDetail) {
      setGeneralFormError('No garment template selected.');
      return;
    }

    if (!validateForm(selectedTemplateDetail.fields)) {
      return;
    }

    setIsSubmitting(true);
    setGeneralFormError(null);

    try {
      const valuesPayload = Object.entries(fieldValues)
        .filter(([_, val]) => val && val.trim() !== '')
        .map(([fieldId, val]) => ({
          field_id: parseInt(fieldId, 10),
          value: parseFloat(val),
        }));

      const payload: CustomerMeasurementCreatePayload = {
        template_id: selectedTemplateDetail.id,
        measurement_name: formProfileName.trim(),
        unit: formUnit,
        notes: formNotes.trim() || undefined,
        values: valuesPayload,
      };

      const created = await measurementService.createMeasurement(payload);
      setMeasurements((prev) => [created, ...prev]);
      showToast(
        'success',
        'Measurement Profile Saved',
        `'${created.measurement_name}' has been securely recorded in your digital wardrobe.`
      );
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save measurement profile';
      setGeneralFormError(msg);
      showToast('error', 'Save Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Submit Update Measurement to backend API
   */
  const handleUpdateMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMeasurement || !selectedTemplateDetail) return;

    if (!validateForm(selectedTemplateDetail.fields)) {
      return;
    }

    setIsSubmitting(true);
    setGeneralFormError(null);

    try {
      const valuesPayload = Object.entries(fieldValues)
        .filter(([_, val]) => val && val.trim() !== '')
        .map(([fieldId, val]) => ({
          field_id: parseInt(fieldId, 10),
          value: parseFloat(val),
        }));

      const payload: CustomerMeasurementUpdatePayload = {
        measurement_name: formProfileName.trim(),
        unit: formUnit,
        notes: formNotes.trim() || undefined,
        values: valuesPayload,
      };

      const updated = await measurementService.updateMeasurement(activeMeasurement.id, payload);
      setMeasurements((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      showToast(
        'success',
        'Measurement Updated',
        `'${updated.measurement_name}' was successfully updated.`
      );
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update measurement profile';
      setGeneralFormError(msg);
      showToast('error', 'Update Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Delete customer measurement
   */
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsSubmitting(true);
    try {
      await measurementService.deleteMeasurement(deleteTargetId);
      setMeasurements((prev) => prev.filter((m) => m.id !== deleteTargetId));
      showToast('info', 'Measurement Removed', 'The measurement profile was deleted.');
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete measurement profile';
      showToast('error', 'Delete Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered measurement list
  const filteredMeasurements = measurements.filter((m) => {
    const matchesGarment =
      selectedGarmentFilter === 'ALL' ||
      m.garment_type.toUpperCase() === selectedGarmentFilter.toUpperCase();
    const matchesSearch =
      m.measurement_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGarment && matchesSearch;
  });

  // Unique list of garment types from templates for filter pills
  const availableGarmentTypes = ['ALL', ...templates.map((t) => t.garment_type)];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/20 relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 8 Bespoke Anatomical Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t('customer.measurements.title', 'My Measurement Profiles')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t('customer.measurements.subtitle', 'Manage accurate anatomical measurements for custom tailored garments')}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddModal}
            >
              {t('customer.measurements.addNew', 'New Measurement Profile')}
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={loadData}
            >
              {t('common.refresh', 'Sync With Backend')}
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('common.searchPlaceholder', 'Search profiles by label, garment, or notes...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Garment Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs text-slate-400 font-medium px-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Garment:
            </span>
            {availableGarmentTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedGarmentFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGarmentFilter.toUpperCase() === type.toUpperCase()
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {type === 'ALL'
                  ? 'All Garments'
                  : type
                      .replace('_', ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse p-6 space-y-4"
            >
              <div className="h-6 w-1/3 bg-slate-800 rounded-lg" />
              <div className="h-4 w-2/3 bg-slate-800/60 rounded" />
              <div className="space-y-2 pt-4">
                <div className="h-4 bg-slate-800/40 rounded" />
                <div className="h-4 bg-slate-800/40 rounded" />
                <div className="h-4 bg-slate-800/40 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center border-red-500/20 bg-red-950/10">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Failed to Load Measurements</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={loadData} className="mt-4">
            Try Again
          </Button>
        </Card>
      ) : filteredMeasurements.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Ruler className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {searchQuery || selectedGarmentFilter !== 'ALL'
              ? t('customer.measurements.noProfiles', 'No matching measurement profiles found')
              : t('customer.measurements.noProfiles', 'No measurement profiles recorded yet')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery || selectedGarmentFilter !== 'ALL'
              ? 'Try adjusting your search criteria or resetting the garment filter.'
              : t('customer.measurements.subtitle', 'Store your anatomical measurements for shirts, suits, lehengas, and dresses so tailors can craft precision garments.')}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {searchQuery || selectedGarmentFilter !== 'ALL' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGarmentFilter('ALL');
                }}
              >
                {t('common.reset', 'Clear Filters')}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleOpenAddModal}
              >
                {t('customer.measurements.createFirst', 'Create First Profile')}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeasurements.map((m) => (
            <Card
              key={m.id}
              className="group flex flex-col justify-between border-slate-800/90 hover:border-slate-700 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/10"
            >
              <div>
                {/* Card Header */}
                <div className="p-5 border-b border-slate-800/80 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {m.template_name || m.garment_type}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {m.unit}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight truncate group-hover:text-emerald-300 transition-colors">
                      {m.measurement_name}
                    </h3>
                  </div>

                  {/* Actions Dropdown / Buttons */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenViewModal(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="View all measurements"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      title="Edit measurements"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTargetId(m.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Values Matrix Preview */}
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {m.values.slice(0, 4).map((val) => (
                      <div
                        key={val.id}
                        className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                      >
                        <span className="text-slate-400 truncate pr-1">{val.field_label}</span>
                        <span className="font-mono font-bold text-white shrink-0">
                          {val.value} {m.unit}
                        </span>
                      </div>
                    ))}
                  </div>

                  {m.values.length > 4 && (
                    <button
                      onClick={() => handleOpenViewModal(m)}
                      className="w-full text-center text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors py-1 hover:underline"
                    >
                      + {m.values.length - 4} additional anatomical points recorded
                    </button>
                  )}

                  {/* Notes snippet */}
                  {m.notes && (
                    <div className="mt-2 text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 italic line-clamp-2">
                      &ldquo;{m.notes}&rdquo;
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3.5 bg-slate-900/40 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Updated: {new Date(m.updated_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleOpenViewModal(m)}
                  className="font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  Inspect <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD MEASUREMENT MODAL (DYNAMIC BASED ON SELECTED GARMENT TEMPLATE)       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Bespoke Measurement Profile"
        description="Select a garment template. Anatomical fields will be generated dynamically from backend specifications."
        size="lg"
      >
        <form onSubmit={handleSaveNewMeasurement} className="space-y-6">
          {generalFormError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalFormError}</span>
            </div>
          )}

          {/* Garment Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Garment Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {templates.map((tpl) => (
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedTemplateId === tpl.id
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs truncate">{tpl.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {tpl.field_count} measurement points
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Profile Name & Unit Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Profile Name"
                placeholder="e.g., Savile Row Slim Fit Shirt"
                value={formProfileName}
                onChange={(e) => setFormProfileName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Unit of Measure
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['inches', 'cm'] as const).map((u) => (
                  <button
                    type="button"
                    key={u}
                    onClick={() => setFormUnit(u)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all uppercase ${
                      formUnit === u
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Anatomical Fields Generator */}
          {isLoadingTemplate ? (
            <div className="p-8 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading dynamic garment fields...</p>
            </div>
          ) : selectedTemplateDetail ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" />
                  {selectedTemplateDetail.name} Anatomical Parameters ({formUnit})
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedTemplateDetail.fields.length} measurement points
                </span>
              </div>

              {selectedTemplateDetail.description && (
                <p className="text-xs text-slate-400 italic">
                  {selectedTemplateDetail.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 max-h-80 overflow-y-auto pr-1">
                {selectedTemplateDetail.fields.map((field) => {
                  const errorMsg = fieldErrors[field.id];
                  const scale = formUnit === 'cm' ? 2.54 : 1.0;
                  const rangeHint =
                    field.min_value && field.max_value
                      ? `(${Math.round(field.min_value * scale)} - ${Math.round(
                          field.max_value * scale
                        )} ${formUnit})`
                      : '';

                  return (
                    <div key={field.id} className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <label className="text-xs font-semibold text-slate-300">
                          {field.field_label}
                          {field.required && <span className="text-emerald-400 ml-1">*</span>}
                        </label>
                        {rangeHint && (
                          <span className="text-[10px] text-slate-500 font-mono">{rangeHint}</span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={fieldValues[field.id] || ''}
                          onChange={(e) =>
                            setFieldValues({
                              ...fieldValues,
                              [field.id]: e.target.value,
                            })
                          }
                          placeholder={`Enter ${field.field_label.toLowerCase()}`}
                          className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none transition-colors ${
                            errorMsg
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-slate-800 focus:border-emerald-500/50'
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                          {formUnit}
                        </span>
                      </div>

                      {field.description && !errorMsg && (
                        <p className="text-[10px] text-slate-500">{field.description}</p>
                      )}
                      {errorMsg && (
                        <p className="text-[10px] text-red-400 font-medium">{errorMsg}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Notes */}
          <div>
            <Textarea
              label="Fitting Notes & Posture Preferences (Optional)"
              placeholder="e.g., Preference for relaxed shoulder slope, slight collar ease, fitted cuffs..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              isLoading={isSubmitting}
            >
              Save Measurement
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* EDIT MEASUREMENT MODAL                                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Measurement Profile"
        description="Update values or notes for this customized bespoke profile."
        size="lg"
      >
        <form onSubmit={handleUpdateMeasurement} className="space-y-6">
          {generalFormError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalFormError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Profile Name"
                value={formProfileName}
                onChange={(e) => setFormProfileName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Unit of Measure
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['inches', 'cm'] as const).map((u) => (
                  <button
                    type="button"
                    key={u}
                    onClick={() => setFormUnit(u)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all uppercase ${
                      formUnit === u
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Fields */}
          {isLoadingTemplate ? (
            <div className="p-8 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading measurement fields...</p>
            </div>
          ) : selectedTemplateDetail ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" />
                  {selectedTemplateDetail.name} Anatomical Parameters ({formUnit})
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedTemplateDetail.fields.length} measurement points
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 max-h-80 overflow-y-auto pr-1">
                {selectedTemplateDetail.fields.map((field) => {
                  const errorMsg = fieldErrors[field.id];
                  return (
                    <div key={field.id} className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 block">
                        {field.field_label}
                        {field.required && <span className="text-emerald-400 ml-1">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={fieldValues[field.id] || ''}
                          onChange={(e) =>
                            setFieldValues({
                              ...fieldValues,
                              [field.id]: e.target.value,
                            })
                          }
                          className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none transition-colors ${
                            errorMsg
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-slate-800 focus:border-emerald-500/50'
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                          {formUnit}
                        </span>
                      </div>
                      {errorMsg && (
                        <p className="text-[10px] text-red-400 font-medium">{errorMsg}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Notes */}
          <div>
            <Textarea
              label="Fitting Notes & Instructions"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              isLoading={isSubmitting}
            >
              Update Measurement
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* VIEW MEASUREMENT DETAIL MODAL                                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={activeMeasurement?.measurement_name || 'Measurement Profile'}
        description={`Garment: ${activeMeasurement?.template_name || activeMeasurement?.garment_type}`}
        size="lg"
      >
        {activeMeasurement && (
          <div className="space-y-6">
            {/* Metadata banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Garment Type
                </span>
                <span className="font-semibold text-white mt-0.5 block">
                  {activeMeasurement.template_name || activeMeasurement.garment_type}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Unit</span>
                <span className="font-semibold text-white uppercase mt-0.5 block">
                  {activeMeasurement.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Total Points
                </span>
                <span className="font-semibold text-white mt-0.5 block">
                  {activeMeasurement.values.length} anatomical specs
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Last Updated
                </span>
                <span className="font-semibold text-white mt-0.5 block">
                  {new Date(activeMeasurement.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Complete Values Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Recorded Anatomical Values
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
                {activeMeasurement.values.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-slate-300">{v.field_label}</span>
                    <span className="font-mono font-bold text-emerald-300 text-sm">
                      {v.value} {activeMeasurement.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            {activeMeasurement.notes && (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Fitting & Posture Notes
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-wrap">
                  {activeMeasurement.notes}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(activeMeasurement);
                }}
              >
                Edit Values
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsViewModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Measurement Profile"
        description="Are you sure you wish to delete this bespoke measurement profile? This action cannot be undone."
        size="sm"
      >
        <div className="space-y-5">
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>The recorded measurements will be permanently removed from your account.</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={handleConfirmDelete}
              isLoading={isSubmitting}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
