import { PrismaClient } from '@prisma/client';

/**
 * Create a session for a user
 * @param userId string - The user id
 * @param prisma PrismaClient - Injected Prisma client
 * @param ip string - Client IP address
 * @param userAgent string - Raw User-Agent string
 * @param os string - Parsed OS name
 * @param expiresIn number (optional) - Expiry time in ms (default: 7 days)
 */
export const CreateSession = async (
  userId: string,
  prisma: PrismaClient,
  ip: string,
  userAgent: string,
  os: string,
  expiresIn: number = 1000 * 60 * 60 * 24 * 7, // default: 7 days
) => {
  const session = await prisma.session.create({
    data: {
      identifier_id: userId,
      expires_at: new Date(Date.now() + expiresIn),
      ip,
      user_agent: userAgent,
      os,
    },
  });

  return {
    sessionId: session.id,
    expiresAt: session.expires_at,
  };
};
