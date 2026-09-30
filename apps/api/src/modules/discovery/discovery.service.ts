import { prisma } from '../../database/prisma.js';
import { calculateDistanceKm } from '@tailorconnect/utils';

export interface DiscoverySearchParams {
  q?: string;
  category?: string;
  serviceId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  maxPrice?: number;
  maxDays?: number;
  pickupOnly?: boolean;
}

export class DiscoveryService {
  async search(params: DiscoverySearchParams) {
    // Default search center to Hyderabad Hitec/Madhapur (17.4485, 78.3908) if not supplied
    const userLat = params.lat ?? 17.4485;
    const userLng = params.lng ?? 78.3908;
    const searchRadius = params.radiusKm ?? 25;

    // 1. Fetch only VERIFIED and actively order-accepting businesses
    const businesses = await prisma.business.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        isAcceptingOrders: true,
        ...(params.pickupOnly ? { offersHomePickup: true } : {}),
        ...(params.maxPrice ? { startingPrice: { lte: params.maxPrice } } : {}),
        ...(params.maxDays ? { typicalTurnaroundDays: { lte: params.maxDays } } : {}),
      },
      include: {
        location: true,
        specializations: true,
        services: {
          include: { service: { include: { category: true } } },
        },
      },
    });

    const results = [];

    for (const b of businesses) {
      if (!b.location) continue;

      // 2. Spatial Filtering (Haversine)
      const distanceKm = calculateDistanceKm(userLat, userLng, b.location.latitude, b.location.longitude);

      // Check if inside either the customer's search radius or tailor's service radius
      if (distanceKm > Math.max(searchRadius, b.serviceRadiusKm)) {
        continue;
      }

      // 3. Category / Service Capability Filtering
      const matchesCategory = !params.category || b.services.some(s =>
        s.service.category.slug.toLowerCase().includes(params.category!.toLowerCase()) ||
        s.service.category.name.toLowerCase().includes(params.category!.toLowerCase())
      );

      const matchesQuery = !params.q || (
        b.name.toLowerCase().includes(params.q.toLowerCase()) ||
        b.specializations.some(spec => spec.tag.toLowerCase().includes(params.q!.toLowerCase())) ||
        b.services.some(s => s.service.name.toLowerCase().includes(params.q!.toLowerCase()))
      );

      if (!matchesCategory && !matchesQuery) {
        continue;
      }

      // 4. Generate Explainable Match Reasons
      const matchReasons: string[] = [];

      // Specialization match
      const matchingSpec = b.specializations.find(spec =>
        params.q && spec.tag.toLowerCase().includes(params.q.toLowerCase())
      );
      if (matchingSpec) {
        matchReasons.push(`✓ ${matchingSpec.tag} specialist`);
      } else if (b.specializations.length > 0) {
        matchReasons.push(`✓ ${b.specializations[0].tag} specialist`);
      }

      // Proximity
      matchReasons.push(`✓ ${distanceKm} km away (Service radius ${b.serviceRadiusKm} km)`);

      // Turnaround
      matchReasons.push(`✓ Fast ${b.typicalTurnaroundDays}-day typical turnaround`);

      // Ratings & Reliability
      if (Number(b.ratingAverage) >= 4.7) {
        matchReasons.push(`✓ High rating ${Number(b.ratingAverage).toFixed(1)} ★ (${b.completedOrdersCount}+ garments crafted)`);
      }

      // Home Services
      if (b.offersHomePickup) {
        matchReasons.push(`✓ Doorstep pickup & delivery available`);
      }

      // 5. Calculate Weighted Compatibility Score (0 - 100)
      let score = 50;

      // Distance score (max 25 pts)
      const distRatio = Math.max(0, 1 - (distanceKm / b.serviceRadiusKm));
      score += distRatio * 25;

      // Rating score (max 15 pts)
      score += (Number(b.ratingAverage) / 5) * 15;

      // Specialization direct match (max 10 pts)
      if (matchingSpec) score += 10;

      results.push({
        id: b.id,
        name: b.name,
        slug: b.slug,
        businessType: b.businessType,
        verificationStatus: b.verificationStatus,
        description: b.description,
        coverImageUrl: b.coverImageUrl,
        logoUrl: b.logoUrl,
        phone: b.phone,
        email: b.email,
        typicalTurnaroundDays: b.typicalTurnaroundDays,
        startingPrice: Number(b.startingPrice),
        serviceRadiusKm: b.serviceRadiusKm,
        offersHomePickup: b.offersHomePickup,
        offersHomeDelivery: b.offersHomeDelivery,
        offersHomeMeasurement: b.offersHomeMeasurement,
        requiresAppointment: b.requiresAppointment,
        ratingAverage: Number(b.ratingAverage),
        totalReviewsCount: b.totalReviewsCount,
        completedOrdersCount: b.completedOrdersCount,
        isAcceptingOrders: b.isAcceptingOrders,
        location: b.location,
        specializations: b.specializations.map(s => s.tag),
        distanceKm,
        matchScore: Math.round(score),
        matchReasons,
      });
    }

    // Sort by Match Score descending, then Distance ascending
    results.sort((a, b) => b.matchScore - a.matchScore || a.distanceKm - b.distanceKm);

    return results;
  }
}

export const discoveryService = new DiscoveryService();
