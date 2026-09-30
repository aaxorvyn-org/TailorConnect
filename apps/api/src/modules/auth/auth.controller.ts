import { Router, Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { validateBody } from '../../common/middleware/validate.js';
import { RegisterSchema, LoginSchema } from '@tailorconnect/validation';
import { authenticate } from '../../common/middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(RegisterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', validateBody(LoginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/clerk-sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clerkId, email, firstName, lastName, role, phone } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: { message: 'Email is required for Clerk synchronization' } });
    }
    const result = await authService.syncClerkUser({
      clerkId: clerkId || `clerk_${Date.now()}`,
      email,
      firstName,
      lastName,
      role,
      phone,
    });
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});
