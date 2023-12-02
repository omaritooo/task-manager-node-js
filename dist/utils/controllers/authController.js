"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProjectAuthor = exports.resetPassword = exports.forgotPassword = exports.protectRoute = exports.logout = exports.login = exports.createUser = void 0;
const userModel_1 = require("../../models/userModel");
const util_1 = require("util");
const catchAsync_1 = require("../catchAsync");
const appError_1 = require("../appError");
const crypto_1 = __importDefault(require("crypto"));
const http_status_codes_1 = require("http-status-codes");
const email_1 = require("../email");
const projectModel_1 = require("../../models/projectModel");
const jwt = require('jsonwebtoken');
const signToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
    });
};
const sendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    if (process.env.JWT_COOKIE_EXPIRY) {
        res.cookie('jwt', token, {
            expires: new Date(Date.now() +
                parseInt(process.env.JWT_COOKIE_EXPIRY) * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: true,
        });
    }
    res.status(statusCode).json({
        status: http_status_codes_1.ReasonPhrases.OK,
        token: token,
        user,
    });
};
exports.createUser = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, password, email, passwordConfirm } = req.body;
    if (!name || !password || !email || !passwordConfirm) {
        return next(new appError_1.AppError('Missing data', 401));
    }
    if (password !== passwordConfirm) {
        return next(new appError_1.AppError("Passwords don't match", http_status_codes_1.StatusCodes.FORBIDDEN));
    }
    const existingUser = yield userModel_1.Users.findOne({ email: email });
    if (existingUser) {
        return next(new appError_1.AppError('User already exists.', http_status_codes_1.StatusCodes.FORBIDDEN));
    }
    const newUser = yield userModel_1.Users.create({
        name,
        email,
        authentication: {
            password,
            passwordConfirm,
        },
    });
    sendToken(newUser, 201, res);
}));
exports.login = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new appError_1.AppError('Please provide email and password!', 400));
    }
    const user = yield userModel_1.Users.findOne({ email }).select('+authentication.password');
    if (!user ||
        !(yield user.correctPassword(password, user.authentication.password))) {
        return next(new appError_1.AppError('Incorrect email or password', 401));
    }
    sendToken(user, http_status_codes_1.StatusCodes.OK, res);
}));
const logout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { headers } = req;
    if (!headers.authorization) {
        next(new appError_1.AppError('Unauthorized.', 403));
    }
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ status: 'success' });
});
exports.logout = logout;
const protectRoute = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new appError_1.AppError('You are not logged in.', 401));
    }
    const decoded = yield (0, util_1.promisify)(jwt.verify)(token, process.env.JWT_SECRET);
    const user = yield userModel_1.Users.findById(decoded.id);
    if (!user) {
        return next(new appError_1.AppError('The token belong to this user not longer exists', 401));
    }
    //   const protectedUser = changedPasswordAfter(
    //     decoded.iat,
    //     user.passwordChangedAt as Date
    //   );
    res.locals.user = user;
    next();
});
exports.protectRoute = protectRoute;
exports.forgotPassword = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return next(new appError_1.AppError(http_status_codes_1.ReasonPhrases.BAD_REQUEST, http_status_codes_1.StatusCodes.BAD_REQUEST));
    }
    const user = yield userModel_1.Users.findOne({ email: email });
    if (!user) {
        return next(new appError_1.AppError('This user does not exist', http_status_codes_1.StatusCodes.NOT_FOUND));
    }
    const resetToken = user.createPasswordResetToken();
    yield user.save({ validateBeforeSave: false });
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Reset your password here: ${resetURL}.\n if you didn't forget your password, please ignore this email!`;
    try {
        yield (0, email_1.sendEmail)({
            email: email,
            subject: 'Your password reset token',
            text: message,
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: http_status_codes_1.ReasonPhrases.OK,
            data: user,
        });
    }
    catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        yield user.save({ validateBeforeSave: false });
        return next(new appError_1.AppError(http_status_codes_1.ReasonPhrases.INTERNAL_SERVER_ERROR, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR));
    }
}));
exports.resetPassword = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const hashedToken = crypto_1.default
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    const user = yield userModel_1.Users.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
        return next(new appError_1.AppError(http_status_codes_1.ReasonPhrases.NOT_FOUND, http_status_codes_1.StatusCodes.NOT_FOUND));
    }
    user.authentication.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    yield user.save();
}));
const checkProjectAuthor = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.body;
    const userId = res.locals.user.id;
    try {
        const project = yield projectModel_1.Projects.findOne({ projectId: projectId });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.author) {
            if (project.author.id === userId) {
                return next();
            }
            else {
                return res.status(403).json({
                    error: 'Unauthorized: Only the project author can create tasks',
                });
            }
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.checkProjectAuthor = checkProjectAuthor;
