import { Router, Request, Response, NextFunction } from 'express';
import { aiMatchingService } from './ai-matching.service.js';

export const aiMatchingRouter = Router();

aiMatchingRouter.post('/extract', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { promptText } = req.body as { promptText: string };
    const structured = await aiMatchingService.extractRequirements(promptText);
    res.json({
      success: true,
      data: structured,
    });
  } catch (error) {
    next(error);
  }
});
