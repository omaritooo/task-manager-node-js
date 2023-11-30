"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetTokenFunction = exports.changedPasswordAfter = exports.createPasswordResetToken = exports.authenticate = exports.randomCrypto = void 0;
const crypto_1 = __importDefault(require("crypto"));
const randomCrypto = () => crypto_1.default.randomBytes(128).toString('base64');
exports.randomCrypto = randomCrypto;
const authenticate = (salt, password) => {
    return crypto_1.default
        .createHmac('sha256', [salt, password].join('/'))
        .update(process.env.JWT_SECRET)
        .digest('hex');
};
exports.authenticate = authenticate;
const createPasswordResetToken = () => {
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
};
exports.createPasswordResetToken = createPasswordResetToken;
const changedPasswordAfter = (JWTTimestamp, passwordChangedAt) => {
    if (passwordChangedAt) {
        const changedTime = passwordChangedAt.getTime() / 1000;
        return JWTTimestamp < changedTime;
    }
    return false;
};
exports.changedPasswordAfter = changedPasswordAfter;
const passwordResetTokenFunction = (passwordResetToken, passwordResetExpires) => {
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    passwordResetToken = crypto_1.default
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};
exports.passwordResetTokenFunction = passwordResetTokenFunction;
