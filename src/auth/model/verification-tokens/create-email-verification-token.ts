import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

/**
 * Create a verification token for a user
 * @param userId string - The user id
 * @param otp string - The plain OTP
 * @param prisma PrismaClient - Injected Prisma client
 * @param expiresIn number (optional) - Expiry time in ms (default: 15 mins)
 */
export const createEmailVerificationToken = async (
  userId: string,
  otp: string,
  prisma: PrismaClient,
  expiresIn: number = 1000 * 60 * 15, // default: 15 minutes
) => {
  const hashedOtp = await argon2.hash(otp);

  const token = await prisma.verificationToken.create({
    data: {
      token: hashedOtp,
      identifier_id: userId,
      expires_at: new Date(Date.now() + expiresIn),
    },
  });

  return {
    tokenId: token.id,
    expiresAt: token.expires_at,
  };
};
