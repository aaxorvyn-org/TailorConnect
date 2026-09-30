import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('[Database] Connected successfully to PostgreSQL.');
  } catch (error) {
    console.error('[Database] Connection failure:', error);
    process.exit(1);
  }
}
