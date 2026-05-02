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

    JWT_SECRET: process.env.JWT_SECRET,
    
    cookieSecure:process.env.NODE_ENV === 'production',
};

export default config;