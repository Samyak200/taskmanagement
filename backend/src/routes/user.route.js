import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import * as user from '../controllers/user.controller.js';

const userRouter = Router();
userRouter.use(requireAuth);

userRouter.patch('/:userId/role', requireAdmin, user.patchUserRole);

export default userRouter;
