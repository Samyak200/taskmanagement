import projectModel from '../models/project.model.js';
import taskModel from '../models/task.model.js';
import userModel from '../models/user.model.js';
import { isValidObjectId } from '../middleware/auth.middleware.js';
import { canViewProject, canManageProject } from '../utils/projectAccess.js';
import { projectPopulation } from '../utils/projectPopulate.js';

export async function createProject(req, res, next) {
    try {
        const { name, description } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Project name is required' });
        }
        const creator = req.user._id;
        const doc = await projectModel.create({
            name: name.trim(),
            description: typeof description === 'string' ? description : '',
            createdBy: creator,
            members: [creator],
        });
        const project = await projectModel
            .findById(doc._id)
            .populate(projectPopulation())
            .lean();
        res.status(201).json({ message: 'Project created', project });
    } catch (err) {
        next(err);
    }
}

export async function listProjects(req, res, next) {
    try {
        const uid = req.user._id;
        let filter =
            req.user.role === 'admin'
                ? {}
                : {
                      $or: [{ createdBy: uid }, { members: uid }],
                  };
        const projects = await projectModel
            .find(filter)
            .populate(projectPopulation())
            .sort({ updatedAt: -1 })
            .lean();
        res.json({ projects });
    } catch (err) {
        next(err);
    }
}

export async function getProject(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid project id' });
        }
        const project = await projectModel.findById(id).populate(projectPopulation()).lean();
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!canViewProject(req.user, project)) {
            return res.status(403).json({ message: 'No access to this project' });
        }
        res.json({ project });
    } catch (err) {
        next(err);
    }
}

export async function patchProject(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid project id' });
        }
        const project = await projectModel.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!canManageProject(req.user, project)) {
            return res.status(403).json({ message: 'Not allowed to update this project' });
        }

        const { name, description } = req.body;
        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({ message: 'Name must be a non-empty string' });
            }
            project.name = name.trim();
        }
        if (description !== undefined) {
            project.description =
                typeof description === 'string' ? description : String(description ?? '');
        }
        await project.save();
        const updated = await projectModel.findById(id).populate(projectPopulation()).lean();
        res.json({ message: 'Project updated', project: updated });
    } catch (err) {
        next(err);
    }
}

export async function addProjectMembers(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid project id' });
        }
        const project = await projectModel.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!canManageProject(req.user, project)) {
            return res.status(403).json({ message: 'Not allowed to manage members' });
        }

        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'userIds must be a non-empty array' });
        }
        for (const uid of userIds) {
            if (!isValidObjectId(uid)) {
                return res.status(400).json({ message: `Invalid user id: ${uid}` });
            }
        }
        const existing = await userModel.find({ _id: { $in: userIds } }).select('_id').lean();
        if (existing.length !== userIds.length) {
            return res.status(400).json({ message: 'One or more users do not exist' });
        }
        project.members = [...new Set([...(project.members || []).map(String), ...userIds])];
        await project.save();
        const updated = await projectModel.findById(id).populate(projectPopulation()).lean();
        res.json({
            message: 'Members updated',
            project: updated,
        });
    } catch (err) {
        next(err);
    }
}

export async function removeProjectMembers(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid project id' });
        }
        const project = await projectModel.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!canManageProject(req.user, project)) {
            return res.status(403).json({ message: 'Not allowed to manage members' });
        }

        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'userIds must be a non-empty array' });
        }
        for (const uid of userIds) {
            if (!isValidObjectId(uid)) {
                return res.status(400).json({ message: `Invalid user id: ${uid}` });
            }
        }

        const creator = String(project.createdBy);
        if (userIds.some((x) => String(x) === creator)) {
            return res.status(400).json({ message: 'Cannot remove the project creator from members' });
        }

        const remove = new Set(userIds.map(String));
        project.members = (project.members || []).filter((m) => !remove.has(String(m)));

        if (!project.members.map(String).includes(creator)) {
            project.members.push(project.createdBy);
        }

        await project.save();
        const updated = await projectModel.findById(id).populate(projectPopulation()).lean();
        res.json({ message: 'Members removed', project: updated });
    } catch (err) {
        next(err);
    }
}

export async function listProjectTasks(req, res, next) {
    try {
        const { projectId } = req.params;
        if (!isValidObjectId(projectId)) {
            return res.status(400).json({ message: 'Invalid project id' });
        }
        const project = await projectModel.findById(projectId).lean();
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!canViewProject(req.user, project)) {
            return res.status(403).json({ message: 'No access to this project' });
        }

        const tasks = await taskModel
            .find({ projectId })
            .populate('assignedTo', 'username email role')
            .sort({ updatedAt: -1 })
            .lean();
        res.json({ tasks });
    } catch (err) {
        next(err);
    }
}

export async function deleteProject(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid project id' });
        }
        const project = await projectModel.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!canManageProject(req.user, project)) {
            return res.status(403).json({ message: 'Not allowed to delete this project' });
        }
        await taskModel.deleteMany({ projectId: id });
        await projectModel.deleteOne({ _id: id });
        res.json({ message: 'Project and its tasks deleted' });
    } catch (err) {
        next(err);
    }
}
