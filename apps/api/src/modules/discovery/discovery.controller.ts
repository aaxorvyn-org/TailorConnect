import { Router, Request, Response, NextFunction } from 'express';
import { discoveryService } from './discovery.service.js';

export const discoveryRouter = Router();

discoveryRouter.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      q,
      category,
      serviceId,
      lat,
      lng,
      radiusKm,
      maxPrice,
      maxDays,
      pickupOnly,
    } = req.query;

    const results = await discoveryService.search({
      q: q ? String(q) : undefined,
      category: category ? String(category) : undefined,
      serviceId: serviceId ? String(serviceId) : undefined,
      lat: lat ? parseFloat(String(lat)) : undefined,
      lng: lng ? parseFloat(String(lng)) : undefined,
      radiusKm: radiusKm ? parseFloat(String(radiusKm)) : undefined,
      maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
      maxDays: maxDays ? parseInt(String(maxDays), 10) : undefined,
      pickupOnly: pickupOnly === 'true',
    });

    res.json({
      success: true,
      data: results,
      meta: {
        total: results.length,
      },
    });
  } catch (error) {
    next(error);
  }
});
