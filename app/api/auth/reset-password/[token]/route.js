import crypto from 'crypto';
import { NextResponse } from 'next/server';
import * as User from '../../../../../models/User';
import { withHandler, readJson, ApiError } from '../../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Reset password using the token emailed to the user
export const POST = withHandler(async (request, { params }) => {
  const { token } = params;
  const { password } = await readJson(request);
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findByValidResetToken(hashedToken);
  if (!user) throw new ApiError('Reset link is invalid or has expired', 400);

  await User.updatePassword(user._id, password);

  return NextResponse.json({ message: 'Password has been reset successfully. You can now log in.' });
});
