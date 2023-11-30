import { RequestHandler } from 'express';

export const catchAsync = (fn: any): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
