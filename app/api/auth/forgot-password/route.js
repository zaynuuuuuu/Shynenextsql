import crypto from 'crypto';
import { NextResponse } from 'next/server';
import * as User from '../../../../models/User';
import sendEmail from '../../../../lib/sendEmail';
import { withHandler, readJson } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Request a password reset — emails a reset link with a hashed token
export const POST = withHandler(async (request) => {
  const { email } = await readJson(request);
  const user = await User.findByEmail(email);

  // Always respond the same way whether or not the user exists, to avoid leaking account existence
  if (!user) {
    return NextResponse.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  await User.setResetToken(user._id, hashedToken, new Date(Date.now() + 30 * 60 * 1000)); // 30 min

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset. Click the link below (valid for 30 minutes):</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>If you didn't request this, you can safely ignore this email.</p>`,
  });

  return NextResponse.json({ message: 'If an account exists for that email, a reset link has been sent.' });
});
