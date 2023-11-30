import express, { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import router from './routes/index';
import morgan from 'morgan';
import { ErrorHandler } from './controllers/errorController';
import { AppError } from './utils/appError';
import helmet from 'helmet';
import mongoSanitze = require('express-mongo-sanitize');
const xss = require('xss-clean');
dotenv.config();

export const app: Express = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(mongoSanitze());
app.use(helmet());
app.use(xss());

app.use(router);
app.use(ErrorHandler);
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});
