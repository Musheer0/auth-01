import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

/**
 * Update a user's password
 * @param prisma PrismaClient
 * @param userId string - id of the existing user
 * @param newPassword string - raw password (will be hashed)
 * @returns User | { error: string }
 */
export const updateUserPassword = async (
  prisma: PrismaClient,
  userId: string,
  newPassword: string,
) => {
  const hashedPassword = await argon2.hash(newPassword);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });
  await prisma.session.deleteMany({
    where: {
      identifier_id: userId,
    },
  });
  return updatedUser;
};
