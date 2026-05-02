import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as project from '../controllers/project.controller.js';
import * as task from '../controllers/task.controller.js';

const projectRouter = Router();
projectRouter.use(requireAuth);

projectRouter.post('/', project.createProject);
projectRouter.get('/', project.listProjects);
projectRouter.get('/:projectId/tasks', project.listProjectTasks);
projectRouter.post('/:projectId/tasks',requireAdmin, task.createTask);
projectRouter.patch('/:id', project.patchProject);
projectRouter.post('/:id/members', project.addProjectMembers);
projectRouter.delete('/:id/members', project.removeProjectMembers);
projectRouter.delete('/:id', project.deleteProject);
projectRouter.get('/:id', project.getProject);

export default projectRouter;
