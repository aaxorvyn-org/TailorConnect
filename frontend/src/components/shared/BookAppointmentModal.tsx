import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  User,
  Phone,
  Scissors,
  ArrowRight,
  ShieldCheck,
  Building2,
  Home,
  Video,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, Textarea, Select } from '../common/FormFields';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { appointmentService, type AppointmentBooking } from '../../services/appointmentService';
import type { Tailor } from '../../types/tailor';

export interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tailor?: Tailor | { id: string | number; shopName: string; name?: string; address?: string; image?: string } | null;
  initialGarmentType?: string;
  onBookingConfirmed?: (booking: AppointmentBooking) => void;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  tailor,
  initialGarmentType = 'Ladies Blouse & Maggam Work',
  onBookingConfirmed,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [garmentType, setGarmentType] = useState<string>(initialGarmentType);
  const [fittingType, setFittingType] = useState<'Atelier Visit' | 'Doorstep Measuring' | 'Virtual Video Consultation'>('Doorstep Measuring');
  
  // Tomorrow as default date formatted YYYY-MM-DD
  const tomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [preferredDate, setPreferredDate] = useState<string>(tomorrowStr());
  const [timeSlot, setTimeSlot] = useState<string>('11:00 AM - 01:00 PM');
  const [customerName, setCustomerName] = useState<string>(user?.full_name || 'Aarav Sharma');
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || '+91 98765 43210');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<AppointmentBooking | null>(null);

  const resetState = () => {
    setConfirmedBooking(null);
    setNotes('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('error', 'Missing Information', 'Please provide your full name and phone number for the booking.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tailorName = tailor?.shopName || tailor?.name || 'Master Sartorial Atelier';
      const tailorId = tailor?.id || 'tailor-1';
      const tailorAddress = (tailor as any)?.location?.address || (tailor as any)?.address || (tailor as any)?.shop_address || 'Artisan Workshop District';
      const tailorImage = (tailor as any)?.coverImage || (tailor as any)?.image;

      const created = appointmentService.createAppointment({
        tailorId,
        tailorName,
        tailorAddress,
        tailorImage,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: user?.email,
        garmentType,
        fittingType,
        date: preferredDate,
        timeSlot,
        notes: notes.trim(),
      });

      setConfirmedBooking(created);
      onBookingConfirmed?.(created);
      showToast('success', 'Appointment Booked!', `Booking reference #${created.bookingNumber} confirmed.`);
    } catch {
      showToast('error', 'Booking Error', 'Could not complete booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={confirmedBooking ? '🎉 Appointment Confirmed!' : `Book Appointment with ${tailor?.shopName || 'Master Tailor'}`}
      description={
        confirmedBooking
          ? 'Your tailoring appointment has been registered and verified.'
          : 'Schedule a personalized fitting, doorstep measurement, or design consultation.'
      }
      size="lg"
    >
      {confirmedBooking ? (
        <div className="space-y-6 py-2">
          {/* Confirmed Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border border-emerald-500/30 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                Booking ID: {confirmedBooking.bookingNumber}
              </span>
              <h3 className="text-xl font-extrabold text-white tracking-tight mt-1">
                Fitting Appointment Scheduled
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                {confirmedBooking.tailorName} has received your schedule request for {confirmedBooking.garmentType}.
              </p>
            </div>
          </div>

          {/* Appointment Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5 text-xs text-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400">Atelier / Tailor</span>
              <span className="font-bold text-white text-sm">{confirmedBooking.tailorName}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400">Service / Garment</span>
              <span className="font-semibold text-emerald-300">{confirmedBooking.garmentType}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400">Fitting Type</span>
              <span className="font-semibold text-white inline-flex items-center gap-1.5">
                {confirmedBooking.fittingType === 'Doorstep Measuring' && <Home className="w-3.5 h-3.5 text-emerald-400" />}
                {confirmedBooking.fittingType === 'Atelier Visit' && <Building2 className="w-3.5 h-3.5 text-teal-400" />}
                {confirmedBooking.fittingType === 'Virtual Video Consultation' && <Video className="w-3.5 h-3.5 text-indigo-400" />}
                {confirmedBooking.fittingType}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400">Date &amp; Time Slot</span>
              <span className="font-mono font-bold text-white">
                {confirmedBooking.date} • {confirmedBooking.timeSlot}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400">Customer Name &amp; Contact</span>
              <span className="font-medium text-slate-200">
                {confirmedBooking.customerName} ({confirmedBooking.customerPhone})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Appointment Status</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {confirmedBooking.status}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Our master tailor will send a verification SMS/WhatsApp message prior to arrival. Fitting trials include complimentary size adjustments.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <Button variant="primary" size="md" onClick={handleClose}>
              Done &amp; Continue
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Atelier banner */}
          {tailor && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{tailor.shopName}</h4>
                  <p className="text-[11px] text-slate-400">
                    {(tailor as any).location?.city || (tailor as any).city || 'Verified Bespoke Tailor'} • 100% Fit Guarantee
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Free Booking
              </span>
            </div>
          )}

          {/* Garment / Service Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Garment / Tailoring Type
            </label>
            <select
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="Ladies Blouse & Maggam Work">✨ Ladies Blouse & Maggam Work (Bridal / Party Wear)</option>
              <option value="Bespoke Suits & Tuxedos">Bespoke Suits & Tuxedos (Two / Three Piece)</option>
              <option value="Bridal Saree & Lehengas">Bridal Saree & Lehengas Stitching</option>
              <option value="Traditional Kurta & Sherwani">Traditional Kurta & Sherwani</option>
              <option value="Garment Alterations & Repairs">Fitting Alterations & Repairs (Waist, Sleeves, Tapering)</option>
              <option value="Custom Bespoke Design">Other Custom Bespoke Design</option>
            </select>
          </div>

          {/* Fitting Preference Mode */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Fitting &amp; Measurement Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'Doorstep Measuring',
                  label: 'Doorstep Home',
                  desc: 'Tailor visits your home',
                  icon: <Home className="w-4 h-4" />,
                },
                {
                  id: 'Atelier Visit',
                  label: 'Atelier Studio',
                  desc: 'Visit tailor workshop',
                  icon: <Building2 className="w-4 h-4" />,
                },
                {
                  id: 'Virtual Video Consultation',
                  label: 'Virtual Video',
                  desc: 'Online video consultation',
                  icon: <Video className="w-4 h-4" />,
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFittingType(opt.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    fittingType === opt.id
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                    {opt.icon}
                    <span className="text-xs font-bold">{opt.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Preferred Date
              </label>
              <input
                type="date"
                required
                value={preferredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="10:00 AM - 12:00 PM">Morning (10:00 AM - 12:00 PM)</option>
                <option value="11:00 AM - 01:00 PM">Late Morning (11:00 AM - 01:00 PM)</option>
                <option value="02:00 PM - 04:00 PM">Afternoon (02:00 PM - 04:00 PM)</option>
                <option value="05:00 PM - 07:00 PM">Evening (05:00 PM - 07:00 PM)</option>
              </select>
            </div>
          </div>

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Your Full Name"
              placeholder="e.g. Aarav Sharma"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <Input
              label="Phone Number for Confirmation"
              placeholder="+91 98765 43210"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Customization Notes / Fabric Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Deep sweetheart back neck, Aari peacock embroidery, or need urgent fitting trial."
              className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              No prepayment required • Free cancellation
            </span>
            <div className="flex items-center space-x-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Confirm Appointment Booking
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
