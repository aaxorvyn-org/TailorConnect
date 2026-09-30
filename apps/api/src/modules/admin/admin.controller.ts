import { Router, Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';

export const adminRouter = Router();

// Protect all admin routes with authentication and ADMIN role check
adminRouter.use(authenticate, requireRole('ADMIN'));

adminRouter.get('/dashboard-metrics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await adminService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/businesses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as { status?: string };
    const businesses = await adminService.getBusinesses(status);
    res.json({
      success: true,
      data: businesses,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/businesses/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.verifyBusiness(req.user!.id, req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/businesses/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const result = await adminService.suspendBusiness(req.user!.id, req.params.id, reason);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/orders', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await adminService.getOrders();
    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/reviews', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await adminService.getReviews();
    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});
