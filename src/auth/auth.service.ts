import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInitialUser } from './model/users/create-initial-user';
import { VerifyToken } from './model/verification-tokens/verify-token';
import { $Enums } from '@prisma/client';
import { VerifyCreateUserDto } from 'src/dto/users/verify-create-user-dto';
import { CreateCrendentialsUser } from './model/users/create-crendentials-user';
import { TclientMetadata } from 'src/types/client-metadata';
import { CreateSession } from './model/sessions/create-session';
import { JwtService } from '@nestjs/jwt';
import { PasswordResetTokenDto } from 'src/dto/users/password-reset-token-dto';
import { GetUserByEmail } from './model/users/get-user-by-email';
import { GenerateOtp } from 'src/libs/generate-otp';
import { SendEmail } from 'src/libs/send-email';
import { generateOtpEmail } from 'src/templates/email/otp-template';
import { CreatePasswordResetToken } from './model/verification-tokens/create-password-reset-token';
import { PasswordResetDto } from 'src/dto/users/password-reset-dto';
import { GetUserById } from './model/users/get-user-by-id';
import { updateUserPassword } from './model/users/update-password';
import { createEmailVerificationToken } from './model/verification-tokens/create-email-verification-token';
import { loginUser } from './model/users/login-user';
import { SignInUserDto } from 'src/dto/users/sign-in-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  /**
   * Initialize a new user with the given email if not already registered.
   *
   * @payload {string} email - The email address to initialize.
   */
  async IntializeUser(email: string) {
    const initialized_user = await CreateInitialUser(this.prisma, email);
    if (initialized_user.error) {
      if (initialized_user.error.includes('internal server')) {
        throw new InternalServerErrorException();
      }
      throw new BadRequestException(initialized_user.error);
    }
    return initialized_user;
  }
  /**
   * Verifies the OTP token and creates a new credentials-based user session.
   *
   * @payload {VerifyCreateUserDto} data - token_id, otp, name, password
   * @payload {TclientMetadata} metadata - client IP, user agent, OS
   * @returns JWT session token + sanitized user object
   */
  async VerifyCreateCredentialsUser(
    data: VerifyCreateUserDto,
    metadata: TclientMetadata,
  ) {
    const token = await VerifyToken(
      $Enums.VerificationTokenScope.EMAIL_VERIFY,
      data.token_id,
      data.otp,
      this.prisma,
    );
    if (token.error) {
      if (token.error.includes('internal server')) {
        throw new InternalServerErrorException();
      }
      throw new BadRequestException(token.error);
    }
    if (token.userid) {
      try {
        const new_user = await CreateCrendentialsUser(
          this.prisma,
          token.userid,
          data.name,
          data.password,
        );
        const { password, verified_at, banned_at, is_banned, ...user } =
          new_user;
        console.log(password, verified_at, banned_at, is_banned);
        const session = await CreateSession(
          new_user.id,
          this.prisma,
          metadata.ip,
          metadata.userAgent,
          metadata.os,
        );
        const jwt_payload = {
          token: session.sessionId,
          expires: session.expiresAt,
          user_id: new_user.id,
        };
        const jwt_token = this.jwtService.sign(jwt_payload);
        return {
          token: jwt_token,
          user,
        };
      } catch (error) {
        console.error('[create credentials user error]', error);
        throw new InternalServerErrorException();
      }
    }
    throw new InternalServerErrorException();
  }
  /**
   * Generate a password reset OTP and email it to the user.
   *
   * @payload {string} email - The email address of the user requesting a password reset.
   */
  async GetPasswordResetToken(
    data: PasswordResetTokenDto,
    metadata: TclientMetadata,
  ) {
    const user = await GetUserByEmail(this.prisma, data.email);
    if (!user) throw new NotFoundException();
    if (!user.is_verified) throw new BadRequestException('email not verified');
    if (user.provider !== $Enums.Provider.CREDENTIALS)
      throw new BadRequestException(
        'only crendentials users can reset password',
      );
    if (user.is_banned) throw new UnauthorizedException();
    const otp = await GenerateOtp();
    try {
      await SendEmail(
        generateOtpEmail({
          title: 'Change your passowrd',
          desc: 'if you did not request to change your password you can just ignore this email this token is valid for only 15 mins',
          email: user.primary_email,
          otp,
        }),
        user.primary_email,
        'Change your password',
      );
      const token = await CreatePasswordResetToken(
        user.id,
        otp,
        this.prisma,
        metadata,
      );
      return token;
    } catch (error) {
      console.error('[error sending email]', error);
      throw new InternalServerErrorException();
    }
  }
  /**
   * Verify the password reset token and OTP, then update the user's password.
   *
   * @payload {string} token_id - The ID of the password reset token.
   * @payload {string} otp - The OTP sent to the user's email.
   * @payload {string} password - The new password to set.
   */
  async ResetPassword(data: PasswordResetDto) {
    const token = await VerifyToken(
      $Enums.VerificationTokenScope.PASSWORD_RESET,
      data.token_id,
      data.otp,
      this.prisma,
    );
    if (token.error) {
      if (token.error.includes('internal server')) {
        throw new InternalServerErrorException();
      }
      throw new BadRequestException(token.error);
    }
    if (token.userid) {
      const user = await GetUserById(this.prisma, token.userid);
      if (!user) throw new NotFoundException();
      if (!user.is_verified)
        throw new BadRequestException('email not verified');
      if (user.provider !== $Enums.Provider.CREDENTIALS)
        throw new BadRequestException(
          'only crendentials users can reset password',
        );
      if (user.is_banned) throw new UnauthorizedException();
      await updateUserPassword(this.prisma, user.id, data.password);
      return {
        success: true,
      };
    }
    throw new BadRequestException(token.error || 'something went wrong');
  }
  /**
   * Resend Email verification token
   *
   * @payload {string} email - The email address to initialize.
   */
  async ResendEmailVerificationToken(email: string) {
    const user = await GetUserByEmail(this.prisma, email);
    if (!user) throw new NotFoundException();
    if (user.is_verified)
      throw new BadRequestException('email already verified');
    if (user.provider !== $Enums.Provider.CREDENTIALS)
      throw new BadRequestException(
        'only crendentials users can reset password',
      );
    if (user.is_banned) throw new UnauthorizedException();
    const otp = await GenerateOtp();
    try {
      await SendEmail(
        generateOtpEmail({
          title: 'Verify Your email',
          desc: `
            Use the one-time password (OTP) below to verify your email address.
             For security reasons, this code will expire in 15 minutes and can only be used once
            `,
          email: user.primary_email,
          otp,
        }),
        user.primary_email,
        'Verify Your email',
      );
      const token = await createEmailVerificationToken(
        user.id,
        otp,
        this.prisma,
      );
      return token;
    } catch (error) {
      console.error('[error sending email]', error);
      throw new InternalServerErrorException();
    }
  }
  /**
 * Verifies the password reset token and OTP, then updates the user's password.
 *
 * @payload {SignInUserDto} data - token_id, otp, password
 * @payload {TClientMetadata} metadata - client IP, user agent, OS
 * @returns JWT session token + sanitized user object
 */

    async signInUser(data: SignInUserDto, metadata: TclientMetadata) {
    try {
      // Step 1: loginUser returns { user?, error? }
      const { user, error } = await loginUser(this.prisma, data.email, data.password);

      if (error) {
        if (error.includes("internal server")) {
          throw new InternalServerErrorException();
        }
        throw new BadRequestException(error);
      }

      if (user) {
        try {
          // Step 2: create session
          const session = await CreateSession(
            user.id,
            this.prisma,
            metadata.ip,
            metadata.userAgent,
            metadata.os
          );

          // Step 3: sign JWT
          const jwt_payload = {
            token: session.sessionId,
            expires: session.expiresAt,
            user_id: user.id,
          };
          const jwt_token = this.jwtService.sign(jwt_payload);

          // Step 4: remove sensitive fields
          const { password, verified_at, banned_at, is_banned, ...safeUser } = user;

          return {
            token: jwt_token,
            user: safeUser,
          };
        } catch (err) {
          console.error("[sign-in user error]", err);
          throw new InternalServerErrorException();
        }
      }

      throw new InternalServerErrorException();
    } catch (err) {
      console.error("[sign-in flow error]", err);
      throw new InternalServerErrorException();
    }
  }
}
