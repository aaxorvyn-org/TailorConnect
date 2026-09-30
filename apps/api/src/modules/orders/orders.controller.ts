import { Router, Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { validateBody } from '../../common/middleware/validate.js';
import { OrderStatusTransitionSchema } from '@tailorconnect/validation';

export const ordersRouter = Router();

ordersRouter.get('/customer', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await ordersService.getCustomerOrders(req.user!.id);
    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

ordersRouter.get('/tailor', authenticate, requireRole('BUSINESS', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await ordersService.getTailorOrders(req.user!.id);
    res.json({
      success: true,
      data: data.orders,
      meta: data.metrics,
    });
  } catch (error) {
    next(error);
  }
});

ordersRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await ordersService.getById(req.params.id);
    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post('/:id/status-transition', authenticate, validateBody(OrderStatusTransitionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { toStatus, note } = req.body;
    const order = await ordersService.transitionStatus(req.params.id, req.user!.id, req.user!.role, toStatus, note);
    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post('/:id/notes', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, isCustomerVisible } = req.body;
    const note = await ordersService.addNote(req.params.id, req.user!.id, content, isCustomerVisible);
    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
});
