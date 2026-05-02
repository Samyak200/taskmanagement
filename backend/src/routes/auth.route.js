import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.get('/get-me', requireAuth, authController.getMe);
authRouter.get('/refresh-token',authController.refreshToken);
authRouter.get('/logout',authController.logout);    
authRouter.get('/logout-all',authController.logoutAll);//to logout from all devices 
authRouter.post('/login',authController.login);
export default authRouter;