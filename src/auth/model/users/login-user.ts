import { PrismaClient, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { TwofaLogin } from './2fa-login';
import { SignInUserDto } from 'src/dto/users/sign-in-user.dto';

/**
 * Login user (credentials only)
 * @param prisma PrismaClient
 * @param email string - user's primary_email
 * @param password string - raw password
 * @returns { user?: User, error?: string }
 */
export const loginUser = async (
  prisma: PrismaClient,
  email: string,
  password: string,
  data:SignInUserDto
): Promise<{ user?: User; error?: string ,twofa?:boolean,verification_id?:string,expires_at?:Date}> => {
  // Step 1: Fetch user by email
  const user = await prisma.user.findUnique({
    where: { primary_email: email },
  });

  if (!user) {
    return { error: 'Invalid credentials' };
  }

  // Step 2: Check provider and password existence
  if (user.provider !== 'CREDENTIALS') {
    return { error: 'User must login with their provider' };
  }

  if (!user.password) {
    return { error: 'User has no password set' };
  }

  // Step 3: Check if verified and not banned
  if (!user.is_verified) {
    return { error: 'User is not verified' };
  }

  if (user.is_banned) {
    return { error: 'User is banned' };
  }

  // Step 4: Verify password
  const isPasswordValid = await argon2.verify(user.password, password);

  if (!isPasswordValid) {
    return { error: 'Invalid credentials' };
  }
  const res = await TwofaLogin(prisma,user)
  if(res){
     return {twofa:true,...res}
  }
  // Step 5: Return full user object
  return { user };
};
