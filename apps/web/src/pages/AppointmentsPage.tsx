import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@tailorconnect/api-client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate } from '../lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Plus,
  Scissors,
} from 'lucide-react';

export function AppointmentsPage() {
  const [searchParams] = useSearchParams();
  const targetBusinessId = searchParams.get('businessId') || '98501e74-06ec-41a0-ba07-27cf46399e52'; // default Meera Boutique or query
  const targetName = searchParams.get('name') || 'Meera Boutique';

  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Booking Form State
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [selectedDate, setSelectedDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [aptType, setAptType] = useState<'CONSULTATION' | 'MEASUREMENT' | 'FITTING' | 'PICKUP'>('MEASUREMENT');
  const [aptNotes, setAptNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const loadSchedule = async () => {
    setIsLoading(true);
    try {
      const res = await api.appointments.getMySchedule();
      if (res.success && res.data) {
        setAppointments(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      const res = await api.appointments.getAvailability(targetBusinessId, selectedDate);
      if (res.success && res.data) {
        setAvailableSlots(res.data.slots || []);
        if (res.data.slots?.length > 0) setSelectedSlot(res.data.slots[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  useEffect(() => {
    loadSlots();
  }, [selectedDate, targetBusinessId]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setIsBooking(true);
    try {
      const [h, m] = selectedSlot.split(':').map(Number);
      const endM = m + 30;
      const endSlot = `${String(h + Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`;

      const res = await api.appointments.create({
        businessId: targetBusinessId,
        type: aptType,
        date: selectedDate,
        startTime: selectedSlot,
        endTime: endSlot,
        notes: aptNotes,
      });

      if (res.success) {
        setBookingSuccess(true);
        await loadSchedule();
        setAptNotes('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Fitting & Measurement Appointments
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Schedule in-studio fitting trials or doorstep measurements with your tailor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Book New Appointment */}
        <div className="space-y-6">
          <Card className="border-amber-200/80 bg-amber-50/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                Book Studio Slot
              </CardTitle>
              <p className="text-xs text-stone-500">Booking with {targetName}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Appointment Type</label>
                  <select
                    value={aptType}
                    onChange={(e) => setAptType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="MEASUREMENT">Body Measurement & Fabric Drop</option>
                    <option value="FITTING">Trial & Fitting Session</option>
                    <option value="CONSULTATION">Design Consultation</option>
                    <option value="PICKUP">Garment Pickup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2.5 rounded-lg border border-stone-200 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Available 30-min Slots</label>
                  {availableSlots.length === 0 ? (
                    <p className="text-stone-400 italic">No available slots on this day.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {availableSlots.map((slot) => (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-1 rounded-lg text-center font-medium transition-colors ${
                            selectedSlot === slot
                              ? 'bg-slate-900 text-white font-bold'
                              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={aptNotes}
                    onChange={(e) => setAptNotes(e.target.value)}
                    placeholder="e.g. Sleeves trial and back neckline adjustment"
                    className="w-full p-2 rounded-lg border border-stone-200"
                  />
                </div>

                {bookingSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Appointment confirmed! Added to your schedule.</span>
                  </div>
                )}

                <Button type="submit" size="md" className="w-full" isLoading={isBooking} disabled={!selectedSlot}>
                  Confirm Appointment Booking
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Scheduled Appointments List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-lg text-stone-900">Your Scheduled Visits & Trials</h2>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-stone-400">Loading schedule...</div>
          ) : appointments.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-6 h-6 text-stone-400" />}
              title="No upcoming visits scheduled"
              description="Book a measurement or trial session to verify fitting before final stitching is finished."
            />
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <Card key={apt.id} className="hover:shadow-sm">
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-stone-400">{apt.appointmentNumber}</span>
                        <h3 className="font-bold text-stone-900 capitalize">{apt.type.toLowerCase()} Appointment</h3>
                        <Badge variant="gold">{apt.status}</Badge>
                      </div>

                      <p className="text-xs text-stone-600 flex items-center gap-3">
                        <span className="font-semibold text-stone-900">{apt.business?.name}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {formatDate(apt.date)}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {apt.startTime} – {apt.endTime}
                        </span>
                      </p>

                      {apt.notes && (
                        <p className="text-xs text-stone-500 italic">Notes: "{apt.notes}"</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
