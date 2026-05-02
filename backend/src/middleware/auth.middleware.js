import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../config/config.js';
import userModel from '../models/user.model.js';

export async function requireAuth(req, res, next) {
    try {
        const raw = req.headers.authorization;
        const token = raw?.startsWith('Bearer ')
            ? raw.slice(7).trim()
            : raw?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        if (!decoded?.id) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const user = await userModel.findById(decoded.id).select('-password').lean();
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        req.user = user;
        req.accessTokenPayload = decoded;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: err.message });
        }
        next(err);
    }
}

export function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
}

export function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}
