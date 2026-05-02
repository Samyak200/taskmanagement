import mongoose from 'mongoose';
import config from './config.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

function connectionUrls() {
    const list = [config.MONGO_URL];
    if (config.MONGO_FALLBACK_URL) {
        list.push(config.MONGO_FALLBACK_URL);
    }
    return list;
}

export async function connectDB() {
    const urls = connectionUrls();
    let lastError;

    for (const url of urls) {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                await mongoose.connect(url, {
                    serverSelectionTimeoutMS: 15000,
                    family: 4,
                });
                console.log('Connected to DB');
                return;
            } catch (err) {
                lastError = err;
                const label =
                    url.startsWith('mongodb+srv://') ? 'SRV' : 'direct';
                console.error(
                    `DB connect (${label}) attempt ${attempt}/${MAX_RETRIES} failed:`,
                    err.message || err
                );
                if (attempt < MAX_RETRIES) {
                    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
                }
            }
        }
    }
    throw lastError;
}
export default connectDB;
