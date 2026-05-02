import mongoose from 'mongoose';
import config from './config.js';

export const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URL);
        console.log('Connected to MongoDB Database');
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

export default connectDB;