import { Router, Request, Response, NextFunction } from 'express';
import { servicesService } from './services.service.js';

export const servicesRouter = Router();

servicesRouter.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await servicesService.getCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

servicesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categorySlug, gender } = req.query as { categorySlug?: string; gender?: string };
    const services = await servicesService.getServices({ categorySlug, gender });
    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
});
