export function generateOtpEmail({ title, desc, email, otp }:{ title:string, desc:string, email:string, otp:string }) {
  return `
  <html>
    <body style="font-family: Arial, sans-serif; background:#f9fafb; padding:20px;">
      <div style="max-width:500px;margin:auto;background:#fff;padding:20px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
        <h2 style="margin-bottom:10px;color:#111;">${title}</h2>
        <p style="margin:0 0 15px;color:#555;">${desc}</p>
        <div style="font-size:24px;font-weight:bold;letter-spacing:4px;margin:20px 0;padding:10px;border:1px dashed #999;display:inline-block;">
          ${otp}
        </div>
        <p style="margin-top:15px;color:#666;font-size:14px;">
          This code was requested for <strong>${email}</strong>. If it wasn’t you, ignore this mail.
        </p>
      </div>
    </body>
  </html>
  `;
}
