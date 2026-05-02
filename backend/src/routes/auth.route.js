import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import * as project from '../controllers/project.controller.js';
import * as task from '../controllers/task.controller.js';

const projectRouter = Router();

// IN SABHI ROUTES PAR ADMIN HONA ZAROORI HAI
projectRouter.use(requireAuth, requireAdmin); 

// Project CRUD
projectRouter.post('/', project.createProject);          // Naya project banana
projectRouter.get('/', project.listProjects);            // Saare projects dekhna
projectRouter.get('/:id', project.getProject);           // Ek project ki details
projectRouter.patch('/:id', project.patchProject);       // Project update karna
projectRouter.delete('/:id', project.deleteProject);     // Project delete karna

// Project Members Manage Karna
projectRouter.post('/:id/members', project.addProjectMembers);
projectRouter.delete('/:id/members', project.removeProjectMembers);

// Project ke andar Task banana (Assigning members is done here)
projectRouter.get('/:projectId/tasks', project.listProjectTasks); 
projectRouter.post('/:projectId/tasks', task.createTask); 

export default projectRouter;