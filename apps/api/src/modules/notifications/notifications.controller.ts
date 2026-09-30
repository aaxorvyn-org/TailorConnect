import { Router, Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service.js';
import { authenticate } from '../../common/middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await notificationsService.getAll(req.user!.id);
    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
});

notificationsRouter.patch('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationsService.markRead(req.params.id, req.user!.id);
    res.json({
      success: true,
      data: { message: 'Marked as read' },
    });
  } catch (error) {
    next(error);
  }
});

notificationsRouter.post('/mark-all-read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationsService.markAllRead(req.user!.id);
    res.json({
      success: true,
      data: { message: 'All marked as read' },
    });
  } catch (error) {
    next(error);
  }
});
