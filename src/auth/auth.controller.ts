import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InitializeUserDto } from 'src/dto/users/initialize-user.dto';
import { VerifyCreateUserDto } from 'src/dto/users/verify-create-user-dto';
import { GetClientMetadata } from 'src/decorators/get-client-metadata';
import { TclientMetadata } from 'src/types/client-metadata';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService:AuthService
    ){}
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
    async SignUpVerifyCredentialsUser(@Body() body:VerifyCreateUserDto ,@GetClientMetadata() metadata:TclientMetadata, @Res() res:Response){
        const response = await this.authService.VerifyCreateCredentialsUser(body,metadata)
        return response
    }
}
