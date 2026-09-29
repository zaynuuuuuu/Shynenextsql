import nodemailer from 'nodemailer';

// If SMTP creds aren't configured, we log to console instead of failing —
// keeps local dev/demo usable without a mail provider.
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('--- EMAIL (SMTP not configured, logging instead) ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', html);
    console.log('-----------------------------------------------------');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};

export default sendEmail;
