import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import * as task from '../controllers/task.controller.js';

const taskRouter = Router();
taskRouter.use(requireAuth);

// MEMBER + ADMIN (Member apna task dekh payega. Project aur partner details populate() se aayengi)
taskRouter.get('/:taskId', task.getTask);

// MEMBER ONLY STATUS UPDATE (Sirf status update hoga, title/deadline nahi)
taskRouter.patch('/:taskId/status', task.updateTaskStatus);

// ADMIN ONLY TASK CRUD (Admin task ka title, deadline edit ya delete kar sakta hai)
taskRouter.patch('/:taskId', requireAdmin, task.patchTask);
taskRouter.delete('/:taskId', requireAdmin, task.deleteTask);

export default taskRouter;