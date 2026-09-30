import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or local
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  jwtSecret: process.env.JWT_SECRET || 'tailorconnect_super_secret_jwt_key_2026_dev_mode',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'tailorconnect_dev_refresh_secret_key_2026_mode',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/tailorconnect?schema=public',
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
  aiProvider: process.env.AI_PROVIDER || 'mock_parser',
  aiApiKey: process.env.AI_API_KEY || '',
  paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
};
