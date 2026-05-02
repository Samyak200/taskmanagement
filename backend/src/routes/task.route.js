import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as task from '../controllers/task.controller.js';

const taskRouter = Router();
taskRouter.use(requireAuth);

taskRouter.get('/:taskId', task.getTask);
taskRouter.patch('/:taskId', task.patchTask);
taskRouter.delete('/:taskId', task.deleteTask);

export default taskRouter;
