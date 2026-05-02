import taskModel from '../models/task.model.js';
import mongoose from 'mongoose';

const ALLOWED_STATUSES = ['Todo', 'In-Progress', 'Done'];
/**
 * GET /tasks — logged-in user ki assigned tasks DB se fetch karna
 */
export async function listMyTasks(req, res, next) {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);
        const query = {
            assignedTo: userId,
        };
        
        const status = req.query.status;
        const overdue = req.query.overdue;

        if (status !== undefined && status !== '') {
            const isOk = ALLOWED_STATUSES.includes(status);
            if (!isOk) {
                return res.status(400).json({
                    message: `Invalid status; use ${ALLOWED_STATUSES.join(', ')}`,
                });
            }
            query.status = status;
        }
        if (overdue === 'true' || overdue === '1') {
            query.deadline = { $lt: new Date() };
            if (query.status === undefined) {
                query.status = { $ne: 'Done' };
            }
        }

        const tasks = await taskModel
            .find(query)
            .populate('projectId', 'name description createdBy')
            .populate('assignedTo', 'username email role')
            .sort({ deadline: 1, updatedAt: -1 })
            .lean();

        return res.status(200).json({ tasks });
    } catch (err) {
        next(err);
    }
}

/**
 * GET — mere tasks ka count alag-alag buckets mein
 */
export async function myTaskStats(req, res, next) {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);

        // Har jagah same rule: assignedTo === ye user
        const mineOnly = { assignedTo: userId };
        const now = new Date();

        const total = await taskModel.countDocuments(mineOnly);

        const todo = await taskModel.countDocuments({
            ...mineOnly,
            status: 'Todo',
        });

        const inProgress = await taskModel.countDocuments({
            ...mineOnly,
            status: 'In-Progress',
        });

        const done = await taskModel.countDocuments({
            ...mineOnly,
            status: 'Done',
        });

        const overdue = await taskModel.countDocuments({
            assignedTo: userId,
            deadline: { $lt: now },
            status: { $ne: 'Done' },
        });

        return res.status(200).json({
            total,
            todo,
            inProgress,
            done,
            overdue,
        });
    } catch (err) {
        next(err);
    }
}
