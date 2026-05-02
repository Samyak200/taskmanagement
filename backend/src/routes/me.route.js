import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as me from '../controllers/me.controller.js';

const meRouter = Router();
meRouter.use(requireAuth);
meRouter.get('/tasks', me.listMyTasks);
meRouter.get('/stats', me.myTaskStats);

export default meRouter;
