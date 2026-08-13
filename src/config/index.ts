import dotenv from 'dotenv';
import path from 'path';

dotenv.config({path:path.join(process.cwd(),".env")})

export default{
    port: process.env.PORT || 5000,
    database_url: process.env.DATABASE_URL,
    frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS || "10",
    jwt_access_secret: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
    jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    google_client_id: process.env.GOOGLE_CLIENT_ID || ""
}