import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateSession } from 'src/auth/model/sessions/create-session';
import { SendEmail } from 'src/libs/send-email';
import { generateOauthMismatchEmail } from 'src/templates/email/oauth-email-mismatch-template';
import { TclientMetadata } from 'src/types/client-metadata';
import { GoogleOAuthUser } from 'src/types/googe-oauth';
/**
 * Creates or links a user via Google OAuth, handling bans, email mismatches, and returns session + user info.
 *
 * @param {PrismaClient} prisma - Prisma client instance.
 * @param {GoogleOAuthUser} user - Google OAuth user data.
 * @param {TclientMetadata} metadata - Client metadata (IP, user agent, OS).
 * @param {string} [refreshToken] - Optional Google refresh token.
 * @returns {Promise<{ sessionId: string; user: any }>} Session info and sanitized user object.
 */

export const CreateGoogleOauthUser = async (
  prisma: PrismaClient,
  user: GoogleOAuthUser,
  metadata: TclientMetadata,
  refreshToken?: string, // pass this when you exchange the code,
) => {
  if (!user.email_verified) {
    throw new BadRequestException('Your Google email is not verified');
  }
  // 1. Check if account already exists
  const account = await prisma.account.findUnique({
    where: {
      oauth_id_provider: {
        oauth_id: user.sub,
        provider: 'GOOGLE',
      },
    },
    include: { identifier: true },
  });

  if (account?.identifier) {
    if (account.identifier.is_banned) {
      throw new BadRequestException(
        'Your account is banned. Appeal if you think this is a mistake.',
      );
    }

    // 🔄 Update refresh token only if Google provided a new one
    if (refreshToken) {
      await prisma.account.update({
        where: { id: account.id },
        data: { refresh_token: refreshToken },
      });
    }

    if (account.email !== account.identifier.primary_email) {
      try {
        await SendEmail(
          generateOauthMismatchEmail({
            accountEmail: account.identifier.primary_email,
            oauthEmail: account.email,
            provider: account.provider,
          }),
          account.identifier.primary_email,
          'Account Email mismatch',
        );
      } catch (error) {
        console.log(
          ['email sending error (oauth google email mismatch)'],
          error,
        );
      }
    }
    const session = await CreateSession(
      account.identifier_id,
      prisma,
      metadata.ip,
      metadata.userAgent,
      metadata.os,
    );
    return { ...session, user: account.identifier };
  }

  // 2. Check if user exists by email
  const existingUser = await prisma.user.findUnique({
    where: { primary_email: user.email },
  });

  if (existingUser) {
    if (existingUser.is_banned) {
      throw new BadRequestException(
        'Your account is banned. Appeal if you think this is a mistake.',
      );
    }

    // Link Google to existing user
    await prisma.account.create({
      data: {
        identifier_id: existingUser.id,
        oauth_id: user.sub,
        provider: 'GOOGLE',
        refresh_token: refreshToken,
        email: user.email,
      },
    });

    const session = await CreateSession(
      existingUser.id,
      prisma,
      metadata.ip,
      metadata.userAgent,
      metadata.os,
    );
    return { ...session, user: existingUser };
  }

  // 3. No user, create new
  const newUser = await prisma.user.create({
    data: {
      primary_email: user.email,
      is_verified: true,
      verified_at: new Date(),
      name: user.name,
      image_url: user.picture,
      accounts: {
        create: {
          oauth_id: user.sub,
          provider: 'GOOGLE',
          refresh_token: refreshToken,
          email: user.email,
        },
      },
    },
  });

  const session = await CreateSession(
    newUser.id,
    prisma,
    metadata.ip,
    metadata.userAgent,
    metadata.os,
  );
  return { ...session, user: newUser };
};
