import { prisma } from '../../database/prisma.js';

export class ServicesService {
  async getCategories() {
    return prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { benchmarkStartingPrice: 'asc' },
        },
      },
    });
  }

  async getServices(params?: { categorySlug?: string; gender?: string }) {
    const where: any = { isActive: true };

    if (params?.categorySlug) {
      where.category = { slug: params.categorySlug };
    }

    if (params?.gender) {
      where.gender = params.gender;
    }

    return prisma.service.findMany({
      where,
      include: { category: true },
      orderBy: { benchmarkStartingPrice: 'asc' },
    });
  }
}

export const servicesService = new ServicesService();
