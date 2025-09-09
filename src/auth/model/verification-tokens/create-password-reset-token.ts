import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { TclientMetadata } from 'src/types/client-metadata';

/**
 * Create a verification token for password reset
 * @param userId string - The user id
 * @param otp string - The plain OTP
 * @param prisma PrismaClient - Injected Prisma client
 * @param expiresIn number (optional) - Expiry time in ms (default: 15 mins)
 * @param metadata - client metadata automatically taken from headers
 */
export const CreatePasswordResetToken = async (
  userId: string,
  otp: string,
  prisma: PrismaClient,
  metadata: TclientMetadata,
  expiresIn: number = 1000 * 60 * 15, // default: 15 minutes,
) => {
  const hashedOtp = await argon2.hash(otp);

  const token = await prisma.verificationToken.create({
    data: {
      token: hashedOtp,
      identifier_id: userId,
      expires_at: new Date(Date.now() + expiresIn),
      scope: 'PASSWORD_RESET',
      ip: metadata.ip,
      user_agent: metadata.userAgent,
    },
  });

  return {
    tokenId: token.id,
    expiresAt: token.expires_at,
  };
};
