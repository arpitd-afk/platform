// ============================================================
// emailService.js — Nodemailer-backed email with HTML templates
// ============================================================
const nodemailer = require('nodemailer');

// ─── Transport factory (lazy-init, cached) ────────────────────
let _transporter = null;

function getTransporter() {
    if (_transporter) return _transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        // Fallback: log to console so devs see exactly what would have been sent
        return null;
    }

    _transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: parseInt(process.env.SMTP_PORT || '587') === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
    });

    return _transporter;
}

// ─── Base HTML wrapper ────────────────────────────────────────
function wrap(content) {
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
    .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;
             background:#FBF3E2; color:#9A6E00; margin-bottom:16px; }
    .highlight { background:#FBF3E2; border-left:3px solid #C8961E; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">♟ Chess <span>Academy</span></div>
      ${content}
      <div class="meta">You're receiving this from Chess Academy Pro. If you didn't expect this email, you can safely ignore it.</div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Core send function ───────────────────────────────────────
async function sendEmail({ to, subject, html, text }) {
    const transporter = getTransporter();
    const from = `"Chess Academy Pro" <${process.env.SMTP_USER || 'noreply@chessacademy.com'}>`;

    if (!transporter) {
        // Dev mode: print to console
        console.log(`\n[EMAIL ─ Not configured, logging only]`);
        console.log(`  To: ${to}`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Preview: ${(text || '').slice(0, 120)}...`);
        console.log(`  → To enable real emails: set SMTP_HOST, SMTP_USER, SMTP_PASS in .env\n`);
        return { messageId: 'console-only' };
    }

    const info = await transporter.sendMail({ from, to, subject, html, text });
    console.log(`[Email sent] ${subject} → ${to} (${info.messageId})`);
    return info;
}

// ─── Template helpers ─────────────────────────────────────────

// Welcome email on registration
async function sendWelcomeEmail({ to, name, role, academyName }) {
    const roleLabel = role === 'coach' ? 'coach' : role === 'parent' ? 'parent' : 'student';
    return sendEmail({
        to,
        subject: `Welcome to ${academyName || 'Chess Academy Pro'}!`,
        text: `Hi ${name}, welcome to ${academyName}! You've been added as a ${roleLabel}.`,
        html: wrap(`
      <div class="badge">Welcome</div>
      <h1>Welcome to ${academyName || 'Chess Academy'}, ${name}! ♟</h1>
      <p>Your account has been created. You've been added as a <strong>${roleLabel}</strong>.</p>
      <p>Log in to access your dashboard, view your classes, and start learning.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="btn">Go to Dashboard →</a>
    `),
    });
}

// Class reminder (sent ~1 hour before)
async function sendClassReminderEmail({ to, name, classTitle, scheduledAt, coachName, batchName }) {
    const dt = new Date(scheduledAt);
    const timeStr = dt.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
    return sendEmail({
        to,
        subject: `Reminder: "${classTitle}" starts soon`,
        text: `Hi ${name}, your class "${classTitle}" with ${coachName} starts at ${timeStr}.`,
        html: wrap(`
      <div class="badge">Class Reminder</div>
      <h1>Your class starts soon!</h1>
      <div class="highlight">
        <strong>${classTitle}</strong><br>
        🕐 ${timeStr}<br>
        👨‍🏫 Coach: ${coachName}${batchName ? `<br>👥 Batch: ${batchName}` : ''}
      </div>
      <p>Hi ${name}, don't forget your upcoming class. Make sure you're ready 5 minutes early.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/classes" class="btn">View Class →</a>
    `),
    });
}

// Assignment created notification to students
async function sendAssignmentNotificationEmail({ to, name, assignmentTitle, dueDate, coachName, passingScore }) {
    const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' }) : 'No deadline';
    return sendEmail({
        to,
        subject: `New assignment: ${assignmentTitle}`,
        text: `Hi ${name}, ${coachName} has assigned "${assignmentTitle}". Due: ${dueDateStr}.`,
        html: wrap(`
      <div class="badge">New Assignment</div>
      <h1>You have a new assignment</h1>
      <div class="highlight">
        <strong>${assignmentTitle}</strong><br>
        📅 Due: ${dueDateStr}<br>
        👨‍🏫 Set by: ${coachName}${passingScore ? `<br>🎯 Passing score: ${passingScore}/100` : ''}
      </div>
      <p>Hi ${name}, your coach has assigned new work for you. Submit before the deadline to get full marks.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/assignments" class="btn">View Assignment →</a>
    `),
    });
}

// Grade notification to student
async function sendGradeNotificationEmail({ to, name, assignmentTitle, score, maxScore, passed, feedback, coachName }) {
    const pct = Math.round((score / maxScore) * 100);
    const statusColor = passed ? '#15803D' : '#DC2626';
    const statusLabel = passed ? '✅ Passed' : '❌ Needs improvement';
    return sendEmail({
        to,
        subject: `Your grade for "${assignmentTitle}": ${score}/${maxScore}`,
        text: `Hi ${name}, you scored ${score}/${maxScore} on "${assignmentTitle}". ${passed ? 'Passed!' : 'Keep practicing.'}`,
        html: wrap(`
      <div class="badge">Grade Received</div>
      <h1>Your assignment has been graded</h1>
      <div class="highlight">
        <strong>${assignmentTitle}</strong><br>
        📊 Score: <strong style="color:${statusColor}">${score} / ${maxScore} (${pct}%)</strong><br>
        ${statusLabel}<br>
        👨‍🏫 Graded by: ${coachName}
      </div>
      ${feedback ? `<p><strong>Coach's feedback:</strong><br><em>"${feedback}"</em></p>` : ''}
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/assignments" class="btn">View Full Feedback →</a>
    `),
    });
}

// Announcement broadcast
async function sendAnnouncementEmail({ to, name, title, body, authorName }) {
    return sendEmail({
        to,
        subject: `📢 ${title}`,
        text: `Hi ${name}, new announcement from ${authorName}: ${title}\n\n${body}`,
        html: wrap(`
      <div class="badge">📢 Announcement</div>
      <h1>${title}</h1>
      <p>${body.replace(/\n/g, '<br>')}</p>
      <p class="meta">Posted by ${authorName}</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">Go to Dashboard →</a>
    `),
    });
}

// Password reset
async function sendPasswordResetEmail({ to, name, resetToken }) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    return sendEmail({
        to,
        subject: 'Reset your Chess Academy password',
        text: `Hi ${name}, click this link to reset your password: ${resetUrl} (expires in 1 hour)`,
        html: wrap(`
      <div class="badge">Password Reset</div>
      <h1>Reset your password</h1>
      <p>Hi ${name}, we received a request to reset your password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
      <a href="${resetUrl}" class="btn">Reset Password →</a>
      <p>If you didn't request this, you can safely ignore this email. Your password won't change.</p>
    `),
    });
}

// Tournament starting notification
async function sendTournamentStartEmail({ to, name, tournamentName, startTime, venue }) {
    const timeStr = new Date(startTime).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
    return sendEmail({
        to,
        subject: `Tournament "${tournamentName}" is starting!`,
        text: `Hi ${name}, the tournament "${tournamentName}" starts at ${timeStr}.`,
        html: wrap(`
      <div class="badge">🏆 Tournament</div>
      <h1>Your tournament is starting!</h1>
      <div class="highlight">
        <strong>${tournamentName}</strong><br>
        🕐 ${timeStr}${venue ? `<br>📍 ${venue}` : ''}
      </div>
      <p>Hi ${name}, your tournament is about to begin. Good luck!</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/tournaments" class="btn">View Tournament →</a>
    `),
    });
}

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendClassReminderEmail,
    sendAssignmentNotificationEmail,
    sendGradeNotificationEmail,
    sendAnnouncementEmail,
    sendPasswordResetEmail,
    sendTournamentStartEmail,
};