import crypto from 'crypto';
import bcrypt from 'bcrypt';

export const randomCrypto = () => crypto.randomBytes(128).toString('base64');

export const authenticate = (salt: string, password: string) => {
  return crypto
    .createHmac('sha256', [salt, password].join('/'))
    .update(process.env.JWT_SECRET as string)
    .digest('hex');
};

export const createPasswordResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  crypto.createHash('sha256').update(resetToken).digest('hex');
};
export const changedPasswordAfter = (
  JWTTimestamp: number,
  passwordChangedAt: Date
) => {
  if (passwordChangedAt) {
    const changedTime = passwordChangedAt.getTime() / 1000;
    return JWTTimestamp < changedTime;
  }

  return false;
};

export const passwordResetTokenFunction = (
  passwordResetToken: string,
  passwordResetExpires: number
) => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
