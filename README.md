
# Auth Module API

This is the **Authentication Module** for a NestJS application, handling:

* Email-based sign-up & verification
* Credentials-based login
* Password reset flows
* Google OAuth 2.0 login

It uses JWT for session management (`AUTH_SECRET`) and OTP/email verification for security.

---

## Table of Contents

* [Installation](#installation)
* [Environment Variables](#environment-variables)
* [Endpoints](#endpoints)

  * [Sign Up - Verify Email](#sign-up---verify-email)
  * [Sign Up - Verify OTP & Create User](#sign-up---verify-otp--create-user)
  * [Sign In - Credentials](#sign-in---credentials)
  * [Sign In - Google OAuth](#sign-in---google-oauth)
  * [Password Reset](#password-reset)
  * [Resend Email Verification](#resend-email-verification)
* [Error Handling](#error-handling)

---

## Installation

```bash
git clone <repo-url>
cd <repo>
npm install
npm run start:dev
```

Make sure you have **PostgreSQL or your chosen DB** configured with Prisma.

---

## Environment Variables

```env
# Auth / JWT
AUTH_SECRET=your_super_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email service
EMAIL_PROVIDER_API_KEY=your_email_api_key
```

> ⚠ `AUTH_SECRET` is used to sign JWT sessions. Do **not** use `JWT_SECRET`.

---

## Endpoints

### Sign Up - Verify Email

**POST** `/auth/sign-up/verify-email`

**Description:** Initialize a user account by "booking" an email before full registration. Sends OTP to email.

**Request Body:**

```json
{
  "email": "jane.doe@example.com"
}
```

**Success Response:**

```json
{
  "verify_token": "abc123xyz",
  "expiresAt": "2025-09-09T13:30:00.000Z"
}
```

**Error Response:**

```json
{
  "error": "User with this email already exists."
}
```

---

### Sign Up - Verify OTP & Create User

**POST** `/auth/sign-up`

**Description:** Complete registration by verifying OTP and creating user credentials. Returns JWT session.

**Request Body:**

```json
{
  "token_id": "abc123xyz",
  "otp": "456789",
  "name": "Jane Doe",
  "password": "StrongPassword123"
}
```

**Success Response:**

```json
{
  "token": "jwt.session.token.here",
  "user": {
    "id": "usr_92jx81m4",
    "created_at": "2025-09-09T12:34:56.000Z",
    "updated_at": "2025-09-09T12:34:56.000Z",
    "name": "Jane Doe",
    "primary_email": "jane.doe@example.com",
    "image_url": "https://cdn.example.com/default-avatar.png",
    "is_verified": true
  }
}
```

---

### Sign In - Credentials

**POST** `/auth/sign-in`

**Description:** Log in a user with email and password. Returns JWT session.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response:**

```json
{
  "token": "jwt.session.token.here",
  "user": {
    "id": "usr_92jx81m4",
    "created_at": "2025-09-09T14:00:00.000Z",
    "updated_at": "2025-09-10T10:00:00.000Z",
    "name": "John Doe",
    "primary_email": "user@example.com",
    "image_url": "https://example.com/avatar.png",
    "is_verified": true
  }
}
```

---

### Sign In - Google OAuth

#### Redirect to Google

**GET** `/auth/sign-in/google?redirect_url=<frontend-url>`

Redirects user to Google OAuth with the frontend URL passed as `redirect_uri` and `state`.

**Error Response:**

```json
{
  "statusCode": 400,
  "message": "missing redirect uri"
}
```

#### Google Callback

**POST** `/auth/callback/google`

**Description:** Handles Google's OAuth callback, signs in the user, creates a session, and returns JWT.

**Query Params:**

```json
{
  "code": "auth_code_from_google",
  "scope": "email profile",
  "authuser": 0,
  "prompt": "consent",
  "state": "frontend_redirect_url"
}
```

**Success Response:**

```json
{
  "token": "jwt.session.token.here",
  "user": {
    "id": "usr_92jx81m4",
    "created_at": "2025-09-09T14:00:00.000Z",
    "updated_at": "2025-09-10T10:00:00.000Z",
    "name": "John Doe",
    "primary_email": "user@example.com",
    "image_url": "https://example.com/avatar.png",
    "is_verified": true
  }
}
```

---

### Password Reset

#### Request OTP

**POST** `/auth/reset-password/request`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Success Response:**

```json
{
  "tokenId": "prt_92jx81m4",
  "expiresAt": "2025-09-09T14:00:00.000Z"
}
```

#### Reset Password

**POST** `/auth/reset-password`

**Request Body:**

```json
{
  "token_id": "prt_92jx81m4",
  "otp": "123456",
  "password": "NewStrongPassword123"
}
```

**Success Response:**

```json
{
  "success": true
}
```

---

### Resend Email Verification

**POST** `/auth/resend/email-verification`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Success Response:**

```json
{
  "verify_token": "evt_92jx81m4",
  "expiresAt": "2025-09-09T14:00:00.000Z"
}
```

---

## Error Handling

* **400 Bad Request:** Invalid input, missing parameters, invalid OTP.
* **404 Not Found:** User not found.
* **401 Unauthorized:** User is banned.
* **500 Internal Server Error:** Database or email sending failure.

---

## Notes

* All endpoints are **credentials-safe**, no passwords or sensitive info are exposed.
* JWT session tokens use `AUTH_SECRET`.
* Google OAuth supports **dynamic redirect URLs** via the `state` parameter.
* OTPs and verification tokens expire to enhance security.

---

