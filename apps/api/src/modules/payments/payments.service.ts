import { prisma } from '../../database/prisma.js';
import { RecordOfflinePaymentSchema } from '@tailorconnect/validation';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { z } from 'zod';

export class PaymentsService {
  async createIntent(orderId: string, amount: number, method: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' };
    }

    // Mock payment gateway adapter simulation
    const paymentNumber = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transactionRef = `MOCK-TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          paymentNumber,
          orderId,
          amount,
          method: method as PaymentMethod,
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          notes: 'Online test payment processed successfully',
          transactions: {
            create: {
              transactionRef,
              amount,
              gatewayName: 'MOCK_ADAPTER',
              status: PaymentStatus.PAID,
              gatewayResponse: {
                status: 'captured',
                mockSignature: 'sig_mock_verified_true',
              },
            },
          },
        },
      });

      // Update Order paid amount and payment status
      const newPaidAmount = Number(order.paidAmount) + amount;
      const isFullyPaid = newPaidAmount >= Number(order.totalAmount);

      await tx.order.update({
        where: { id: orderId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID,
        },
      });

      return p;
    });

    return {
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      transactionRef,
      status: 'PAID',
    };
  }

  async recordOffline(userId: string, data: z.infer<typeof RecordOfflinePaymentSchema>) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        business: { include: { members: true } },
      },
    });

    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' };
    }

    // Verify authorized tailor member
    const isMember = order.business.members.some(m => m.userId === userId);
    if (!isMember) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only the assigned tailor studio can record offline payments' };
    }

    const paymentNumber = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transactionRef = data.transactionRef || `OFFLINE-${Date.now()}`;

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          paymentNumber,
          orderId: data.orderId,
          amount: data.amount,
          method: data.method as PaymentMethod,
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          notes: data.notes || 'In-store payment recorded by tailor',
          transactions: {
            create: {
              transactionRef,
              amount: data.amount,
              gatewayName: 'IN_PERSON_MANUAL',
              status: PaymentStatus.PAID,
            },
          },
        },
      });

      const newPaidAmount = Number(order.paidAmount) + data.amount;
      const isFullyPaid = newPaidAmount >= Number(order.totalAmount);

      await tx.order.update({
        where: { id: data.orderId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID,
        },
      });

      // Notify customer
      await tx.notification.create({
        data: {
          userId: order.customerId,
          title: `Payment Received: ₹${data.amount}`,
          body: `${order.business.name} confirmed receipt of ₹${data.amount} via ${data.method.replace('_', ' ')}.`,
          linkUrl: `/app/orders/${order.id}`,
        },
      });

      return p;
    });

    return payment;
  }

  async getOrderPayments(orderId: string) {
    const payments = await prisma.payment.findMany({
      where: { orderId },
      include: { transactions: true },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map(p => ({
      ...p,
      amount: Number(p.amount),
      transactions: p.transactions.map(t => ({ ...t, amount: Number(t.amount) })),
    }));
  }
}

export const paymentsService = new PaymentsService();
