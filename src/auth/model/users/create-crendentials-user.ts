import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

/**
 * Update an existing user after verification
 * @param prisma PrismaClient
 * @param userId string - id of the existing user
 * @param name string - set user name
 * @param password string - raw password (will be hashed)
 * @returns User | { error: string }
 */
export const CreateCrendentialsUser = async (
  prisma: PrismaClient,
  userId: string,
  name: string,
  password: string,
) => {
  const hashedPassword = await argon2.hash(password);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      password: hashedPassword,
      is_verified: true,
      verified_at: new Date(),
    },
  });
  return updatedUser;
};
