export interface AppointmentBooking {
  id: string;
  bookingNumber: string;
  tailorId: string | number;
  tailorName: string;
  tailorAddress?: string;
  tailorImage?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  garmentType: string;
  fittingType: 'Atelier Visit' | 'Doorstep Measuring' | 'Virtual Video Consultation';
  date: string;
  timeSlot: string;
  notes?: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
}

const STORAGE_KEY = 'threadcraft_appointments';

export const initialMockAppointments: AppointmentBooking[] = [
  {
    id: 'apt-1',
    bookingNumber: 'TC-BK-2026-108',
    tailorId: 'tailor-4',
    tailorName: 'Royal Zari Heritage Studio',
    tailorAddress: 'Old City Zari Heritage Bazaar, Hyderabad',
    tailorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    garmentType: 'Bridal Maggam & Zardozi Silk Blouse',
    fittingType: 'Doorstep Measuring',
    date: '2026-10-16',
    timeSlot: '11:00 AM - 01:00 PM',
    notes: 'Please bring silk swatch samples and measuring tape for blouse neckline fitting.',
    status: 'Confirmed',
    createdAt: '2026-10-11T10:00:00Z',
  },
  {
    id: 'apt-2',
    bookingNumber: 'TC-BK-2026-094',
    tailorId: 'tailor-1',
    tailorName: 'Vance & Co. Bespoke Atelier',
    tailorAddress: '14 Savile Row, Mayfair, London',
    tailorImage: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&auto=format&fit=crop&q=80',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    garmentType: 'Bespoke Double-Breasted Suit',
    fittingType: 'Atelier Visit',
    date: '2026-10-18',
    timeSlot: '03:00 PM - 04:30 PM',
    notes: 'First basted fitting trial with master cutter.',
    status: 'Confirmed',
    createdAt: '2026-10-09T14:30:00Z',
  },
];

export const appointmentService = {
  getAppointments(): AppointmentBooking[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    // initialize with mock appointments
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockAppointments));
    return initialMockAppointments;
  },

  createAppointment(payload: {
    tailorId: string | number;
    tailorName: string;
    tailorAddress?: string;
    tailorImage?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    garmentType: string;
    fittingType: 'Atelier Visit' | 'Doorstep Measuring' | 'Virtual Video Consultation';
    date: string;
    timeSlot: string;
    notes?: string;
  }): AppointmentBooking {
    const list = this.getAppointments();
    const newAppointment: AppointmentBooking = {
      id: `apt-${Date.now()}`,
      bookingNumber: `TC-BK-2026-${Math.floor(100 + Math.random() * 900)}`,
      tailorId: payload.tailorId,
      tailorName: payload.tailorName,
      tailorAddress: payload.tailorAddress,
      tailorImage: payload.tailorImage,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      garmentType: payload.garmentType,
      fittingType: payload.fittingType,
      date: payload.date,
      timeSlot: payload.timeSlot,
      notes: payload.notes,
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
    };

    const updated = [newAppointment, ...list];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return newAppointment;
  },

  cancelAppointment(id: string): AppointmentBooking[] {
    const list = this.getAppointments();
    const updated = list.map((a) => (a.id === id ? { ...a, status: 'Cancelled' as const } : a));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  },

  rescheduleAppointment(id: string, date: string, timeSlot: string): AppointmentBooking[] {
    const list = this.getAppointments();
    const updated = list.map((a) => (a.id === id ? { ...a, date, timeSlot, status: 'Confirmed' as const } : a));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  },
};
