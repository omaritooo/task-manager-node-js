import mongoose, {
  Document,
  InferSchemaType,
  Schema,
  SchemaType,
} from 'mongoose';
import { AutoIncrementID } from '@typegoose/auto-increment';
import validator from 'validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { IUser } from './model';
import { ObjectId } from 'mongodb';
import { Projects } from './projectModel';

const userSchema: Schema<IUser> = new Schema(
  {
    userId: {
      type: Number,
    },
    name: {
      type: String,
      required: [true, 'A user must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'This name exceeds the max length of 40 characters'],
      minLength: [6, 'This name exceeds the min length of 10 characters'],
    },
    authentication: {
      password: {
        type: String,
        required: true,
        select: false,
      },
      passwordConfirm: {
        type: String || undefined,
        required: true,
        select: false,
      },
      salt: {
        type: String,
        select: false,
      },
      jwt: {
        type: String,
        select: false,
        default: null,
        required: false,
      },
    },
    email: {
      type: String,
      required: [true, 'A user email is required.'],
      validate: [validator.isEmail, 'Please provide a valid email'],
      lowercase: true,
    },
    projects: [
      {
        project: {
          type: ObjectId,
          ref: 'projects',
        },
        permission: {
          type: String,
          enum: ['author', 'contributor'],
          default: 'author',
        },
      },
    ],
    photo: {
      type: String,
      enum: ['one', 'two', 'three', 'none'],
      default: 'none',
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },

  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.plugin(AutoIncrementID, { field: 'userId', startAt: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('authentication.password')) {
    return next();
  }
  if (this.authentication)
  {
    this.authentication.password = await bcrypt.hash(
    this.authentication.password,
    12
  );

  this.authentication.passwordConfirm = undefined;
  }
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function (this: IUser) {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
};

userSchema.pre('validate', function (this: IUser, next) {
  if (this.authentication && this.authentication.password !== this.authentication.passwordConfirm) {
    this.invalidate('passwordConfirmation', 'enter the same password');
  }
  next();
});

userSchema.post('findOne', async function (doc) {
  if (doc) {
    await doc.populate({
      path: 'projects',
      populate: {
        path: 'project',
        select: '',
      },
    });
  }
});

userSchema.post('find', async function (docs) {
  if (docs) {
    for (const doc in docs) {
      await docs[doc].populate({
        path: 'projects',
        populate: {
          path: 'project',
          select: '',
        },
      });
    }
  }
});
userSchema.post('findOneAndDelete', async function (doc) {
  const user = doc;

  const mappedIds = user.projects
    .map((el: any) => (el.permission === 'author' ? el.project : undefined))
    .filter((name: ObjectId) => name !== undefined);

  const deletion = await Projects.deleteMany({
    _id: { $in: mappedIds },
  });
});
export type User = InferSchemaType<typeof userSchema>;

userSchema.index(
  { userId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

export const Users = mongoose.model('users', userSchema);
