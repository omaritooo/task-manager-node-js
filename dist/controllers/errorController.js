"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
const appError_1 = require("../utils/appError");
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err,
    });
};
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    else {
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong',
        });
    }
};
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new appError_1.AppError(message, 400);
};
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new appError_1.AppError(message, 400);
};
const handleJWTError = (err) => new appError_1.AppError('Invalid Token.', 401);
const handleDuplicateFieldsDB = (err) => {
    let field;
    let message = '';
    if (err.errmsg) {
        field = err.errmsg.match(/(["'"])(\\?.)*?\1/);
        if (field) {
            message = `Duplicate field value: ${field[0]}. Please use another value`;
        }
    }
    return new appError_1.AppError(message, 400);
};
const ErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    }
    else if (process.env.NODE_ENV === 'production') {
        let error = Object.assign({}, err);
        if (err.name === 'CastError') {
            error = handleCastErrorDB(err);
        }
        if (error.code === 11000) {
            error = handleDuplicateFieldsDB(err);
        }
        if (error.name === 'ValidationError') {
            error = handleValidationErrorDB(err);
        }
        if (error.name === 'JsonWebTokenError') {
            error = handleJWTError(err);
        }
        sendErrorProd(error, res);
    }
};
exports.ErrorHandler = ErrorHandler;
