import React, { useState, useEffect } from 'react';
import { api } from '@tailorconnect/api-client';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate } from '../lib/utils';
import { Calendar, Clock, CheckCircle2, XCircle, Phone } from 'lucide-react';

export function TailorSchedulePage() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSchedule = async () => {
    setIsLoading(true);
    try {
      const res = await api.appointments.getMySchedule();
      if (res.success && res.data) {
        setSchedule(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.appointments.updateStatus(id, status);
      await loadSchedule();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Studio Fitting & Consultation Schedule
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Review booked customer fitting trials, measurements, and pickups.
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-stone-400">Loading appointments...</div>
      ) : schedule.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-6 h-6 text-stone-400" />}
          title="No booked sessions on calendar"
          description="Customer bookings for body measurements and fitting trials will automatically appear here."
        />
      ) : (
        <div className="space-y-3">
          {schedule.map((apt) => (
            <Card key={apt.id} className="hover:shadow-sm">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-stone-400">{apt.appointmentNumber}</span>
                    <h3 className="font-bold text-stone-900 capitalize">{apt.type.toLowerCase()} Session</h3>
                    <Badge variant="gold">{apt.status}</Badge>
                  </div>

                  <p className="text-xs text-stone-600 flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-stone-900">
                      Customer: {apt.customer?.profile?.firstName} {apt.customer?.profile?.lastName}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {formatDate(apt.date)}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-bold text-stone-800">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {apt.startTime} – {apt.endTime}
                    </span>
                  </p>

                  {apt.notes && <p className="text-xs text-stone-500 italic">"{apt.notes}"</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {apt.status === 'CONFIRMED' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Mark Completed
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
