import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database/prisma.js';
import { config } from '../../config/index.js';
import { RegisterSchema, LoginSchema } from '@tailorconnect/validation';
import { z } from 'zod';

export class AuthService {
  async register(data: z.infer<typeof RegisterSchema>) {
    // Check if user already exists
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingEmail) {
        throw { statusCode: 409, code: 'EMAIL_EXISTS', message: 'An account with this email already exists' };
      }
    }

    if (data.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existingPhone) {
        throw { statusCode: 409, code: 'PHONE_EXISTS', message: 'An account with this phone number already exists' };
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email || null,
        phone: data.phone || null,
        passwordHash,
        role: data.role as any,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName || null,
          },
        },
        preferences: {
          create: {},
        },
      },
      include: {
        profile: true,
        memberships: {
          include: { business: true },
        },
      },
    });

    const tokens = this.generateTokens(user.id, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(data: z.infer<typeof LoginSchema>) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.identifier },
          { phone: data.identifier },
        ],
      },
      include: {
        profile: true,
        memberships: {
          include: { business: { include: { location: true } } },
        },
      },
    });

    if (!user) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' };
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' };
    }

    if (!user.isActive) {
      throw { statusCode: 403, code: 'ACCOUNT_SUSPENDED', message: 'Your account has been deactivated' };
    }

    const tokens = this.generateTokens(user.id, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        memberships: {
          include: { business: { include: { location: true } } },
        },
      },
    });

    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    return this.sanitizeUser(user);
  }

  async syncClerkUser(data: {
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: 'CUSTOMER' | 'TAILOR';
    phone?: string;
  }) {
    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
      include: {
        profile: true,
        memberships: {
          include: { business: true },
        },
      },
    });

    if (!existingUser) {
      const dummyPasswordHash = await bcrypt.hash(data.clerkId, 10);
      existingUser = await prisma.user.create({
        data: {
          email: data.email,
          phone: data.phone || null,
          passwordHash: dummyPasswordHash,
          role: (data.role as any) || 'CUSTOMER',
          isEmailVerified: true,
          profile: {
            create: {
              firstName: data.firstName || data.email.split('@')[0],
              lastName: data.lastName || null,
            },
          },
          preferences: {
            create: {},
          },
        },
        include: {
          profile: true,
          memberships: {
            include: { business: true },
          },
        },
      });
    }

    const tokens = this.generateTokens(existingUser.id, existingUser.role);
    return {
      user: this.sanitizeUser(existingUser),
      ...tokens,
    };
  }

  generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign(
      { userId, role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    const refreshToken = jwt.sign(
      { userId },
      config.refreshTokenSecret,
      { expiresIn: config.refreshTokenExpiresIn as any }
    );

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const business = user.memberships?.[0]?.business || null;
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt.toISOString(),
      profile: user.profile ? {
        id: user.profile.id,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        avatarUrl: user.profile.avatarUrl,
        city: user.profile.city,
        state: user.profile.state,
        approxLocation: user.profile.approxLocation,
      } : null,
      business: business ? {
        id: business.id,
        name: business.name,
        slug: business.slug,
        businessType: business.businessType,
        verificationStatus: business.verificationStatus,
        ratingAverage: Number(business.ratingAverage),
        totalReviewsCount: business.totalReviewsCount,
        completedOrdersCount: business.completedOrdersCount,
        location: business.location,
      } : null,
    };
  }
}

export const authService = new AuthService();
