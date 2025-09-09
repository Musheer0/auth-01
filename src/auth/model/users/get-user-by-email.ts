import { PrismaClient, User } from '@prisma/client';
/**
 * Get user by email
 * @param prisma Prisma client
 * @param email string user email
 * @returns User|null
 */
export const GetUserByEmail = async (prisma: PrismaClient, email: string) => {
  const cache: User | null = null;
  if (cache) return cache;
  return await prisma.user.findUnique({
    where: { primary_email: email },
  });
};
