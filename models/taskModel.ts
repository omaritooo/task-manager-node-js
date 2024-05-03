import { InferSchemaType, Schema, model } from 'mongoose';
import { AutoIncrementID } from '@typegoose/auto-increment';
import { ObjectId } from 'mongodb';
import { Projects } from './projectModel';
import { AppError } from '../utils/appError';
import { ITask } from './model';

const taskSchema = new Schema<ITask>(
  {
    taskId: {
      type: Number,
    },
    projectId: {
      type: Number,
      required: [true, 'A task must be linked to a project'],
    },
    project: {
      ref: 'projects',
      type: ObjectId,
    },
    author: {
      ref: 'users',
      type: ObjectId,
    },
    assignedTo: {
      ref: 'users',
      type: ObjectId,
    },
    name: {
      type: String,
      required: [true, 'A task must have a name'],

      maxLength: [40, 'This name exceeds the max length of 40 characters'],
      minLength: [6, 'This name exceeds the min length of 10 characters'],
    },
    description: {
      type: String,
      default: '',
    },

    priority: {
      type: String,
      required: [true, 'A priority level is required'],
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: 'Priority must either be: low, medium, high or urgent ',
      },
      default: 'low',
    },
    estimatedTime: {
      type: Date,
      required: [true, 'A time estimate is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['backlog', 'in progress', 'done'],
        message: 'Status must be one of backlog, in progress and done',
      },
      default: 'backlog',
    },
  },

  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

taskSchema.plugin(AutoIncrementID, { field: 'taskId', startAt: 1 });

taskSchema.pre('save', async function (next) {
  const result = await Projects.findOneAndUpdate(
    { projectId: this.projectId },
    { $push: { tasks: this._id } }
  );
  if (!result) {
    next(new AppError('Project ID does not exist', 403));
  }

  if (this.assignedTo === null) {
    this.assignedTo === this.author;
  }
  next();
});

taskSchema.post('findOne', async function (doc) {
  if (doc) {
    await doc.populate([
      { path: 'author', select: 'name email _id userId' },
      { path: 'project', select: 'name description projectId createdAt' },
      { path: 'assignedTo', select: 'name email _id userId' },
    ]);
  }
});

taskSchema.post('find', async function (docs) {
  if (docs) {
    for (const doc in docs) {
      await docs[doc].populate([
        { path: 'author', select: 'name email _id  userId' },
        { path: 'project', select: 'name description projectId createdAt' },
        { path: 'assignedTo', select: 'name email _id  userId' },
      ]);
    }
  }
});

taskSchema.pre('findOneAndUpdate', async function (this: any) {
  const updateDocument = this.getUpdate();

  const modifiedFields = Object.keys(updateDocument);
  if (modifiedFields.includes('assignedTo')) {
    const Project = await Projects.findOneAndUpdate(
      { projectId: updateDocument.projectId },
      { $addToSet: { contributors: updateDocument.assignedTo } }
    );
  }
});

export type Task = InferSchemaType<typeof taskSchema>;

taskSchema.index(
  { taskId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

export const Tasks = model('tasks', taskSchema);
