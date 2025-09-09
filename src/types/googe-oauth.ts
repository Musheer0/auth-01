export type GoogleOAuthUser = {
  sub: string; // Unique Google user ID
  name: string; // Full name
  given_name: string; // First name
  family_name: string; // Last name
  picture: string; // Profile picture URL
  email: string; // User email
  email_verified: boolean; // Whether Google verified the email
};
