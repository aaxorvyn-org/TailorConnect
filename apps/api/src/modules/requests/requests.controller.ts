import { Router, Request, Response, NextFunction } from 'express';
import { requestsService } from './requests.service.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { validateBody } from '../../common/middleware/validate.js';
import { CreateRequestSchema } from '@tailorconnect/validation';

export const requestsRouter = Router();

requestsRouter.post('/', authenticate, validateBody(CreateRequestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await requestsService.create(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

requestsRouter.get('/my-requests', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await requestsService.getMyRequests(req.user!.id);
    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

requestsRouter.get('/tailor-inbox', authenticate, requireRole('BUSINESS', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inbox = await requestsService.getTailorInbox(req.user!.id);
    res.json({
      success: true,
      data: inbox,
    });
  } catch (error) {
    next(error);
  }
});

requestsRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await requestsService.getById(req.params.id);
    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

requestsRouter.post('/:id/messages', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ success: false, error: { code: 'EMPTY_MESSAGE', message: 'Message content is required' } });
      return;
    }
    const message = await requestsService.sendMessage(req.params.id, req.user!.id, req.user!.role, content);
    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
});

requestsRouter.get('/:id/messages', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await requestsService.getMessages(req.params.id);
    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
});

requestsRouter.patch('/:id/cancel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await requestsService.cancel(req.params.id, req.user!.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});
