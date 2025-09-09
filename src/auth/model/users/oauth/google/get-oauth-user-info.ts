import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { GoogleOAuthUser } from 'src/types/googe-oauth';

/**
 * Fetches Google OAuth user info using an authorization code.
 *
 * @param prisma - Prisma client instance (not used here but can be for DB operations)
 * @param code - Google OAuth authorization code
 * @param redirect_uri - Redirect URI used in OAuth flow
 * @returns GoogleOAuthUser object containing user's profile info
 * @throws BadRequestException if Google token request fails
 * @throws InternalServerErrorException for any other unexpected errors
 */
export const GetOauthUserInfo = async (
  prisma: PrismaClient,
  code: string,
  redirect_uri: string,
) => {
  try {
    // Prepare request body for token exchange
    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri,
      grant_type: 'authorization_code',
    });

    // Exchange code for access token
    const tokenReq = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!tokenReq.ok) {
      console.log('Token request status:', tokenReq.status);
      const tokenRes = await tokenReq.json();
      console.log(tokenRes);
      throw new BadRequestException('Error getting user token from Google');
    }

    const tokenRes = await tokenReq.json();
    const token = tokenRes;

    // Fetch user info from Google
    const userInfoReq = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: 'Bearer ' + token.access_token,
        },
      },
    );

    if (!userInfoReq.ok) {
      const userInfoRes = await userInfoReq.json();
      console.log(userInfoRes);
      throw new Error('Error getting user info from Google');
    }

    const userInfoRes: GoogleOAuthUser = await userInfoReq.json();
    return { user: userInfoRes, token: token?.refresh_token };
  } catch (error) {
    console.error(
      '[google oauth token exchange error]',
      error,
      '--------------------------',
    );
    throw new InternalServerErrorException(
      'Error getting user info, please try again',
    );
  }
};
