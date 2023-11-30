import { ApiFeatures } from './apiFeatures';
import { Response, Request, NextFunction, RequestHandler } from 'express';
import { catchAsync } from './catchAsync';
import { AppError } from './appError';
import { StatusCodes } from 'http-status-codes';

export const getAll = (model: any, userFlag = false) =>
  catchAsync(async (req: Request, res: Response) => {
    let query = {};
    if (!userFlag) {
      query = {
        author: res.locals.user._id,
      };
    }

    const features = new ApiFeatures(model.find(query), req.query)
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
  });

export const getOne = (model: any, getVal = '') =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.user._id;
    const { id } = req.params;
    const idVal = {
      project: model.findOne({
        projectId: id,
        $or: [{ author: userId }, { contributors: { $in: [userId] } }],
      }),
      task: await model.findOne({
        taskId: id,
        $or: [{ author: userId }, { contributors: { $in: [userId] } }],
      }),
      user: await model.findOne({
        userId: id,
      }),
    };

    const result = await idVal[getVal as keyof typeof idVal];

    if (!result) {
      res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'Item with ID is not found.',
        data: null,
      });
      // next(new AppError('Invalid ID', 404));
    } else {
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    }
  });

export const createOne = (model: any) =>
  catchAsync(async (req: Request, res: Response) => {
    const results = await model.create({
      ...req.body,
      author: res.locals.user._id,
    });
    res.status(200).json({
      status: 'success',
      data: results,
    });
  });
export const deleteOne = (model: any, deleteVal = '') =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let results;
    const userId = res.locals.user._id;
    if (deleteVal === 'projectId') {
      results = await model.findOneAndDelete({
        projectId: req.params.id,
        author: userId,
      });
    } else {
      results = await model.findOneAndDelete({
        taskId: req.params.id,
        author: userId,
      });
    }
    if (!results) {
      next(new AppError('No task found with that ID', 404));
    } else {
      res.status(200).json({
        status: 'success',
        message: `${results.name} deleted.`,
      });
    }
  });

export const updateOne = (model: any, getVal = '') =>
  catchAsync(async (req: Request, res: Response) => {
    const userId = res.locals.user._id;

    const idVal = {
      project: await model.findOneAndUpdate(
        {
          projectId: req.params.id,
          $or: [{ author: userId }, { contributors: { $in: [userId] } }],
        },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      ),
      task: await model.findOneAndUpdate(
        {
          taskId: req.params.id,
          projectId: req.body.projectId,
          $or: [{ author: userId }, { contributors: { $in: [userId] } }],
        },
        req.body,
        {
          runValidators: true,
        }
      ),
      user: 'userId',
    };

    const result = await idVal[getVal as keyof typeof idVal];

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });
