import dotenv from 'dotenv'
dotenv.config();


if(!process.env.MONGO_URL){
    throw new Error("DB url is not present in env variable");
}
if(!process.env.JWT_SECRET){
    throw new Error("JWT secret is not present in env variable");
}

const config ={
    MONGO_URL: process.env.MONGO_URL,
    /** Optional: Atlas "standard" mongodb://... URI if mongodb+srv fails (querySrv / DNS issues) */
    MONGO_FALLBACK_URL: process.env.MONGO_FALLBACK_URL || '',
    JWT_SECRET: process.env.JWT_SECRET,
    /** Use COOKIE_SECURE=true or NODE_ENV=production for HTTPS-only cookies */
    cookieSecure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
};


export default config;