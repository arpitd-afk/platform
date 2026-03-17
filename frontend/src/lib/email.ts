import nodemailer from 'nodemailer';
import config from './config';
import logger from './logger';

let _transporter: any = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  const { host, user, pass, port } = config.smtp;

  if (!host || !user || !pass) {
    return null;
  }

  _transporter = nodemailer.createTransport({
    host,
    port: parseInt(port || '587'),
    secure: parseInt(port || '587') === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  return _transporter;
}

function wrap(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { margin:0; padding:0; background:#F7F4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width:580px; margin:0 auto; padding:40px 20px; }
    .card { background:#FFFFFF; border-radius:16px; padding:32px; border:1px solid #E2D8CE; }
    .logo { font-size:20px; font-weight:800; color:#1C1107; margin-bottom:32px; letter-spacing:-0.5px; }
    .logo span { color:#C8961E; }
    h1 { font-size:22px; font-weight:700; color:#1C1107; margin:0 0 12px; }
    p { font-size:15px; line-height:1.6; color:#5C4A38; margin:0 0 16px; }
    .btn { display:inline-block; padding:12px 28px; background:#C8961E; color:#fff; text-decoration:none;
           border-radius:10px; font-weight:600; font-size:15px; margin:8px 0; }
    .meta { font-size:13px; color:#9B8575; margin-top:24px; padding-top:20px; border-top:1px solid #E2D8CE; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">♟ Chess <span>Academy</span></div>
      ${content}
      <div class="meta">You're receiving this from Chess Academy Pro.</div>
    </div>
  </div>
</body>
</html>`;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  const transporter = await getTransporter();
  const from = `"Chess Academy Pro" <${process.env.SMTP_USER || 'noreply@chessacademy.com'}>`;

  if (!transporter) {
    console.log(`\n[EMAIL ─ Not configured, logging only]`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Preview: ${(text || '').slice(0, 120)}...`);
    return { messageId: 'console-only' };
  }

  const info = await transporter.sendMail({ from, to, subject, html, text });
  logger.info(`[Email sent] ${subject} → ${to} (${info.messageId})`);
  return info;
}

export async function sendWelcomeEmail({ to, name, role, academyName }: any) {
  const roleLabel = role === 'coach' ? 'coach' : role === 'parent' ? 'parent' : 'student';
  return sendEmail({
    to,
    subject: `Welcome to ${academyName || 'Chess Academy Pro'}!`,
    text: `Hi ${name}, welcome to ${academyName}! You've been added as a ${roleLabel}.`,
    html: wrap(`
      <h1>Welcome to ${academyName || 'Chess Academy'}, ${name}! ♟</h1>
      <p>Your account has been created. You've been added as a <strong>${roleLabel}</strong>.</p>
      <a href="${config.frontendUrl}/login" class="btn">Go to Dashboard →</a>
    `),
  });
}

export async function sendPasswordResetEmail({ to, name, resetToken }: any) {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
  return sendEmail({
    to,
    subject: 'Reset your Chess Academy password',
    text: `Hi ${name}, click this link to reset your password: ${resetUrl}`,
    html: wrap(`
      <h1>Reset your password</h1>
      <p>Hi ${name}, we received a request to reset your password. Click the button below.</p>
      <a href="${resetUrl}" class="btn">Reset Password →</a>
    `),
  });
}
