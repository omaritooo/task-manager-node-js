import { NextFunction, Response, Request, RequestHandler } from 'express';
import { User, Users } from '../models/userModel';
import { promisify } from 'util';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { sendEmail } from '../utils/email';
import { Projects } from '../models/projectModel';
const jwt = require('jsonwebtoken');

const signToken = (id: number | ObjectId) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY as string,
  });
};

const sendToken = (user: User, statusCode: number, res: Response) => {
  const token = signToken(user._id);
  if (process.env.JWT_COOKIE_EXPIRY) {
    res.cookie('jwt', token, {
      expires: new Date(
        Date.now() +
          parseInt(process.env.JWT_COOKIE_EXPIRY) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: true,
    });
  }

  if (user)
  {
  delete user.authentication;
  }
  res.status(statusCode).json({
    status: ReasonPhrases.OK,
    token: token,
    user,
  });
};

export const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, password, email, passwordConfirm } = req.body;
    if (!name || !password || !email || !passwordConfirm) {
      return next(new AppError('Missing data', 401));
    }

    if (password !== passwordConfirm) {
      return next(new AppError("Passwords don't match", StatusCodes.FORBIDDEN));
    }

    const existingUser = await Users.findOne({ email: email });

    if (existingUser) {
      return next(new AppError('User already exists.', StatusCodes.FORBIDDEN));
    }

    const newUser = await Users.create({
      name,
      email,
      authentication: {
        password,
        passwordConfirm,
      },
    });
    sendToken(newUser, 201, res);
  }
);
export const login: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }

    const user = await Users.findOne({ email }).select(
      '+authentication.password'
    );

   if (user?.authentication)
   {
     if (
      !user ||
      !(await user.correctPassword(password, user.authentication.password))
    ) {
      return next(new AppError('Incorrect email or password', 401));
    }
   }

   user ? sendToken(user, StatusCodes.OK, res) : null;
  }
);

export const logout: RequestHandler = async (req, res, next) => {
  const { headers } = req;

  if (!headers.authorization) {
    next(new AppError('Unauthorized.', 403));
  }

  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in.', 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await Users.findById(decoded.id);
  if (!user) {
    return next(
      new AppError('The token belong to this user not longer exists', 401)
    );
  }
  //   const protectedUser = changedPasswordAfter(
  //     decoded.iat,
  //     user.passwordChangedAt as Date
  //   );
  res.locals.user = user;
  next();
};

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) {
      return next(
        new AppError(ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST)
      );
    }
    const user = await Users.findOne({ email: email });

    if (!user) {
      return next(
        new AppError('This user does not exist', StatusCodes.NOT_FOUND)
      );
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Reset your password here: ${resetURL}.\n if you didn't forget your password, please ignore this email!`;
    try {
      await sendEmail({
        email: email,
        subject: 'Your password reset token',
        text: message,
      });
      res.status(StatusCodes.OK).json({
        status: ReasonPhrases.OK,
        data: user,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          ReasonPhrases.INTERNAL_SERVER_ERROR,
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await Users.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError(ReasonPhrases.NOT_FOUND, StatusCodes.NOT_FOUND));
    }
    if (user.authentication)
    {
    user.authentication.password = req.body.password;

    }
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
  }
);

export const checkProjectAuthor: RequestHandler = async (req, res, next) => {
  const { projectId } = req.body;
  const userId = res.locals.user.id;

  try {
    const project = await Projects.findOne({ projectId: projectId });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.author) {
      if ((project.author as any).id === userId) {
        return next();
      } else {
        return res.status(403).json({
          error: 'Unauthorized: Only the project author can create tasks',
        });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
