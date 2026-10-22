import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  StickyNote,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Send,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
  Building,
} from 'lucide-react';
import { Card, StatCard } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input, Textarea, Select } from '../../../components/common/FormFields';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '../../../components/common/FeedbackStates';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from '../../../i18n';
import { customerService } from '../../../services/customerService';
import {
  FALLBACK_COUNTRIES,
  FALLBACK_CURRENCIES,
} from '../../../services/internationalService';
import type {
  Customer,
  CustomerCreatePayload,
  CustomerUpdatePayload,
  CustomerNote,
} from '../../../types/customer';

export const TailorCustomersPage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Data & State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Panels
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'notes' | 'orders'>('profile');
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add Patron form
  const [createForm, setCreateForm] = useState<CustomerCreatePayload>({
    full_name: '',
    email: '',
    phone: '',
    gender: 'Male',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    country_code: 'IN',
    currency: 'INR',
    preferred_contact_method: 'EMAIL',
    status: 'ACTIVE',
    initial_note: '',
    note_category: 'GENERAL',
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Edit Patron form
  const [editForm, setEditForm] = useState<CustomerUpdatePayload>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Note composer inside View Modal
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [newNoteCategory, setNewNoteCategory] = useState<string>('GENERAL');
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);

  // Fetch patrons from backend API
  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await customerService.getCustomers({
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit,
      });
      setCustomers(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch atelier patrons';
      setError(msg);
      showToast('error', 'Error Loading Patrons', msg);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page, limit, showToast]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  // Copy to clipboard helper
  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(identifier);
    showToast('info', 'Copied to Clipboard', text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Detailed Profile
  const handleOpenProfile = async (customer: Customer, initialTab: 'profile' | 'notes' | 'orders' = 'profile') => {
    setActiveProfileTab(initialTab);
    try {
      const detailed = await customerService.getCustomerById(customer.id);
      setViewingCustomer(detailed);
    } catch {
      setViewingCustomer(customer);
    }
  };

  // Add Customer validation & submit
  const validateCreateForm = () => {
    const errs: Record<string, string> = {};
    if (!createForm.full_name.trim()) {
      errs.full_name = 'Full name is required.';
    }
    if (createForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errs.email = 'Please provide a valid email address.';
    }
    setCreateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    try {
      setIsSubmitting(true);
      const created = await customerService.createCustomer({
        ...createForm,
        full_name: createForm.full_name.trim(),
        email: createForm.email?.trim() || undefined,
        phone: createForm.phone?.trim() || undefined,
        address: createForm.address?.trim() || undefined,
        city: createForm.city?.trim() || undefined,
        state: createForm.state?.trim() || undefined,
        pincode: createForm.pincode?.trim() || undefined,
        postal_code: createForm.pincode?.trim() || undefined,
        country: createForm.country?.trim() || 'India',
        country_code: createForm.country_code || 'IN',
        currency: createForm.currency || 'INR',
        initial_note: createForm.initial_note?.trim() || undefined,
      });

      showToast('success', 'Patron Added', `Successfully added ${created.full_name} to your atelier records.`);
      setIsAddModalOpen(false);
      setCreateForm({
        full_name: '',
        email: '',
        phone: '',
        gender: 'Male',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        country_code: 'IN',
        currency: 'INR',
        preferred_contact_method: 'EMAIL',
        status: 'ACTIVE',
        initial_note: '',
        note_category: 'GENERAL',
      });
      fetchCustomers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create patron';
      showToast('error', 'Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Customer Modal
  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setEditForm({
      full_name: cust.full_name,
      email: cust.email || '',
      phone: cust.phone || '',
      gender: cust.gender || 'Male',
      address: cust.address || '',
      city: cust.city || '',
      state: cust.state || '',
      pincode: cust.postal_code || cust.pincode || '',
      country: cust.country || 'India',
      country_code: cust.country_code || 'IN',
      currency: cust.currency || 'INR',
      preferred_contact_method: cust.preferred_contact_method || 'EMAIL',
      status: cust.status,
    });
    setEditErrors({});
  };

  // Submit Edit Customer
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    if (!editForm.full_name?.trim()) {
      setEditErrors({ full_name: 'Full name cannot be empty.' });
      return;
    }
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      setEditErrors({ email: 'Please provide a valid email address.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await customerService.updateCustomer(editingCustomer.id, {
        ...editForm,
        full_name: editForm.full_name.trim(),
        email: editForm.email?.trim() || undefined,
        phone: editForm.phone?.trim() || undefined,
        address: editForm.address?.trim() || undefined,
        city: editForm.city?.trim() || undefined,
        state: editForm.state?.trim() || undefined,
        pincode: editForm.pincode?.trim() || undefined,
        postal_code: editForm.pincode?.trim() || undefined,
        country: editForm.country?.trim() || undefined,
        country_code: editForm.country_code || undefined,
        currency: editForm.currency || undefined,
      });

      showToast('success', 'Patron Updated', `Updated profile for ${updated.full_name}.`);
      setEditingCustomer(null);

      // If viewing modal is open with this customer, update it
      if (viewingCustomer && viewingCustomer.id === updated.id) {
        setViewingCustomer((prev) => (prev ? { ...prev, ...updated } : updated));
      }

      fetchCustomers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update patron';
      showToast('error', 'Update Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;

    try {
      setIsSubmitting(true);
      await customerService.deleteCustomer(deletingCustomer.id);
      showToast('success', 'Patron Removed', `Removed ${deletingCustomer.full_name} from your atelier records.`);
      setDeletingCustomer(null);

      if (viewingCustomer && viewingCustomer.id === deletingCustomer.id) {
        setViewingCustomer(null);
      }

      fetchCustomers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete patron';
      showToast('error', 'Deletion Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Note from Profile Modal
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingCustomer || !newNoteText.trim()) return;

    try {
      setIsAddingNote(true);
      const newNote = await customerService.addCustomerNote(viewingCustomer.id, {
        note: newNoteText.trim(),
        category: newNoteCategory,
      });

      showToast('success', 'Note Stored', 'Atelier note logged successfully.');
      setNewNoteText('');

      // Update state in modal
      setViewingCustomer((prev) => {
        if (!prev) return null;
        const existingNotes = prev.notes || [];
        return {
          ...prev,
          notes_count: prev.notes_count + 1,
          notes: [newNote, ...existingNotes],
        };
      });

      // Update in table list
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === viewingCustomer.id ? { ...c, notes_count: c.notes_count + 1 } : c
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to store note';
      showToast('error', 'Note Failed', msg);
    } finally {
      setIsAddingNote(false);
    }
  };

  // Delete Note from Profile Modal
  const handleDeleteNote = async (noteId: number) => {
    if (!viewingCustomer) return;

    try {
      await customerService.deleteCustomerNote(viewingCustomer.id, noteId);
      showToast('success', 'Note Removed', 'Atelier note removed from patron file.');

      setViewingCustomer((prev) => {
        if (!prev) return null;
        const updatedNotes = (prev.notes || []).filter((n) => n.id !== noteId);
        return {
          ...prev,
          notes_count: Math.max(0, prev.notes_count - 1),
          notes: updatedNotes,
        };
      });

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === viewingCustomer.id ? { ...c, notes_count: Math.max(0, c.notes_count - 1) } : c
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete note';
      showToast('error', 'Error', msg);
    }
  };

  // Category badge styling helper
  const getCategoryBadgeClass = (category: string) => {
    switch (category.toUpperCase()) {
      case 'URGENT':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'FITTING':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'FABRIC':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'PREFERENCE':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  // Contact Method Badge helper
  const getContactBadgeClass = (method?: string | null) => {
    switch ((method || '').toUpperCase()) {
      case 'WHATSAPP':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PHONE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  // Stat metrics calculations
  const activeCount = customers.filter((c) => c.status === 'ACTIVE').length;
  const totalNotesCount = customers.reduce((acc, c) => acc + (c.notes_count || 0), 0);
  const totalCommissionsCount = customers.reduce((acc, c) => acc + (c.total_orders || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Atelier Clientele Management • Phase 5</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('tailor.customers.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {t('tailor.customers.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomers}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />}
            title={t('common.refresh')}
          >
            {t('common.refresh')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('tailor.customers.addPatron')}
          </Button>
        </div>
      </div>

      {/* Metrics Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patrons"
          value={total}
          subtitle="Registered in atelier"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Active Patrons"
          value={activeCount}
          subtitle="Eligible for bookings"
          icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          title="Atelier Notes"
          value={totalNotesCount}
          subtitle="Fitting & style notes"
          icon={<StickyNote className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          title="Garment Commissions"
          value={totalCommissionsCount}
          subtitle="Lifetime patron pieces"
          icon={<ShoppingBag className="w-5 h-5 text-indigo-400" />}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('tailor.customers.searchPatrons')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-750 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-750 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">{t('common.all')}</option>
              <option value="ACTIVE">{t('common.active')}</option>
              <option value="INACTIVE">{t('common.inactive')}</option>
            </select>
          </div>

          {/* Page Limit Dropdown */}
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-750 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Main Patron Directory Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading && customers.length === 0 ? (
          <div className="py-20">
            <LoadingSpinner label="Fetching atelier patron records..." />
          </div>
        ) : error ? (
          <div className="py-12">
            <ErrorState
              title="Unable to Load Patron Directory"
              message={error}
              onRetry={fetchCustomers}
            />
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Users className="w-8 h-8 text-emerald-400" />}
              title={search ? 'No Matching Patrons Found' : 'No Patrons in Atelier Record'}
              description={
                search
                  ? `No customers matched "${search}". Try adjusting your keywords or clearing the filter.`
                  : 'Your atelier client directory is currently empty. Add your first bespoke customer to store fitting notes and profile details.'
              }
              actionLabel="Add First Patron"
              onAction={() => setIsAddModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4 pl-6">{t('tailor.customers.name')}</th>
                  <th className="p-4">{t('tailor.customers.phone')}</th>
                  <th className="p-4">{t('tailor.customers.country')}</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">{t('tailor.customers.notes')}</th>
                  <th className="p-4">{t('common.status')}</th>
                  <th className="p-4 pr-6 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {customers.map((customer) => {
                  const initials = customer.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-900/50 transition-colors group cursor-pointer"
                      onClick={() => handleOpenProfile(customer, 'profile')}
                    >
                      {/* Patron Name & Initials */}
                      <td className="p-4 pl-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700/80 text-emerald-400 font-bold flex items-center justify-center text-xs shadow-inner">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                              {customer.full_name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Patron #{customer.id} • Added {new Date(customer.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          {customer.email ? (
                            <div className="flex items-center space-x-1.5 text-slate-300">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="truncate max-w-[160px]">{customer.email}</span>
                              <button
                                onClick={() => handleCopy(customer.email!, `email-${customer.id}`)}
                                className="text-slate-500 hover:text-emerald-400 p-0.5 rounded"
                                title="Copy email"
                              >
                                {copiedId === `email-${customer.id}` ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 italic">No email on file</span>
                          )}

                          {customer.phone ? (
                            <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{customer.phone}</span>
                              <button
                                onClick={() => handleCopy(customer.phone!, `phone-${customer.id}`)}
                                className="text-slate-500 hover:text-emerald-400 p-0.5 rounded"
                                title="Copy phone"
                              >
                                {copiedId === `phone-${customer.id}` ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 italic block text-[11px]">No phone</span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="p-4 whitespace-nowrap text-slate-400">
                        {customer.city ? (
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-medium text-slate-300">{customer.city}</span>
                            {customer.country && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                                {customer.country}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">—</span>
                        )}
                        {customer.address && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                            {customer.address}
                          </div>
                        )}
                      </td>

                      {/* Preferred Contact Method */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getContactBadgeClass(
                            customer.preferred_contact_method
                          )}`}
                        >
                          {customer.preferred_contact_method || 'EMAIL'}
                        </span>
                      </td>

                      {/* Notes Count */}
                      <td className="p-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenProfile(customer, 'notes')}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                        >
                          <StickyNote className="w-3 h-3 text-amber-400" />
                          <span className="font-semibold">{customer.notes_count || 0}</span>
                          <span className="text-slate-500 text-[10px]">notes</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            customer.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-700/30 text-slate-400 border-slate-700/50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              customer.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                            }`}
                          />
                          <span>{customer.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenProfile(customer, 'profile')}
                            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-700/60 transition-colors"
                            title="View Full Profile & Notes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(customer)}
                            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 border border-slate-700/60 transition-colors"
                            title="Edit Patron"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCustomer(customer)}
                            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 transition-colors"
                            title="Delete Patron"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {total > 0 && (
          <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              Showing <span className="text-white font-bold">{Math.min((page - 1) * limit + 1, total)}</span> to{' '}
              <span className="text-white font-bold">{Math.min(page * limit, total)}</span> of{' '}
              <span className="text-white font-bold">{total}</span> patrons
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-750 transition-colors flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono">
                Page <span className="text-emerald-400 font-bold">{page}</span> of {totalPages || 1}
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-750 transition-colors flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ============================================================== */}
      {/* 1. VIEW CUSTOMER PROFILE & NOTES MODAL */}
      {/* ============================================================== */}
      {viewingCustomer && (
        <Modal
          isOpen={Boolean(viewingCustomer)}
          onClose={() => setViewingCustomer(null)}
          size="lg"
          title={`${viewingCustomer.full_name} — Atelier File`}
          description={`Patron ID #${viewingCustomer.id} • Registered ${new Date(
            viewingCustomer.created_at
          ).toLocaleDateString()}`}
        >
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveProfileTab('profile')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
                  activeProfileTab === 'profile'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Profile &amp; Demographics</span>
              </button>
              <button
                onClick={() => setActiveProfileTab('notes')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
                  activeProfileTab === 'notes'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span>Atelier Notes ({viewingCustomer.notes?.length ?? viewingCustomer.notes_count ?? 0})</span>
              </button>
              <button
                onClick={() => setActiveProfileTab('orders')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
                  activeProfileTab === 'orders'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Order History</span>
              </button>
            </div>

            {/* TAB 1: Profile & Contact Details */}
            {activeProfileTab === 'profile' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Full Legal / Preferred Name
                    </span>
                    <span className="text-base font-bold text-white block">{viewingCustomer.full_name}</span>
                    <span className="text-[11px] text-slate-500 block">Gender: {viewingCustomer.gender || 'Not specified'}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Patron Status &amp; Channel
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          viewingCustomer.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-700/30 text-slate-400 border-slate-700/50'
                        }`}
                      >
                        {viewingCustomer.status}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getContactBadgeClass(
                          viewingCustomer.preferred_contact_method
                        )}`}
                      >
                        {viewingCustomer.preferred_contact_method || 'EMAIL'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Address */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Contact &amp; Delivery Destination
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Email Address</span>
                      <span className="text-slate-200 font-medium block mt-0.5">
                        {viewingCustomer.email || 'None on record'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Phone Number</span>
                      <span className="text-slate-200 font-medium font-mono block mt-0.5">
                        {viewingCustomer.phone || 'None on record'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Country &amp; Currency</span>
                      <span className="text-slate-200 font-medium block mt-0.5">
                        {viewingCustomer.country || 'India'} ({viewingCustomer.currency || 'INR'})
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">Atelier Fitting Address</span>
                      <span className="text-slate-200 font-medium block mt-0.5">
                        {[
                          viewingCustomer.address,
                          viewingCustomer.city,
                          viewingCustomer.state,
                          viewingCustomer.postal_code || viewingCustomer.pincode,
                          viewingCustomer.country,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'No address registered'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick action buttons */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCustomer(viewingCustomer);
                      handleOpenEdit(viewingCustomer);
                    }}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Edit Demographics
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveProfileTab('notes')}
                    leftIcon={<StickyNote className="w-3.5 h-3.5" />}
                  >
                    View Notes
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 2: Store Customer Notes */}
            {activeProfileTab === 'notes' && (
              <div className="space-y-6">
                {/* Note Composer */}
                <form onSubmit={handleAddNote} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                      <span>Log New Atelier Note</span>
                    </span>
                    <select
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value)}
                      className="bg-slate-850 border border-slate-750 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="GENERAL">General Memo</option>
                      <option value="FITTING">Fitting Observation</option>
                      <option value="PREFERENCE">Style Preference</option>
                      <option value="FABRIC">Fabric Choice</option>
                      <option value="URGENT">Urgent Instruction</option>
                    </select>
                  </div>

                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="E.g., Client prefers unpadded shoulders, horn buttons, and high armholes..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isAddingNote}
                      disabled={!newNoteText.trim() || isAddingNote}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Save Atelier Note
                    </Button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Chronological Atelier Log
                  </h4>

                  {!viewingCustomer.notes || viewingCustomer.notes.length === 0 ? (
                    <div className="p-8 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
                      <StickyNote className="w-6 h-6 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 font-medium">No notes recorded yet for this patron.</p>
                      <p className="text-[11px] text-slate-500">
                        Use the composer above to record fitting notes, fabric requests, or style observations.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {viewingCustomer.notes.map((noteItem: CustomerNote) => (
                        <div
                          key={noteItem.id}
                          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-750 transition-colors flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getCategoryBadgeClass(
                                  noteItem.category
                                )}`}
                              >
                                {noteItem.category}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(noteItem.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                              {noteItem.note}
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeleteNote(noteItem.id)}
                            className="text-slate-600 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-850 transition-colors"
                            title="Delete this note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Order History */}
            {activeProfileTab === 'orders' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Lifetime Commissions
                    </span>
                    <span className="text-2xl font-extrabold text-white mt-1 block">
                      {viewingCustomer.total_orders || 0} garments
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Atelier Spend
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 block">
                      ${(viewingCustomer.total_spend || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950/20 border border-slate-800 space-y-3 text-center sm:text-left">
                  <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Order Tracking Specification</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Customer order tracking, bespoke stage progression, and production milestones will be integrated in upcoming Order Management modules. All future commissions assigned to this patron will automatically link and display in this ledger.
                  </p>
                  <div className="inline-flex items-center space-x-2 text-[11px] text-slate-400 font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Patron #{viewingCustomer.id} active and ready for commissions</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* 2. ADD NEW CUSTOMER MODAL */}
      {/* ============================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        size="lg"
        title="Register New Patron"
        description="Add a new customer profile to your atelier directory. All records are confidential to your shop."
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Legal / Patron Name *"
              placeholder="e.g., Lord Henry Wotton"
              value={createForm.full_name}
              onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
              error={createErrors.full_name}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g., henry.wotton@mayfair.org"
              value={createForm.email || ''}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              error={createErrors.email}
            />
            <Input
              label="Phone Number"
              placeholder="e.g., +44 20 7946 0555"
              value={createForm.phone || ''}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            />
            <Select
              label="Gender"
              value={createForm.gender || 'Male'}
              onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Non-binary', label: 'Non-binary' },
                { value: 'Other', label: 'Other' },
                { value: 'Prefer not to say', label: 'Prefer not to say' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Country / Region"
              value={createForm.country_code || 'IN'}
              onChange={(e) => {
                const code = e.target.value;
                const found = FALLBACK_COUNTRIES.find((c) => c.code === code);
                setCreateForm({
                  ...createForm,
                  country_code: code,
                  country: found?.name || 'India',
                  currency: found?.currency || createForm.currency || 'INR',
                });
              }}
              options={FALLBACK_COUNTRIES.map((c) => ({
                value: c.code,
                label: `${c.name} (${c.dial_code})`,
              }))}
            />
            <Select
              label="Billing Currency"
              value={createForm.currency || 'INR'}
              onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
              options={FALLBACK_CURRENCIES.map((c) => ({
                value: c.code,
                label: `${c.code} - ${c.name} (${c.symbol})`,
              }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <Input
                label="Street Address"
                placeholder="e.g., 10 Berkeley Square"
                value={createForm.address || ''}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
              />
            </div>
            <Input
              label="City"
              placeholder="e.g., London"
              value={createForm.city || ''}
              onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
            />
            <Input
              label="State / Province"
              placeholder="e.g., Greater London"
              value={createForm.state || ''}
              onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
            />
            <Input
              label={
                FALLBACK_COUNTRIES.find((c) => c.code === createForm.country_code)?.postal_label ||
                'Postal Code / Pincode'
              }
              placeholder={
                FALLBACK_COUNTRIES.find((c) => c.code === createForm.country_code)?.postal_placeholder ||
                'e.g., 110001'
              }
              value={createForm.pincode || ''}
              onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Preferred Contact Channel"
              value={createForm.preferred_contact_method || 'EMAIL'}
              onChange={(e) => setCreateForm({ ...createForm, preferred_contact_method: e.target.value })}
              options={[
                { value: 'EMAIL', label: 'Email Dispatch' },
                { value: 'PHONE', label: 'Direct Phone Call' },
                { value: 'WHATSAPP', label: 'WhatsApp Concierge' },
              ]}
            />
            <Select
              label="Account Status"
              value={createForm.status || 'ACTIVE'}
              onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active Patron' },
                { value: 'INACTIVE', label: 'Inactive / Archived' },
              ]}
            />
          </div>

          {/* Initial Atelier Note */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Initial Atelier Note (Optional)
              </label>
              <select
                value={createForm.note_category || 'GENERAL'}
                onChange={(e) => setCreateForm({ ...createForm, note_category: e.target.value })}
                className="bg-slate-850 border border-slate-750 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
              >
                <option value="GENERAL">General Note</option>
                <option value="FITTING">Fitting Note</option>
                <option value="PREFERENCE">Style Preference</option>
                <option value="FABRIC">Fabric Choice</option>
                <option value="URGENT">Urgent Memo</option>
              </select>
            </div>
            <textarea
              rows={2}
              placeholder="Add initial fitting observation, fabric preference, or bespoke instruction..."
              value={createForm.initial_note || ''}
              onChange={(e) => setCreateForm({ ...createForm, initial_note: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-slate-750 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Save Patron Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* 3. EDIT CUSTOMER MODAL */}
      {/* ============================================================== */}
      {editingCustomer && (
        <Modal
          isOpen={Boolean(editingCustomer)}
          onClose={() => setEditingCustomer(null)}
          size="lg"
          title={`Edit Patron: ${editingCustomer.full_name}`}
          description={`Update contact and address information for Patron #${editingCustomer.id}.`}
        >
          <form onSubmit={handleUpdateCustomer} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Legal / Patron Name *"
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                error={editErrors.full_name}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                error={editErrors.email}
              />
              <Input
                label="Phone Number"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              <Select
                label="Gender"
                value={editForm.gender || 'Male'}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Non-binary', label: 'Non-binary' },
                  { value: 'Other', label: 'Other' },
                  { value: 'Prefer not to say', label: 'Prefer not to say' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Country / Region"
                value={editForm.country_code || 'IN'}
                onChange={(e) => {
                  const code = e.target.value;
                  const found = FALLBACK_COUNTRIES.find((c) => c.code === code);
                  setEditForm({
                    ...editForm,
                    country_code: code,
                    country: found?.name || 'India',
                    currency: found?.currency || editForm.currency || 'INR',
                  });
                }}
                options={FALLBACK_COUNTRIES.map((c) => ({
                  value: c.code,
                  label: `${c.name} (${c.dial_code})`,
                }))}
              />
              <Select
                label="Billing Currency"
                value={editForm.currency || 'INR'}
                onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                options={FALLBACK_CURRENCIES.map((c) => ({
                  value: c.code,
                  label: `${c.code} - ${c.name} (${c.symbol})`,
                }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <Input
                  label="Street Address"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <Input
                label="City"
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
              <Input
                label="State / Province"
                value={editForm.state || ''}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
              />
              <Input
                label={
                  FALLBACK_COUNTRIES.find((c) => c.code === editForm.country_code)?.postal_label ||
                  'Postal Code / Pincode'
                }
                value={editForm.pincode || ''}
                onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Preferred Contact Channel"
                value={editForm.preferred_contact_method || 'EMAIL'}
                onChange={(e) => setEditForm({ ...editForm, preferred_contact_method: e.target.value })}
                options={[
                  { value: 'EMAIL', label: 'Email Dispatch' },
                  { value: 'PHONE', label: 'Direct Phone Call' },
                  { value: 'WHATSAPP', label: 'WhatsApp Concierge' },
                ]}
              />
              <Select
                label="Account Status"
                value={editForm.status || 'ACTIVE'}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                options={[
                  { value: 'ACTIVE', label: 'Active Patron' },
                  { value: 'INACTIVE', label: 'Inactive / Archived' },
                ]}
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <Button variant="secondary" size="sm" type="button" onClick={() => setEditingCustomer(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* 4. DELETE CONFIRMATION DIALOG */}
      {/* ============================================================== */}
      {deletingCustomer && (
        <Modal
          isOpen={Boolean(deletingCustomer)}
          onClose={() => setDeletingCustomer(null)}
          title="Confirm Patron Deletion"
          description="Are you sure you want to permanently delete this customer from your atelier?"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-200">Irreversible Action</p>
                <p className="mt-1 leading-relaxed">
                  Deleting <strong className="text-white">{deletingCustomer.full_name}</strong> will remove their patron profile and all {deletingCustomer.notes_count || 0} associated atelier notes.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setDeletingCustomer(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleDeleteCustomer}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Patron
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

