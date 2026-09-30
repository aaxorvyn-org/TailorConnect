import { prisma } from '../../database/prisma.js';
import { OrderStatus } from '@prisma/client';

export class OrdersService {
  async getCustomerOrders(customerId: string) {
    const orders = await prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        business: {
          include: { location: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        appointments: {
          where: { status: 'CONFIRMED' },
          take: 1,
        },
        review: true,
      },
    });

    return orders.map(o => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      paidAmount: Number(o.paidAmount),
    }));
  }

  async getTailorOrders(userId: string) {
    const member = await prisma.businessMember.findFirst({
      where: { userId },
      include: { business: true },
    });

    if (!member) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Not authorized as a business' };
    }

    const orders = await prisma.order.findMany({
      where: { businessId: member.businessId },
      orderBy: { estimatedCompletion: 'asc' },
      include: {
        customer: {
          include: { profile: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        appointments: {
          orderBy: { date: 'asc' },
          take: 1,
        },
      },
    });

    const todayStr = new Date().toISOString().split('T')[0];

    const dueToday = orders.filter(
      o => o.estimatedCompletion.toISOString().split('T')[0] === todayStr &&
           !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.status)
    ).length;

    const inProgress = orders.filter(
      o => ['MEASUREMENT', 'CUTTING', 'STITCHING', 'FITTING', 'ALTERATION'].includes(o.status)
    ).length;

    const ready = orders.filter(o => o.status === 'READY' || o.status === 'OUT_FOR_DELIVERY').length;

    return {
      metrics: {
        dueToday,
        inProgress,
        ready,
        totalActive: orders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status)).length,
      },
      orders: orders.map(o => ({
        ...o,
        totalAmount: Number(o.totalAmount),
        paidAmount: Number(o.paidAmount),
      })),
    };
  }

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          include: { profile: true },
        },
        business: {
          include: { location: true },
        },
        quote: {
          include: { items: true },
        },
        request: {
          include: { images: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        appointments: {
          orderBy: { date: 'asc' },
        },
        payments: {
          include: { transactions: true },
          orderBy: { createdAt: 'desc' },
        },
        review: true,
      },
    });

    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order could not be found' };
    }

    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      paidAmount: Number(order.paidAmount),
      quote: order.quote ? {
        ...order.quote,
        totalAmount: Number(order.quote.totalAmount),
        advanceAmount: Number(order.quote.advanceAmount),
        items: order.quote.items.map(i => ({ ...i, amount: Number(i.amount) })),
      } : null,
      payments: order.payments.map(p => ({
        ...p,
        amount: Number(p.amount),
        transactions: p.transactions.map(t => ({ ...t, amount: Number(t.amount) })),
      })),
    };
  }

  async transitionStatus(orderId: string, userId: string, userRole: string, toStatus: OrderStatus, note?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        business: { include: { members: true } },
        customer: true,
      },
    });

    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' };
    }

    // Role check: Only assigned business members or admin can transition production states
    const isBusinessMember = order.business.members.some(m => m.userId === userId);
    if (!isBusinessMember && userRole !== 'ADMIN') {
      // Customer can only complete the order if it was marked DELIVERED
      if (userRole === 'CUSTOMER' && order.customerId === userId && toStatus === 'COMPLETED' && order.status === 'DELIVERED') {
        // Customer confirming completion is allowed
      } else {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only the assigned tailor studio can update production status' };
      }
    }

    // Validate state machine rule: cancelled order cannot move to production
    if (order.status === 'CANCELLED') {
      throw { statusCode: 422, code: 'INVALID_TRANSITION', message: 'Cancelled orders cannot transition to active status' };
    }

    const previousStatus = order.status;

    // Perform atomic transition and create OrderStatusHistory
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: toStatus,
          ...(toStatus === 'COMPLETED' ? { paymentStatus: 'PAID' } : {}),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: previousStatus,
          toStatus,
          changedById: userId,
          note: note || `Status transitioned from ${previousStatus} to ${toStatus}.`,
        },
      });

      // Update completedOrdersCount on business if COMPLETED
      if (toStatus === 'COMPLETED' && previousStatus !== 'COMPLETED') {
        await tx.business.update({
          where: { id: order.businessId },
          data: { completedOrdersCount: { increment: 1 } },
        });
      }

      // Notify customer
      const statusLabels: Record<string, string> = {
        MEASUREMENT: 'Measurements recorded & verified',
        CUTTING: 'Pattern cutting in progress',
        STITCHING: 'Stitching in progress',
        FITTING: 'Garment ready for trial/fitting',
        ALTERATION: 'Fitting adjustments in progress',
        READY: 'Garment is ready for pickup/delivery!',
        OUT_FOR_DELIVERY: 'Dispatched for doorstep delivery',
        DELIVERED: 'Delivered to customer',
        COMPLETED: 'Order marked complete. Thank you!',
      };

      await tx.notification.create({
        data: {
          userId: order.customerId,
          title: `Order Update: ${statusLabels[toStatus] || toStatus}`,
          body: note || `Your ${order.garmentName} is now in stage: ${toStatus}.`,
          linkUrl: `/app/orders/${order.id}`,
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  async addNote(orderId: string, authorId: string, content: string, isCustomerVisible = true) {
    return prisma.orderNote.create({
      data: {
        orderId,
        authorId,
        content,
        isCustomerVisible,
      },
    });
  }
}

export const ordersService = new OrdersService();
