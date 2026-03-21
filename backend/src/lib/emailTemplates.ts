export const EMAIL_VERIFY_TEMPLATE = (name: string, email: string, otp: string, verifyLink: string) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
    <h1>Verify your email</h1>
    <p>Hello ${name}, use the code below to verify <strong>${email}</strong>.</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${otp}</div>
    <p>This code expires in 10 minutes.</p>
    <p><a href="${verifyLink}">Verify from browser</a></p>
  </div>
`;

export const WELCOME_EMAIL_TEMPLATE = (name: string) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
    <h1>Welcome to ShareLive</h1>
    <p>Hello ${name}, your email has been verified and your account is ready.</p>
  </div>
`;

export const PASSWORD_RESET_TEMPLATE = (name: string, otp: string, resetLink: string) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
    <h1>Reset your password</h1>
    <p>Hello ${name}, use this OTP to reset your password:</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${otp}</div>
    <p>This code expires in 10 minutes.</p>
    <p><a href="${resetLink}">Open reset page</a></p>
  </div>
`;
