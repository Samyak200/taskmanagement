import userModel from '../models/user.model.js';
import { isValidObjectId } from '../middleware/auth.middleware.js';

export async function patchUserRole(req, res, next) {
    try {

        const { role } = req.body;
        if (role !== 'admin' && role !== 'member') {
            return res.status(400).json({ message: 'role must be admin or member' });
        }
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (String(user._id) === String(req.user._id) && role === 'member') {
            return res.status(400).json({ message: 'You cannot demote your own admin account here' });
        }
        user.role = role;
        await user.save();
        const safe = await userModel.findById(userId).select('username email role').lean();
        res.json({ message: 'User role updated', user: safe });
    } catch (err) {
        next(err);
    }
}


export async function getAllUsers(req, res, next) {
    try {
        const users = await userModel.find({}).select('username email role');
        res.json({ users });
    } catch (err) { next(err); }
}