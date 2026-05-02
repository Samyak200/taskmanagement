import userModel from '../models/user.model.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import sessionModel from '../models/session.model.js';

function sha256(s) {
    return crypto.createHash('sha256').update(s).digest('hex');
}
const cookieOpts = {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    maxAge: 7*24*60*60*1000,
};
export async function register(req, res, next) {
    try {
        const { username, email, password } = req.body;
        
        if (!username?.trim()) {
            return res.status(400).json({ message: 'Username is required' });
        }
        if (!email?.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const existsDup = await userModel
            .findOne({ $or: [{ username: username }, { email: email }] })
            .lean();
        if (existsDup) {
            return res.status(400).json({
                message: 'User already exists with this username or email.',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await userModel.create({
            username,
            email,
            password: hashedPassword,
        });

        const refreshToken = jwt.sign({ id: String(newUser._id) }, config.JWT_SECRET, {
            expiresIn: '7d',
        });
        const refreshTokenHash = sha256(refreshToken);

        const session = await sessionModel.create({
            user: newUser._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        const accessToken = jwt.sign(
            { id: String(newUser._id), sessionId: String(session._id) },
            config.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.cookie('refreshToken', refreshToken, cookieOpts);

        const userSafe = await userModel.findById(newUser._id).lean();

        return res.status(201).json({
            message: 'User registered successfully',
            user: userSafe,
            accessToken,
        });
    } catch (err) {
        next(err);
    }
}

export async function getMe(req, res) {
    res.status(200).json({
        message: 'User fetched successfully',
        user: req.user,
    });
}

export async function refreshToken(req, res, next) {
    try {
        const refreshTok = req.cookies.refreshToken;
        if (!refreshTok) {
            return res.status(401).json({ message: 'Refresh token Unauthorized' });
        }

        const decoded = jwt.verify(refreshTok, config.JWT_SECRET);
        const refreshTokenHash = sha256(refreshTok);

        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked: false,
        });

        if (!session) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const accessToken = jwt.sign(
            { id: decoded.id, sessionId: String(session._id) },
            config.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const newRefreshToken = jwt.sign({ id: decoded.id }, config.JWT_SECRET, { expiresIn: '7d' });
        const newRefreshTokenHash = sha256(newRefreshToken);
        session.refreshTokenHash = newRefreshTokenHash;
        await session.save();

        res.cookie('refreshToken', newRefreshToken, cookieOpts);

        return res.status(200).json({
            message: 'Access token refreshed successfully',
            accessToken,
        });
    } catch (err) {
        next(err);
    }
}

export async function logout(req, res, next) {
    try {
        const refreshTok = req.cookies.refreshToken;
        if (!refreshTok) {
            return res.status(400).json({ message: 'Refresh token not found' });
        }
        const refreshTokenHash = sha256(refreshTok);

        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked: false,
        });
        if (!session) {
            return res.status(400).json({ message: 'Invalid refresh token' });
        }
        session.revoked = true;
        await session.save();
        res.clearCookie('refreshToken', { ...cookieOpts, maxAge: 0 });
        return res.status(200).json({
            message: 'Logged out successfully',
        });
    } catch (err) {
        next(err);
    }
}

export async function logoutAll(req, res, next) {
    try {
        const refreshTok = req.cookies.refreshToken;
        if (!refreshTok) {
            return res.status(400).json({ message: 'Refresh token not found' });
        }
        const decoded = jwt.verify(refreshTok, config.JWT_SECRET);

        await sessionModel.updateMany({ user: decoded.id, revoked: false }, { revoked: true });
        res.clearCookie('refreshToken', { ...cookieOpts, maxAge: 0 });
        return res.status(200).json({
            message: 'Logged out from all devices successfully',
        });
    } catch (err) {
        next(err);
    }
}

export async function login(req, res, next) {
    try {
        const { username, email, password } = req.body;
        const or = [];
        if (username && String(username).trim()) or.push({ username: String(username).trim() });
        if (email && String(email).trim()) {
            or.push({ email: String(email).trim() });
        }
        if (or.length === 0) {
            return res.status(400).json({ message: 'Provide username or email' });
        }

        const user = await userModel.findOne({ $or: or }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const refreshTok = jwt.sign({ id: String(user._id) }, config.JWT_SECRET, {
            expiresIn: '7d',
        });
        const refreshTokenHash = sha256(refreshTok);

        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        const accessToken = jwt.sign(
            { id: String(user._id), sessionId: String(session._id) },
            config.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.cookie('refreshToken', refreshTok, cookieOpts);

        const userSafe = await userModel.findById(user._id).lean();

        return res.status(200).json({
            message: 'Login successful',
            user: userSafe,
            accessToken,
        });
    } catch (err) {
        next(err);
    }
}
