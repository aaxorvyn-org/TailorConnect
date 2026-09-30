import { Router, Request, Response, NextFunction } from 'express';
import { businessesService } from './businesses.service.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { validateBody } from '../../common/middleware/validate.js';
import { BusinessOnboardingSchema } from '@tailorconnect/validation';

export const businessesRouter = Router();

businessesRouter.post('/', authenticate, validateBody(BusinessOnboardingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const business = await businessesService.onboard(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
});

businessesRouter.get('/my-business', authenticate, requireRole('BUSINESS', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const business = await businessesService.getMyBusiness(req.user!.id);
    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
});

businessesRouter.patch('/my-business', authenticate, requireRole('BUSINESS', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await businessesService.updateMyBusiness(req.user!.id, req.body);
    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

businessesRouter.post('/my-business/portfolio', authenticate, requireRole('BUSINESS', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await businessesService.addPortfolioItem(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

businessesRouter.delete('/my-business/portfolio/:id', authenticate, requireRole('BUSINESS', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await businessesService.deletePortfolioItem(req.user!.id, req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

businessesRouter.get('/:slugOrId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await businessesService.getPublicProfile(req.params.slugOrId);
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});
