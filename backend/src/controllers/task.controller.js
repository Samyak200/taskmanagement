import taskModel from '../models/task.model.js';
import { isValidObjectId } from '../middleware/auth.middleware.js';

const STATUSES = ['Todo', 'In-Progress', 'Done'];

// ADMIN ONLY
export async function createTask(req, res, next) {
    try {
        const { title, assignedTo, status, deadline } = req.body;
        const task = await taskModel.create({
            title: title.trim(),
            projectId: req.params.projectId,
            assignedTo,
            status: status || 'Todo',
            deadline
        });
        await task.populate('assignedTo', 'username email role');
        res.status(201).json({ message: 'Task created', task });
    } catch (err) { next(err); }
}

// ADMIN + ASSIGNED MEMBER
export async function getTask(req, res, next) {
    try {
        const task = await taskModel.findById(req.params.taskId).populate('assignedTo projectId', 'name username email role');
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const isAssigned = task.assignedTo.some(u => String(u._id) === String(req.user._id));
        if (req.user.role !== 'admin' && !isAssigned) return res.status(403).json({ message: 'Access denied' });

        res.json({ task });
    } catch (err) { next(err); }
}

// ADMIN ONLY (Full Update)
export async function patchTask(req, res, next) {
    try {
        const task = await taskModel.findByIdAndUpdate(req.params.taskId, req.body, { new: true });
        res.json({ message: 'Task updated', task });
    } catch (err) { next(err); }
}

// MEMBER ONLY (Status Update) - Naya function jo aapke meRouter/taskRouter mein use hoga
export async function updateTaskStatus(req, res, next) {
    try {
        if (!STATUSES.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
        
        const task = await taskModel.findOneAndUpdate(
            { _id: req.params.taskId, assignedTo: req.user._id },
            { status: req.body.status },
            { new: true }
        );
        res.json({ message: 'Status updated', task });
    } catch (err) { next(err); }
}

// ADMIN ONLY
export async function deleteTask(req, res, next) {
    try {
        await taskModel.findByIdAndDelete(req.params.taskId);
        res.json({ message: 'Task deleted' });
    } catch (err) { next(err); }
}