import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { InitializeUserDto } from 'src/dto/users/initialize-user.dto';
import { VerifyCreateUserDto } from 'src/dto/users/verify-create-user-dto';
import { GetClientMetadata } from 'src/decorators/get-client-metadata';
import { TclientMetadata } from 'src/types/client-metadata';
import { Response } from 'express';
import { PasswordResetTokenDto } from 'src/dto/users/password-reset-token-dto';
import { PasswordResetDto } from 'src/dto/users/password-reset-dto';
import { SignInUserDto } from 'src/dto/users/sign-in-user.dto';
import { OAuthGoogleQueryParamsDto } from 'src/dto/users/oauth/google/oauth-google.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  /**
   * @route POST /sign-up/verify-email
   * @summary Initialize a user account with an email address.
   *
   * @description
   * This endpoint is used during the sign-up flow to "book" an email address
   * before the user fully registers.
   *
   * - Accepts an email in the request body.
   * - If the email already belongs to an existing user:
   *    → Returns an error response.
   * - If the email is new:
   *    → Creates a lightweight "initial" user with the email and a dummy name.
   *    → Marks the user as unverified.
   *    → Generates and sends a One-Time Password (OTP) to the email.
   *    → Returns a verification token and its expiration time.
   *
   * This ensures that no one else can claim the same email during registration.
   *
   * @param {InitializeUserDto} body - The request payload containing the user's email.
   * @param {string} body.email - The email address to verify and initialize.
   *
   * @returns {Promise<Object>} Response object
   * @returns {string} [error] - Error message if the email is already taken or invalid.
   * @returns {string} [verify_token] - Token used for verifying the OTP if initialization succeeds.
   * @returns {Date} [expiresAt] - Expiration time for the verification token.
   *
   * @example
   * // Request
   * POST /sign-up/verify-email
   * {
   *   "email": "jane.doe@example.com"
   * }
   *
   * // Success Response
   * {
   *   "verify_token": "abc123xyz",
   *   "expiresAt": "2025-09-09T13:30:00.000Z"
   * }
   *
   * // Error Response
   * {
   *   "error": "User with this email already exists."
   * }
   */
  @Post('/sign-up/verify-email')
  async SignUpUser(@Body() body: InitializeUserDto) {
    return this.authService.IntializeUser(body.email);
  }
  /**
   * @route POST /sign-up
   * @summary Verify email OTP and finalize user account creation.
   *
   * @description
   * This endpoint completes the registration process for a credentials-based user.
   *
   * - Accepts the token ID, OTP, and user details (name + password).
   * - Validates the token and checks the OTP against the stored record.
   * - If valid:
   *    → Confirms the user's email.
   *    → Hashes and stores the password.
   *    → Creates and returns a new user object.
   *    → Issues a JWT session token so the user is logged in immediately.
   * - If invalid:
   *    → Returns an error (invalid OTP, expired token, etc.).
   *
   * @param {VerifyCreateUserDto} body - The request payload for verifying and creating the user.
   * @param {string} body.token_id - Token received from `/sign-up/verify-email`.
   * @param {string} body.otp - One-Time Password sent to the user's email.
   * @param {string} body.name - The user's chosen display name.
   * @param {string} body.password - The user's password (stored hashed).
   * @param {TclientMetadata} metadata - Client metadata (IP, device, OS, user agent, etc.).
   * @param {Response} res - Express response object (used for cookies, headers, etc.).
   *
   * @returns {Promise<Object>} Response object
   * @returns {string} token - JWT session token for the authenticated user.
   * @returns {Object} user - The created/verified user object.
   * @returns {string} user.id - Unique identifier of the user.
   * @returns {Date} user.created_at - Timestamp when the user was created.
   * @returns {Date} user.updated_at - Timestamp of the last update.
   * @returns {string} user.name - User's display name.
   * @returns {string} user.primary_email - User's primary email (now verified).
   * @returns {string} user.image_url - User's profile picture (default or uploaded).
   * @returns {boolean} user.is_verified - Whether the user's email is verified.
   *
   * @example
   * // Request
   * POST /sign-up
   * {
   *   "token_id": "abc123xyz",
   *   "otp": "456789",
   *   "name": "Jane Doe",
   *   "password": "StrongPassword123"
   * }
   *
   * // Success Response
   * {
   *   "token": "jwt.session.token.here",
   *   "user": {
   *     "id": "usr_92jx81m4",
   *     "created_at": "2025-09-09T12:34:56.000Z",
   *     "updated_at": "2025-09-09T12:34:56.000Z",
   *     "name": "Jane Doe",
   *     "primary_email": "jane.doe@example.com",
   *     "image_url": "https://cdn.example.com/default-avatar.png",
   *     "is_verified": true
   *   }
   * }
   */

  @Post('/sign-up')
  async SignUpVerifyCredentialsUser(
    @Body() body: VerifyCreateUserDto,
    @GetClientMetadata() metadata: TclientMetadata,
    @Res() res: Response,
  ) {
    const response = await this.authService.VerifyCreateCredentialsUser(
      body,
      metadata,
    );
    return response;
  }
  /**
   * @route POST /reset-password/request
   * @summary Request a password reset OTP/email token.
   *
   * @description
   * This endpoint starts the password reset flow for a credentials-based user.
   *
   * - Accepts a user's email and client metadata (IP, device, OS).
   * - Validates that the user exists, email is verified, and user is not banned.
   * - Generates a one-time OTP for password reset.
   * - Sends an email to the user containing the OTP and instructions.
   * - Creates and stores a password reset token in the database for verification later.
   *
   * This ensures that only verified users can reset their password and prevents banned users from doing so.
   *
   * @param {PasswordResetTokenDto} body - The request payload containing user email.
   * @param {string} body.email - The email of the user requesting password reset.
   * @param {TclientMetadata} metadata - Client metadata (IP, OS, browser/user-agent).
   *
   * @returns {Promise<Object>} Response object
   * @returns {string} tokenId - The ID of the created password reset token.
   * @returns {Date} expiresAt - Expiration timestamp of the token.
   *
   * @throws {NotFoundException} If the user with the given email does not exist.
   * @throws {BadRequestException} If the user's email is not verified.
   * @throws {UnauthorizedException} If the user is banned.
   * @throws {InternalServerErrorException} If sending the email or creating the token fails.
   *
   * @example
   * // Request
   * POST /reset-password/request
   * {
   *   "email": "user@example.com"
   * }
   *
   * // Success Response
   * {
   *   "tokenId": "prt_92jx81m4",
   *   "expiresAt": "2025-09-09T14:00:00.000Z"
   * }
   *
   * // Error Response
   * {
   *   "statusCode": 404,
   *   "message": "User not found"
   * }
   */
  @Post('/reset-password/request')
  async RequestResetPasswordToken(
    @Body() body: PasswordResetTokenDto,
    @GetClientMetadata() metadata: TclientMetadata,
  ) {
    return this.authService.GetPasswordResetToken(body, metadata);
  }
  /**
   * @route POST /reset-password
   * @summary Verify OTP and reset user password.
   *
   * @description
   * This endpoint completes the password reset process for credentials-based users.
   *
   * - Accepts a password reset token ID, OTP, and new password.
   * - Delegates verification and password update to the AuthService.
   * - Returns a success response if the password reset is successful.
   *
   * @param {PasswordResetDto} body - The request payload containing token and new password.
   * @param {string} body.token_id - The ID of the password reset token generated in `/reset-password/request`.
   * @param {string} body.otp - The one-time password sent to the user's email.
   * @param {string} body.password - The new password to set for the user.
   *
   * @returns {Promise<Object>} Response object
   * @returns {boolean} success - True if password reset succeeded.
   *
   * @throws {BadRequestException} If the token/OTP is invalid or expired.
   * @throws {NotFoundException} If the user associated with the token does not exist.
   * @throws {BadRequestException} If the user email is not verified or not a credentials user.
   * @throws {UnauthorizedException} If the user is banned.
   * @throws {InternalServerErrorException} If there is an internal server or DB error during token verification or password update.
   *
   * @example
   * // Request
   * POST /reset-password
   * {
   *   "token_id": "prt_92jx81m4",
   *   "otp": "123456",
   *   "password": "NewStrongPassword123"
   * }
   *
   * // Success Response
   * {
   *   "success": true
   * }
   *
   * // Error Response
   * {
   *   "statusCode": 400,
   *   "message": "Invalid OTP"
   * }
   */
  @Post('/reset-password')
  async ResetPassword(@Body() body: PasswordResetDto) {
    return this.authService.ResetPassword(body);
  }
  /**
   * @route POST /resend/email-verification
   * @summary Resend the email verification token to a user.
   *
   * @description
   * This endpoint allows a user to request that their email verification token be resent.
   *
   * Workflow:
   * 1. Accepts the user's email in the request body.
   * 2. Checks if the email exists in the system.
   * 3. If the user exists and is not verified, generates a new verification token.
   * 4. Sends an email containing the verification token to the user.
   * 5. Prevents duplicate registrations by ensuring the email is booked.
   *
   * This route is intended for users who registered but did not receive or lost their original verification email.
   *
   * @param {InitializeUserDto} body - The request payload containing the user's email.
   * @param {string} body.email - The email address to resend the verification token to.
   *
   * @returns {Promise<Object>} Response object
   * @returns {string} verify_token - The newly generated email verification token.
   * @returns {Date} expiresAt - The expiration timestamp of the token.
   *
   * @throws {NotFoundException} If no user exists with the given email.
   * @throws {BadRequestException} If the user is already verified or cannot receive a token.
   * @throws {InternalServerErrorException} If email sending fails or database errors occur.
   *
   * @example
   * // Request
   * POST /resend/email-verification
   * {
   *   "email": "user@example.com"
   * }
   *
   * // Success Response
   * {
   *   "verify_token": "evt_92jx81m4",
   *   "expiresAt": "2025-09-09T14:00:00.000Z"
   * }
   *
   * // Error Response
   * {
   *   "statusCode": 404,
   *   "message": "User not found"
   * }
   */
  @Post('/resend/email-verification')
  async ResendEmailVerificationToken(@Body() body: InitializeUserDto) {
    return this.authService.ResendEmailVerificationToken(body.email);
  }
  /**
   * @route POST /sign-in
   * @summary Sign in a credentials-based user and create a session.
   *
   * @description
   * This endpoint allows a user to log in with their email and password.
   *
   * Workflow:
   * 1. Accepts the user's email and password, along with client metadata (IP, OS, User-Agent).
   * 2. Validates the credentials using the `loginUser` helper.
   * 3. If credentials are valid, creates a new session for the user.
   * 4. Signs a JWT token containing session ID, expiry, and user ID.
   * 5. Returns the signed JWT and safe user object (sensitive fields like password are excluded).
   *
   * @param {SignInUserDto} body - The request payload containing credentials.
   * @param {string} body.email - User's email address (must be valid).
   * @param {string} body.password - User's password (min 6 characters).
   * @param {TclientMetadata} metadata - Client metadata including IP, OS, and User-Agent.
   *
   * @returns {Promise<Object>} Response object
   * @returns {string} token - JWT token for session authentication.
   * @returns {Object} user - Safe user object, excluding sensitive fields.
   * @returns {string} user.id - User's unique ID.
   * @returns {Date} user.created_at - User creation timestamp.
   * @returns {Date} user.updated_at - User last update timestamp.
   * @returns {string} user.name - User's name.
   * @returns {string} user.primary_email - User's primary email.
   * @returns {string} user.image_url - User's profile image URL.
   * @returns {boolean} user.is_verified - Whether the user's email is verified.
   *
   * @throws {BadRequestException} If credentials are invalid.
   * @throws {InternalServerErrorException} If session creation or JWT signing fails.
   *
   * @example
   * // Request
   * POST /sign-in
   * {
   *   "email": "user@example.com",
   *   "password": "SecurePass123"
   * }
   *
   * // Success Response
   * {
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "user": {
   *     "id": "usr_92jx81m4",
   *     "created_at": "2025-09-09T14:00:00.000Z",
   *     "updated_at": "2025-09-10T10:00:00.000Z",
   *     "name": "John Doe",
   *     "primary_email": "user@example.com",
   *     "image_url": "https://example.com/avatar.png",
   *     "is_verified": true
   *   }
   * }
   *
   * // Error Response
   * {
   *   "statusCode": 400,
   *   "message": "Invalid email or password"
   * }
   */
  @Post('/sign-in')
  async SignInCredentialsUser(
    @Body() body: SignInUserDto,
    @GetClientMetadata() metadata: TclientMetadata,
  ) {
    return this.authService.signInUser(body, metadata);
  }

  /**
   * Redirects the user to Google's OAuth 2.0 authorization page with a dynamic redirect URI.
   *
   * This endpoint initiates the Google OAuth flow by constructing the authorization URL
   * with required query parameters like `client_id`, `redirect_uri`, `response_type`,
   * `scope`, `access_type`, and `prompt`. The `redirect_url` provided by the frontend is used
   * as both the OAuth `redirect_uri` and the `state` parameter, which Google will return
   * to the callback endpoint after authorization.
   *
   * Throws a `BadRequestException` if the `redirect_url` is missing.
   *
   * @param {Response} res - Express response object used to perform the redirect.
   * @param {string} redirect_url - Required frontend URL to redirect the user after login; used as `redirect_uri` and `state`.
   *
   * @example
   * // Request
   * GET /sign-in/google?redirect_url=http://localhost:3000/dashboard
   *
   * // Result
   * Redirects the user to:
   * https://accounts.google.com/o/oauth2/v2/auth?
   * client_id=YOUR_CLIENT_ID&
   * redirect_uri=http://localhost:3000/dashboard&
   * response_type=code&
   * scope=openid%20email%20profile&
   * access_type=offline&
   * prompt=consent&
   * state=http%3A%2F%2Flocalhost%3A3000%2Fdashboard
   *
   * // Error Response (if redirect_url is missing)
   * {
   *   "statusCode": 400,
   *   "message": "missing redirect uri"
   * }
   */
  @Get('sign-in/google')
  async RedirectToGoogleOauth(
    @Res() res: Response,
    @Query('redirect_url') redirect_url: string,
  ) {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    if (redirect_url) throw new BadRequestException('missing redirect uri');
    const options = {
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirect_url,
      response_type: 'code',
      scope: ['openid', 'email', 'profile'].join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: redirect_url || '', // pass frontend redirect URL in state
    };

    url.search = new URLSearchParams(options).toString();

    return res.redirect(url.toString());
  }
  /**
   * Handles Google OAuth callback and signs in the user.
   *
   * This endpoint receives the query parameters returned by Google after user authorization,
   * fetches the user's Google profile, links or creates a user in the database, handles banned accounts
   * and email mismatches, creates a session, and returns a JWT token along with a sanitized user object.
   *
   * @param {OAuthGoogleQueryParamsDto} query - The query parameters from Google OAuth callback:
   *   - `code`: Authorization code returned by Google.
   *   - `scope`: OAuth scopes granted by the user.
   *   - `authuser`: The authenticated Google user index.
   *   - `prompt`: The OAuth prompt type (e.g., consent, select_account).
   *   - `state?`: Optional state parameter for CSRF protection or redirection.
   *
   * @param {TclientMetadata} metadata - Metadata about the client making the request:
   *   - `ip`: Client IP address.
   *   - `userAgent`: Client user agent string (browser info, OS, etc.).
   *   - `os`: Client operating system.
   *
   * @returns {Promise<{ token: string; user: any }>} JWT session token and sanitized user object.
   *
   * @throws {BadRequestException} If the Google email is not verified, the account is banned, or any other validation fails.
   *
   * @example
   * // Request
   * POST /callback/google?code=4/0AX4XfWg...&scope=email%20profile&authuser=0&prompt=consent
   *
   * // Success Response
   * {
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "user": {
   *     "id": "usr_92jx81m4",
   *     "created_at": "2025-09-09T14:00:00.000Z",
   *     "updated_at": "2025-09-10T10:00:00.000Z",
   *     "name": "John Doe",
   *     "primary_email": "user@example.com",
   *     "image_url": "https://example.com/avatar.png",
   *     "is_verified": true
   *   }
   * }
   *
   * // Error Response (unverified email or banned account)
   * {
   *   "statusCode": 400,
   *   "message": "Your Google email is not verified"
   * }
   */
  @Post('/callback/google')
  async SignInWithGoogle(
    @Query() query: OAuthGoogleQueryParamsDto,
    @GetClientMetadata() metadata: TclientMetadata,
  ) {
    return this.authService.SignInWithGoogle(query, metadata);
  }
}
