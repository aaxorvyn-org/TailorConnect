import { Router, Request, Response, NextFunction } from 'express';
import { appointmentsService } from './appointments.service.js';
import { authenticate } from '../../common/middleware/auth.js';
import { validateBody } from '../../common/middleware/validate.js';
import { CreateAppointmentSchema } from '@tailorconnect/validation';
import { AppointmentStatus } from '@prisma/client';

export const appointmentsRouter = Router();

appointmentsRouter.get('/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, date } = req.query as { businessId: string; date: string };
    if (!businessId || !date) {
      res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'businessId and date are required' } });
      return;
    }
    const availability = await appointmentsService.getAvailability(businessId, date);
    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.post('/', authenticate, validateBody(CreateAppointmentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await appointmentsService.create(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.get('/my-schedule', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await appointmentsService.getMySchedule(req.user!.id, req.user!.role);
    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.patch('/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body as { status: AppointmentStatus };
    const updated = await appointmentsService.updateStatus(req.params.id, status);
    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});
