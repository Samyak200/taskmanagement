import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import * as user from '../controllers/user.controller.js';

const userRouter = Router();
userRouter.use(requireAuth, requireAdmin);
userRouter.get('/', user.getAllUsers); // Admin dropdown list ke liye sabhi users fetch karega
userRouter.patch('/:userId/role', user.patchUserRole); // Admin kisi ka role badal sakta hai

export default userRouter;