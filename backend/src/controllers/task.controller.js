import taskModel from '../models/task.model.js';
import projectModel from '../models/project.model.js';
import { canViewProject, canManageProject } from '../utils/projectAccess.js';
import { isValidObjectId } from '../middleware/auth.middleware.js';

const STATUSES = ['Todo', 'In-Progress', 'Done'];

function memberIdsSet(project) {
    const set = new Set((project.members || []).map(String));
    set.add(String(project.createdBy));
    return set;
}

export async function createTask(req, res, next) {
    try {
        const { projectId } = req.params;
        if (!isValidObjectId(projectId)) {
            return res.status(400).json({ message: 'Invalid project id' });
        }
        const project = await projectModel.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!canManageProject(req.user, project)) {
            return res.status(403).json({ message: 'Not allowed to create tasks on this project' });
        }

        const { title, assignedTo, status, deadline } = req.body;
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ message: 'Task title is required' });
        }
        if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
            return res.status(400).json({ message: 'assignedTo must be a non-empty array of user ids' });
        }

        const allowed = memberIdsSet(project);
        for (const uid of assignedTo) {
            if (!isValidObjectId(uid)) {
                return res.status(400).json({ message: `Invalid assignee id: ${uid}` });
            }
            if (!allowed.has(String(uid))) {
                return res
                    .status(400)
                    .json({ message: 'Assignees must be members of the project (or creator)' });
            }
        }

        let st = status ?? 'Todo';
        if (!STATUSES.includes(st)) {
            return res.status(400).json({ message: `Invalid status; use ${STATUSES.join(', ')}` });
        }

        let deadlineDate;
        if (deadline !== undefined && deadline !== null && deadline !== '') {
            deadlineDate = new Date(deadline);
            if (Number.isNaN(deadlineDate.getTime())) {
                return res.status(400).json({ message: 'Invalid deadline date' });
            }
        }

        const task = await taskModel.create({
            title: title.trim(),
            projectId,
            assignedTo,
            status: st,
            deadline: deadlineDate,
        });

        await task.populate('assignedTo', 'username email role');
        res.status(201).json({ message: 'Task created', task });
    } catch (err) {
        next(err);
    }
}

export async function getTask(req, res, next) {
    try {
        const { taskId } = req.params;
        if (!isValidObjectId(taskId)) {
            return res.status(400).json({ message: 'Invalid task id' });
        }
        const task = await taskModel.findById(taskId).populate('assignedTo', 'username email role').lean();
        if (!task) return res.status(404).json({ message: 'Task not found' });
        const project = await projectModel.findById(task.projectId).lean();
        if (!project || !canViewProject(req.user, project)) {
            return res.status(403).json({ message: 'No access to this task' });
        }
        res.json({ task });
    } catch (err) {
        next(err);
    }
}

export async function patchTask(req, res, next) {
    try {
        const { taskId } = req.params;
        if (!isValidObjectId(taskId)) {
            return res.status(400).json({ message: 'Invalid task id' });
        }
        const task = await taskModel.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const project = await projectModel.findById(task.projectId);
        if (!project || !canViewProject(req.user, project)) {
            return res.status(403).json({ message: 'No access to this task' });
        }

        const uid = String(req.user._id);
        const isAssignee = (task.assignedTo || []).map(String).includes(uid);
        const manager = canManageProject(req.user, project);

        if (!manager && !isAssignee) {
            return res.status(403).json({ message: 'Not allowed to update this task' });
        }

        const body = req.body || {};

        if (manager) {
            if (body.title !== undefined) {
                if (typeof body.title !== 'string' || !body.title.trim()) {
                    return res.status(400).json({ message: 'Title must be a non-empty string' });
                }
                task.title = body.title.trim();
            }
            if (body.status !== undefined) {
                if (!STATUSES.includes(body.status)) {
                    return res.status(400).json({ message: `Invalid status; use ${STATUSES.join(', ')}` });
                }
                task.status = body.status;
            }
            if (body.deadline !== undefined) {
                if (body.deadline === null || body.deadline === '') {
                    task.deadline = undefined;
                } else {
                    const d = new Date(body.deadline);
                    if (Number.isNaN(d.getTime())) {
                        return res.status(400).json({ message: 'Invalid deadline' });
                    }
                    task.deadline = d;
                }
            }
            if (body.assignedTo !== undefined) {
                if (!Array.isArray(body.assignedTo) || body.assignedTo.length === 0) {
                    return res.status(400).json({ message: 'assignedTo must be a non-empty array' });
                }
                const allowed = memberIdsSet(project);
                for (const aid of body.assignedTo) {
                    if (!isValidObjectId(aid)) {
                        return res.status(400).json({ message: `Invalid assignee id: ${aid}` });
                    }
                    if (!allowed.has(String(aid))) {
                        return res.status(400).json({ message: 'Assignees must be project members or creator' });
                    }
                }
                task.assignedTo = body.assignedTo;
            }
        } else {
            /** Member assignee: may only patch status */
            const keys = Object.keys(body).filter((k) => body[k] !== undefined);
            const allowedKeys = keys.every((k) => k === 'status');
            if (!allowedKeys || body.status === undefined) {
                return res.status(403).json({
                    message: 'Members assigned to this task may only update status',
                });
            }
            if (!STATUSES.includes(body.status)) {
                return res.status(400).json({ message: `Invalid status; use ${STATUSES.join(', ')}` });
            }
            task.status = body.status;
        }

        await task.save();
        await task.populate('assignedTo', 'username email role');
        res.json({ message: 'Task updated', task });
    } catch (err) {
        next(err);
    }
}

export async function deleteTask(req, res, next) {
    try {
        const { taskId } = req.params;
        if (!isValidObjectId(taskId)) {
            return res.status(400).json({ message: 'Invalid task id' });
        }
        const task = await taskModel.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const project = await projectModel.findById(task.projectId);
        if (!project || !canManageProject(req.user, project)) {
            return res.status(403).json({ message: 'Not allowed to delete this task' });
        }
        await taskModel.deleteOne({ _id: taskId });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        next(err);
    }
}
