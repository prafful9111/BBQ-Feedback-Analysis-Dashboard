import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
};

/**
 * Prisma client singleton.
 *
 * TODO(SUPABASE): once the Supabase Postgres URL is provided in DATABASE_URL,
 * this client will connect automatically and the repository toggle can move
 * from dummy -> prisma for production data access.
 */
export const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
