import { prisma } from '../../database/prisma.js';
import { CreateRequestSchema } from '@tailorconnect/validation';
import { generateRequestNumber, calculateDistanceKm } from '@tailorconnect/utils';
import { z } from 'zod';

export class RequestsService {
  async create(customerId: string, data: z.infer<typeof CreateRequestSchema>) {
    const requestNumber = generateRequestNumber();

    const request = await prisma.customerRequest.create({
      data: {
        requestNumber,
        customerId,
        serviceId: data.serviceId || null,
        garmentType: data.garmentType,
        categoryName: data.categoryName,
        rawPrompt: data.rawPrompt,
        structuredRequirements: data.structuredRequirements || {},
        fabricProvidedByCustomer: data.fabricProvidedByCustomer,
        requiredDate: new Date(data.requiredDate),
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
        pickupRequired: data.pickupRequired,
        deliveryRequired: data.deliveryRequired,
        locationLocality: data.locationLocality,
        locationCity: data.locationCity,
        latitude: data.latitude ?? 17.4485,
        longitude: data.longitude ?? 78.3908,
        status: 'SUBMITTED',
        images: {
          create: (data.imageUrls || []).map(url => ({
            imageUrl: url,
          })),
        },
      },
      include: {
        images: true,
        customer: {
          include: { profile: true },
        },
      },
    });

    // Notify matching tailors within service radius
    try {
      const businesses = await prisma.business.findMany({
        where: {
          verificationStatus: 'VERIFIED',
          isAcceptingOrders: true,
        },
        include: { location: true, members: true },
      });

      for (const b of businesses) {
        if (!b.location) continue;
        const dist = calculateDistanceKm(request.latitude!, request.longitude!, b.location.latitude, b.location.longitude);
        if (dist <= b.serviceRadiusKm) {
          for (const member of b.members) {
            await prisma.notification.create({
              data: {
                userId: member.userId,
                title: `New Request: ${request.garmentType}`,
                body: `${request.customer.profile?.firstName || 'A customer'} is looking for ${request.garmentType} in ${request.locationLocality} (${dist} km away).`,
                linkUrl: `/tailor/requests/${request.id}`,
              },
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to notify tailors:', e);
    }

    return request;
  }

  async getMyRequests(customerId: string) {
    const requests = await prisma.customerRequest.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        images: true,
        quotes: {
          include: {
            business: {
              include: { location: true },
            },
          },
        },
      },
    });

    return requests.map(r => ({
      ...r,
      quotesCount: r.quotes.length,
      quotes: r.quotes.map(q => ({
        ...q,
        totalAmount: Number(q.totalAmount),
        advanceAmount: Number(q.advanceAmount),
      })),
    }));
  }

  async getTailorInbox(userId: string) {
    const member = await prisma.businessMember.findFirst({
      where: { userId },
      include: {
        business: {
          include: { location: true, services: true },
        },
      },
    });

    if (!member || !member.business.location) {
      return [];
    }

    const { business } = member;
    const allRequests = await prisma.customerRequest.findMany({
      where: {
        status: { in: ['SUBMITTED', 'MATCHING', 'QUOTED'] },
      },
      include: {
        images: true,
        quotes: {
          where: { businessId: business.id },
        },
        customer: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by radius and calculate distance
    return allRequests
      .map(req => {
        const distanceKm = calculateDistanceKm(
          business.location!.latitude,
          business.location!.longitude,
          req.latitude ?? 17.4485,
          req.longitude ?? 78.3908
        );
        return {
          ...req,
          distanceKm,
          alreadyQuoted: req.quotes.length > 0,
          customer: {
            firstName: req.customer.profile?.firstName || 'Customer',
            lastName: req.customer.profile?.lastName ? req.customer.profile.lastName.charAt(0) + '.' : '',
            approxLocation: req.customer.profile?.approxLocation || req.locationLocality,
          },
        };
      })
      .filter(r => r.distanceKm <= business.serviceRadiusKm);
  }

  async getById(id: string) {
    const request = await prisma.customerRequest.findUnique({
      where: { id },
      include: {
        images: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        quotes: {
          include: {
            business: {
              include: { location: true },
            },
            items: true,
          },
        },
        customer: {
          include: { profile: true },
        },
      },
    });

    if (!request) {
      throw { statusCode: 404, code: 'REQUEST_NOT_FOUND', message: 'Request not found' };
    }

    return {
      ...request,
      quotesCount: request.quotes.length,
      quotes: request.quotes.map(q => ({
        ...q,
        totalAmount: Number(q.totalAmount),
        advanceAmount: Number(q.advanceAmount),
        items: q.items.map(item => ({
          ...item,
          amount: Number(item.amount),
        })),
      })),
    };
  }

  async sendMessage(requestId: string, senderId: string, senderRole: any, content: string) {
    const message = await prisma.requestMessage.create({
      data: {
        requestId,
        senderId,
        senderRole,
        content,
      },
    });

    // Notify other party
    const request = await prisma.customerRequest.findUnique({
      where: { id: requestId },
      include: { customer: true },
    });

    if (request) {
      if (senderRole === 'BUSINESS') {
        await prisma.notification.create({
          data: {
            userId: request.customerId,
            title: `New question regarding ${request.garmentType}`,
            body: content.length > 80 ? `${content.substring(0, 80)}...` : content,
            linkUrl: `/app/requests/${requestId}`,
          },
        });
      }
    }

    return message;
  }

  async getMessages(requestId: string) {
    return prisma.requestMessage.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async cancel(requestId: string, customerId: string) {
    const request = await prisma.customerRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.customerId !== customerId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Cannot cancel this request' };
    }

    if (request.status === 'ACCEPTED') {
      throw { statusCode: 400, code: 'ALREADY_ACCEPTED', message: 'Accepted request with active order cannot be cancelled directly' };
    }

    return prisma.customerRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });
  }
}

export const requestsService = new RequestsService();
