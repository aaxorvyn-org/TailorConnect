import { prisma } from '../../database/prisma.js';

export class AdminService {
  async getDashboardMetrics() {
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalBusinesses = await prisma.business.count();
    const verifiedBusinesses = await prisma.business.count({ where: { verificationStatus: 'VERIFIED' } });
    const pendingVerifications = await prisma.business.count({ where: { verificationStatus: 'PENDING' } });

    const activeOrders = await prisma.order.count({
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    });
    const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });

    const ordersSum = await prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalAmount: true },
    });

    const totalRevenue = Number(ordersSum._sum.totalAmount || 0);

    return {
      totalCustomers,
      totalBusinesses,
      verifiedBusinesses,
      pendingVerifications,
      activeOrders,
      completedOrders,
      totalRevenue,
    };
  }

  async getBusinesses(status?: string) {
    return prisma.business.findMany({
      where: status ? { verificationStatus: status as any } : undefined,
      include: {
        location: true,
        specializations: true,
        members: {
          include: { user: { include: { profile: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyBusiness(adminUserId: string, businessId: string) {
    const business = await prisma.business.update({
      where: { id: businessId },
      data: { verificationStatus: 'VERIFIED' },
      include: { members: true },
    });

    await prisma.adminAction.create({
      data: {
        adminUserId,
        actionType: 'VERIFY_BUSINESS',
        targetEntity: 'Business',
        targetId: businessId,
        reason: 'Verification criteria reviewed and approved',
      },
    });

    // Notify business members
    for (const m of business.members) {
      await prisma.notification.create({
        data: {
          userId: m.userId,
          title: 'Studio Verified!',
          body: `Congratulations! ${business.name} is now a verified studio on TailorConnect.`,
          linkUrl: '/tailor/profile',
        },
      });
    }

    return business;
  }

  async suspendBusiness(adminUserId: string, businessId: string, reason?: string) {
    const business = await prisma.business.update({
      where: { id: businessId },
      data: { verificationStatus: 'SUSPENDED', isAcceptingOrders: false },
    });

    await prisma.adminAction.create({
      data: {
        adminUserId,
        actionType: 'SUSPEND_BUSINESS',
        targetEntity: 'Business',
        targetId: businessId,
        reason: reason || 'Business suspended by platform administrator',
      },
    });

    return business;
  }

  async getOrders() {
    const orders = await prisma.order.findMany({
      include: {
        customer: { include: { profile: true } },
        business: { include: { location: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(o => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      paidAmount: Number(o.paidAmount),
    }));
  }

  async getReviews() {
    return prisma.review.findMany({
      include: {
        customer: { include: { profile: true } },
        business: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const adminService = new AdminService();
