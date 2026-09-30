import { Router, Request, Response, NextFunction } from 'express';
import { reviewsService } from './reviews.service.js';
import { authenticate } from '../../common/middleware/auth.js';
import { validateBody } from '../../common/middleware/validate.js';
import { CreateReviewSchema } from '@tailorconnect/validation';

export const reviewsRouter = Router();

reviewsRouter.post('/', authenticate, validateBody(CreateReviewSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await reviewsService.create(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

reviewsRouter.get('/business/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await reviewsService.getByBusiness(req.params.businessId);
    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});
