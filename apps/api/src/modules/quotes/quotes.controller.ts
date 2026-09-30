import { Router, Request, Response, NextFunction } from 'express';
import { quotesService } from './quotes.service.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { validateBody } from '../../common/middleware/validate.js';
import { CreateQuoteSchema } from '@tailorconnect/validation';

export const quotesRouter = Router();

quotesRouter.post('/', authenticate, requireRole('BUSINESS', 'ADMIN'), validateBody(CreateQuoteSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quote = await quotesService.create(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
});

quotesRouter.get('/request/:requestId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotes = await quotesService.getByRequest(req.params.requestId);
    res.json({
      success: true,
      data: quotes,
    });
  } catch (error) {
    next(error);
  }
});

quotesRouter.post('/:id/accept', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentOption } = req.body || { paymentOption: 'ONLINE' };
    const result = await quotesService.accept(req.params.id, req.user!.id, paymentOption);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

quotesRouter.post('/:id/decline', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await quotesService.decline(req.params.id, req.user!.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});
