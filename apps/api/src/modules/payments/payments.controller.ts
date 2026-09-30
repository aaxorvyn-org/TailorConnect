import { Router, Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { validateBody } from '../../common/middleware/validate.js';
import { RecordOfflinePaymentSchema } from '@tailorconnect/validation';

export const paymentsRouter = Router();

paymentsRouter.post('/create-intent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, amount, method } = req.body;
    if (!orderId || !amount) {
      res.status(400).json({ success: false, error: { code: 'INVALID_PARAMS', message: 'orderId and amount are required' } });
      return;
    }
    const result = await paymentsService.createIntent(orderId, parseFloat(amount), method || 'ONLINE_UPI');
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.post('/record-offline', authenticate, requireRole('BUSINESS', 'ADMIN'), validateBody(RecordOfflinePaymentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await paymentsService.recordOffline(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.get('/order/:orderId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await paymentsService.getOrderPayments(req.params.orderId);
    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
});
