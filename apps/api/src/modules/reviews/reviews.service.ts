import { prisma } from '../../database/prisma.js';
import { CreateReviewSchema } from '@tailorconnect/validation';
import { z } from 'zod';

export class ReviewsService {
  async create(customerId: string, data: z.infer<typeof CreateReviewSchema>) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' };
    }

    if (order.customerId !== customerId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only the ordering customer can leave a review' };
    }

    // Must be COMPLETED
    if (order.status !== 'COMPLETED') {
      throw { statusCode: 400, code: 'ORDER_NOT_COMPLETED', message: 'Reviews can only be submitted after the garment order is marked completed' };
    }

    // Check duplicate
    const existing = await prisma.review.findUnique({
      where: { orderId: data.orderId },
    });
    if (existing) {
      throw { statusCode: 409, code: 'ALREADY_REVIEWED', message: 'A review has already been submitted for this order' };
    }

    const review = await prisma.$transaction(async (tx) => {
      const rev = await tx.review.create({
        data: {
          orderId: data.orderId,
          customerId,
          businessId: order.businessId,
          rating: data.rating,
          serviceType: data.serviceType,
          comment: data.comment,
          fitRating: data.fitRating || data.rating,
          finishingRating: data.finishingRating || data.rating,
        },
      });

      // Recalculate Business ratingAverage and totalReviewsCount
      const aggregates = await tx.review.aggregate({
        where: { businessId: order.businessId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.business.update({
        where: { id: order.businessId },
        data: {
          ratingAverage: aggregates._avg.rating || data.rating,
          totalReviewsCount: aggregates._count.rating,
        },
      });

      return rev;
    });

    return review;
  }

  async getByBusiness(businessId: string) {
    const reviews = await prisma.review.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          include: { profile: true },
        },
      },
    });

    return reviews.map(r => ({
      id: r.id,
      orderId: r.orderId,
      customerId: r.customerId,
      businessId: r.businessId,
      rating: r.rating,
      serviceType: r.serviceType,
      comment: r.comment,
      fitRating: r.fitRating,
      finishingRating: r.finishingRating,
      createdAt: r.createdAt.toISOString(),
      customerName: `${r.customer.profile?.firstName || 'Customer'} ${r.customer.profile?.lastName ? r.customer.profile.lastName.charAt(0) + '.' : ''}`,
    }));
  }
}

export const reviewsService = new ReviewsService();
