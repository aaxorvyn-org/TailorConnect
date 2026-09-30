import { prisma } from '../../database/prisma.js';
import { CreateAppointmentSchema } from '@tailorconnect/validation';
import { AppointmentStatus, AppointmentType } from '@prisma/client';
import { z } from 'zod';

export class AppointmentsService {
  async getAvailability(businessId: string, dateStr: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw { statusCode: 404, code: 'BUSINESS_NOT_FOUND', message: 'Studio not found' };
    }

    const date = new Date(dateStr);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = dayNames[date.getDay()];

    const workingHours = (business.workingHours as any)?.[dayKey] || { open: '10:00', close: '19:00' };

    // Generate 30-minute intervals
    const [startHour, startMin] = workingHours.open.split(':').map(Number);
    const [endHour, endMin] = workingHours.close.split(':').map(Number);

    const allSlots: string[] = [];
    let currentMin = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMin + 30 <= endMinutes) {
      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;
      allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      currentMin += 30;
    }

    // Find already booked slots on this date
    const booked = await prisma.appointment.findMany({
      where: {
        businessId,
        date,
        status: { in: ['REQUESTED', 'CONFIRMED'] },
      },
      select: { startTime: true },
    });

    const bookedSet = new Set(booked.map(b => b.startTime));
    const availableSlots = allSlots.filter(s => !bookedSet.has(s));

    return {
      date: dateStr,
      workingHours,
      slots: availableSlots,
    };
  }

  async create(customerId: string, data: z.infer<typeof CreateAppointmentSchema>) {
    const appointmentNumber = `APT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const appointment = await prisma.appointment.create({
      data: {
        appointmentNumber,
        customerId,
        businessId: data.businessId,
        orderId: data.orderId || null,
        type: data.type as AppointmentType,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes || null,
        status: AppointmentStatus.CONFIRMED,
      },
      include: {
        business: true,
        customer: { include: { profile: true } },
      },
    });

    // Notify tailor
    const businessMembers = await prisma.businessMember.findMany({
      where: { businessId: data.businessId },
    });

    for (const m of businessMembers) {
      await prisma.notification.create({
        data: {
          userId: m.userId,
          title: `New Appointment: ${data.type}`,
          body: `${appointment.customer.profile?.firstName || 'A customer'} booked a ${data.type} on ${data.date} at ${data.startTime}.`,
          linkUrl: '/tailor/schedule',
        },
      });
    }

    return appointment;
  }

  async getMySchedule(userId: string, role: string) {
    if (role === 'BUSINESS') {
      const member = await prisma.businessMember.findFirst({ where: { userId } });
      if (!member) return [];

      return prisma.appointment.findMany({
        where: { businessId: member.businessId },
        orderBy: { date: 'asc' },
        include: {
          customer: { include: { profile: true } },
          order: true,
        },
      });
    }

    return prisma.appointment.findMany({
      where: { customerId: userId },
      orderBy: { date: 'asc' },
      include: {
        business: { include: { location: true } },
        order: true,
      },
    });
  }

  async updateStatus(appointmentId: string, status: AppointmentStatus) {
    return prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });
  }
}

export const appointmentsService = new AppointmentsService();
