import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from '../utils/appError';
interface Errors {
  message: string;
}

interface IError extends Error {
  status: string;
  statusCode: number;
  isOperational: boolean;
  errors?: Errors;
  path?: string;
  value?: string;
  errmsg?: string | undefined;
}
type Err = typeof AppError;
const sendErrorDev = (err: IError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};
const sendErrorProd = (err: IError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleCastErrorDB = (err: IError) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleJWTError = (err: IError) => new AppError('Invalid Token.', 401);

const handleDuplicateFieldsDB = (err: IError) => {
  let field;
  let message = '';
  if (err.errmsg) {
    field = err.errmsg.match(/(["'"])(\\?.)*?\1/);
    if (field) {
      message = `Duplicate field value: ${field[0]}. Please use another value`;
    }
  }

  return new AppError(message, 400);
};

export const ErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
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
