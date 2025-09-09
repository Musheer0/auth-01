import { PrismaClient } from "@prisma/client";
import {verify} from "argon2";

/**
 * Verify a user’s token
 * @param scope string - e.g. "email", "password_reset"
 * @param tokenId string - The verification token id
 * @param userId string - The user id to match
 * @param otp string - The plain OTP user entered
 * @param prisma PrismaClient - Injected Prisma client
 */
export async function VerifyToken(
  scope: string,
  tokenId: string,
  otp: string,
  prisma: PrismaClient
) {
  const token = await prisma.verificationToken.findUnique({
    where: { id: tokenId },
  });

  if (!token) return { error: "Invalid or expired token." };
  if (token.expires_at < new Date()) return { error: "Token expired." };

  const isValid = await verify(token.token, otp);
  if (!isValid) return { error: "Invalid OTP." };

  // Optional cleanup: delete token after success
  await prisma.verificationToken.delete({ where: { id: tokenId } });

  return { success: true, userid:token.identifier_id};
}
