import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.route.js';
import projectRouter from './routes/project.route.js';
import taskRouter from './routes/task.route.js';
import meRouter from './routes/me.route.js';
import userRouter from './routes/user.route.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/me', meRouter);
app.use('/api/users', userRouter);

app.use((err, req, res, next) => {
    const status =
        err.statusCode ||
        (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' ? 401 : 500);
    res.status(status).json({ message: err.message || 'Internal Server Error' });
});

export default app;
