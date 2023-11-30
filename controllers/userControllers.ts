import { deleteOne, getAll, getOne } from '../utils/helperFunctions';
import { Users } from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import { NextFunction, Request, Response } from 'express';
import { Projects } from '../models/projectModel';
import { ObjectId } from 'mongoose';

export const getAllUsers = getAll(Users, true);

export const getUser = getOne(Users, 'user');

export const deleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = res.locals;

    const value = await Users.findByIdAndDelete(user.id);

    res.status(200).json({
      status: 'success',
      value,
    });
  }
);
