import { NextFunction, Request, Response } from 'express';
import { Tasks } from '../models/taskModel';
import { catchAsync } from '../utils/catchAsync';
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from '../utils/helperFunctions';
import { Users } from '../models/userModel';
import { AppError } from '../utils/appError';
import { STATUS_CODES } from 'http';
import { StatusCodes } from 'http-status-codes';
import { ApiFeatures } from '../utils/apiFeatures';

export const getTasks = getAll(Tasks);

export const getTask = getOne(Tasks, 'task');

export const updateTask = updateOne(Tasks, 'task');

export const createTask = createOne(Tasks);

export const deleteTask = deleteOne(Tasks, 'task');

export const getProjectTasks = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const features = new ApiFeatures(Tasks.find({ projectId: id }), req.query)
      .limitFields()
      .search()
      .sort()
      .filter()
      .paginate();

    const response = await features.query;

    res.status(200).json({
      status: 'success',
      length: response.length,
      data: response,
      page: req.query.page,
      limit: req.query.limit,
    });
  }
);

export const assignTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, taskId } = req.params;
    const User = await Users.findOne({ userId: userId });
    if (!User) {
      next(new AppError('User does not exist', StatusCodes.NOT_FOUND));
    }
    const Task = await Tasks.findOneAndUpdate(
      {
        taskId: taskId,
        author: res.locals.user.id,
      },
      {
        assignedTo: User ? User._id : null,
      }
    );

    res.status(200).json({ status: 'OK', Task });
  }
);
