import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

import app from './src/app.js';
import connectDB from './src/config/database.js';

async function start() {
    try {
        await connectDB();
        app.listen(3000, () => {
            console.log('Server started at port 3000');
        });
    } catch (err) {
        console.error('Cannot start server — database unavailable.');
        console.error(err.message || err);
        if (err.code) console.error('Error code:', err.code);
        console.error(
            'Fix: stable internet / VPN off; Atlas cluster not paused; Network Access allows your IP (or 0.0.0.0/0 for dev); correct backend/.env. If mongodb+srv fails with querySrv errors, paste Atlas “standard connection string” (mongodb://...) as MONGO_FALLBACK_URL in .env.'
        );
        process.exit(1);
    }
}

start();
