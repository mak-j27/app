const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@example.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

let sgMail = null;
let enabled = false;
if (SENDGRID_API_KEY) {
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(SENDGRID_API_KEY);
    enabled = true;
  } catch (err) {
    console.warn('SendGrid package not installed or failed to load. Email sending disabled.', err && err.message);
    enabled = false;
  }
}
async function sendResetEmail(to, token) {
  if (!enabled) {
    console.log('SendGrid not configured, skipping email. Token:', token);
    return false;
  }

  const resetUrl = `${FRONTEND_URL.replace(/\/$/, '')}/reset-password?email=${encodeURIComponent(to)}&token=${encodeURIComponent(token)}`;

  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Password reset request',
    text: `You requested a password reset. Use this token: ${token}\nOr click: ${resetUrl}`,
    html: `<p>You requested a password reset.</p><p>Token: <strong>${token}</strong></p><p>Or click <a href="${resetUrl}">this link</a> to reset your password.</p>`
  };

  await sgMail.send(msg);
  return true;
}

module.exports = { sendResetEmail, isEnabled: () => enabled };
