import app from './src/app.js';
import connectDB from './src/config/database.js';

const startServer = async () => {
    try {
        await connectDB();
        app.listen(3000, () => console.log('Server running on port 3000'));
    } catch (error) {
        console.error('connection failed:', error.message);
        process.exit(1);
    }
};

startServer();