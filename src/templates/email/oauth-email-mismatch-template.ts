export function generateOauthMismatchEmail({
  accountEmail,
  oauthEmail,
  provider,
}: {
  accountEmail: string;
  oauthEmail: string;
  provider: string;
}) {
  return `
  <html>
    <body style="font-family: Arial, sans-serif; background:#f9fafb; padding:20px;">
      <div style="max-width:500px; margin:auto; background:#fff; padding:20px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
        <p style="color:#333;">
          Your <strong>${provider}</strong> account email (<strong>${oauthEmail}</strong>) 
          does not match your registered account email (<strong>${accountEmail}</strong>).
        </p>
        <p style="color:#555;">
          Please update your account email in your account settings to fix this.
        </p>
      </div>
    </body>
  </html>
  `;
}
