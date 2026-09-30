import { prisma } from '../../database/prisma.js';
import { BusinessOnboardingSchema } from '@tailorconnect/validation';
import { slugify } from '@tailorconnect/utils';
import { z } from 'zod';

export class BusinessesService {
  async onboard(userId: string, data: z.infer<typeof BusinessOnboardingSchema>) {
    // Generate unique slug
    let baseSlug = slugify(data.name);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const business = await prisma.business.create({
      data: {
        name: data.name,
        slug,
        businessType: data.businessType as any,
        description: data.description,
        phone: data.phone,
        email: data.email || null,
        typicalTurnaroundDays: data.typicalTurnaroundDays,
        startingPrice: data.startingPrice,
        serviceRadiusKm: data.serviceRadiusKm,
        offersHomePickup: data.offersHomePickup,
        offersHomeDelivery: data.offersHomeDelivery,
        offersHomeMeasurement: data.offersHomeMeasurement,
        requiresAppointment: data.requiresAppointment,
        workingHours: data.workingHours || {},
        languagesSpoken: data.languagesSpoken,
        location: {
          create: {
            addressLine1: data.location.addressLine1,
            addressLine2: data.location.addressLine2,
            landmark: data.location.landmark,
            locality: data.location.locality,
            city: data.location.city,
            state: data.location.state,
            postalCode: data.location.postalCode,
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          },
        },
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
        specializations: {
          createMany: {
            data: data.specializations.map(tag => ({ tag })),
          },
        },
        ...(data.services && data.services.length > 0 ? {
          services: {
            createMany: {
              data: data.services.map(s => ({
                serviceId: s.serviceId,
                basePrice: s.basePrice,
                estimatedDays: s.estimatedDays,
              })),
            },
          },
        } : {}),
      },
      include: {
        location: true,
        specializations: true,
        services: { include: { service: true } },
      },
    });

    // Update user role to BUSINESS if not already
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'BUSINESS' },
    });

    return business;
  }

  async getMyBusiness(userId: string) {
    const member = await prisma.businessMember.findFirst({
      where: { userId },
      include: {
        business: {
          include: {
            location: true,
            specializations: true,
            services: { include: { service: true } },
            portfolioItems: { orderBy: { displayOrder: 'asc' } },
          },
        },
      },
    });

    if (!member) {
      throw { statusCode: 404, code: 'BUSINESS_NOT_FOUND', message: 'No registered studio found for this account' };
    }

    return member.business;
  }

  async updateMyBusiness(userId: string, data: any) {
    const member = await prisma.businessMember.findFirst({
      where: { userId },
    });

    if (!member) {
      throw { statusCode: 404, code: 'BUSINESS_NOT_FOUND', message: 'No registered studio found' };
    }

    const { location, specializations, ...businessData } = data;

    const updated = await prisma.business.update({
      where: { id: member.businessId },
      data: {
        ...businessData,
        ...(location ? {
          location: {
            upsert: {
              create: location,
              update: location,
            },
          },
        } : {}),
      },
      include: {
        location: true,
        specializations: true,
        services: { include: { service: true } },
        portfolioItems: true,
      },
    });

    if (specializations && Array.isArray(specializations)) {
      await prisma.businessSpecialization.deleteMany({ where: { businessId: member.businessId } });
      await prisma.businessSpecialization.createMany({
        data: specializations.map(tag => ({ businessId: member.businessId, tag })),
      });
    }

    return updated;
  }

  async getPublicProfile(slugOrId: string) {
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          { id: slugOrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? slugOrId : undefined },
        ],
      },
      include: {
        location: true,
        specializations: true,
        services: {
          include: { service: { include: { category: true } } },
        },
        portfolioItems: {
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            customer: {
              include: { profile: true },
            },
          },
        },
      },
    });

    if (!business) {
      throw { statusCode: 404, code: 'BUSINESS_NOT_FOUND', message: 'Tailor studio could not be found' };
    }

    return {
      ...business,
      ratingAverage: Number(business.ratingAverage),
      startingPrice: Number(business.startingPrice),
      reviews: business.reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        serviceType: r.serviceType,
        comment: r.comment,
        fitRating: r.fitRating,
        finishingRating: r.finishingRating,
        createdAt: r.createdAt.toISOString(),
        customerName: `${r.customer.profile?.firstName || 'Customer'} ${r.customer.profile?.lastName ? r.customer.profile.lastName.charAt(0) + '.' : ''}`,
      })),
    };
  }

  async addPortfolioItem(userId: string, data: any) {
    const member = await prisma.businessMember.findFirst({ where: { userId } });
    if (!member) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Studio not found' };

    return prisma.businessPortfolio.create({
      data: {
        businessId: member.businessId,
        imageUrl: data.imageUrl,
        title: data.title,
        category: data.category || 'General',
        garmentType: data.garmentType || 'Custom Garment',
        description: data.description,
      },
    });
  }

  async deletePortfolioItem(userId: string, itemId: string) {
    const member = await prisma.businessMember.findFirst({ where: { userId } });
    if (!member) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Studio not found' };

    await prisma.businessPortfolio.deleteMany({
      where: { id: itemId, businessId: member.businessId },
    });

    return { message: 'Item deleted' };
  }
}

export const businessesService = new BusinessesService();
