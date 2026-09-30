import { prisma } from '../../database/prisma.js';
import { CreateQuoteSchema } from '@tailorconnect/validation';
import { generateQuoteNumber, generateOrderNumber } from '@tailorconnect/utils';
import { z } from 'zod';

export class QuotesService {
  async create(userId: string, data: z.infer<typeof CreateQuoteSchema>) {
    const member = await prisma.businessMember.findFirst({
      where: { userId },
      include: { business: true },
    });

    if (!member) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only registered tailor studios can submit quotes' };
    }

    const request = await prisma.customerRequest.findUnique({
      where: { id: data.requestId },
      include: { customer: true },
    });

    if (!request) {
      throw { statusCode: 404, code: 'REQUEST_NOT_FOUND', message: 'Request not found' };
    }

    // Check if quote already exists from this business
    const existingQuote = await prisma.quote.findFirst({
      where: { requestId: data.requestId, businessId: member.businessId },
    });

    if (existingQuote) {
      throw { statusCode: 409, code: 'ALREADY_QUOTED', message: 'Your studio has already submitted a quote for this request' };
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (data.validDays || 7));

    const quote = await prisma.quote.create({
      data: {
        quoteNumber: generateQuoteNumber(),
        requestId: data.requestId,
        businessId: member.businessId,
        totalAmount: data.totalAmount,
        advanceAmount: data.advanceAmount || 0,
        estimatedReadyDate: new Date(data.estimatedReadyDate),
        fittingsIncluded: data.fittingsIncluded,
        notes: data.notes || null,
        validUntil,
        status: 'SENT',
        items: {
          create: data.items.map(item => ({
            title: item.title,
            description: item.description || null,
            amount: item.amount,
          })),
        },
      },
      include: {
        items: true,
        business: true,
      },
    });

    // Update request status to QUOTED if still SUBMITTED
    if (request.status === 'SUBMITTED' || request.status === 'MATCHING') {
      await prisma.customerRequest.update({
        where: { id: data.requestId },
        data: { status: 'QUOTED' },
      });
    }

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: request.customerId,
        title: `Quote Received for ${request.garmentType}`,
        body: `${member.business.name} sent a quote of ₹${data.totalAmount} ready by ${data.estimatedReadyDate}.`,
        linkUrl: `/app/requests/${request.id}`,
      },
    });

    return quote;
  }

  async getByRequest(requestId: string) {
    const quotes = await prisma.quote.findMany({
      where: { requestId },
      include: {
        business: {
          include: { location: true },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return quotes.map(q => ({
      ...q,
      totalAmount: Number(q.totalAmount),
      advanceAmount: Number(q.advanceAmount),
      items: q.items.map(i => ({ ...i, amount: Number(i.amount) })),
    }));
  }

  async accept(quoteId: string, customerId: string, paymentOption = 'ONLINE') {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        request: true,
        business: { include: { members: true } },
        items: true,
      },
    });

    if (!quote) {
      throw { statusCode: 404, code: 'QUOTE_NOT_FOUND', message: 'Quote not found' };
    }

    if (quote.request.customerId !== customerId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Unauthorized to accept this quote' };
    }

    if (quote.status === 'ACCEPTED') {
      throw { statusCode: 400, code: 'ALREADY_ACCEPTED', message: 'This quote is already accepted' };
    }

    const orderNumber = generateOrderNumber();

    // Transactional acceptance: update quote, update request, decline other quotes, create Order
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark quote accepted
      await tx.quote.update({
        where: { id: quoteId },
        data: { status: 'ACCEPTED' },
      });

      // 2. Mark competing quotes declined
      await tx.quote.updateMany({
        where: {
          requestId: quote.requestId,
          id: { not: quoteId },
        },
        data: { status: 'DECLINED' },
      });

      // 3. Mark request accepted
      await tx.customerRequest.update({
        where: { id: quote.requestId },
        data: { status: 'ACCEPTED' },
      });

      // 4. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          businessId: quote.businessId,
          requestId: quote.requestId,
          quoteId: quote.id,
          garmentName: quote.request.garmentType,
          status: 'ACCEPTED',
          totalAmount: quote.totalAmount,
          paidAmount: 0,
          paymentStatus: 'PENDING',
          estimatedCompletion: quote.estimatedReadyDate,
          deliveryOption: quote.request.deliveryRequired ? 'HOME_DELIVERY' : 'PICKUP',
          customerNotes: quote.notes,
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: 'ACCEPTED',
              changedById: customerId,
              note: `Quote accepted by customer with ${paymentOption} payment selection.`,
            },
          },
        },
        include: {
          business: { include: { location: true } },
          statusHistory: true,
        },
      });

      // 5. Notify tailor
      for (const m of quote.business.members) {
        await tx.notification.create({
          data: {
            userId: m.userId,
            title: `Quote Accepted: Order ${orderNumber}`,
            body: `Customer accepted your quote of ₹${Number(quote.totalAmount)} for ${quote.request.garmentType}. Order has been initiated!`,
            linkUrl: `/tailor/orders/${order.id}`,
          },
        });
      }

      return order;
    });

    return {
      order: {
        ...result,
        totalAmount: Number(result.totalAmount),
        paidAmount: Number(result.paidAmount),
      },
    };
  }

  async decline(quoteId: string, customerId: string) {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { request: true },
    });

    if (!quote || quote.request.customerId !== customerId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Unauthorized to decline this quote' };
    }

    return prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'DECLINED' },
    });
  }
}

export const quotesService = new QuotesService();
