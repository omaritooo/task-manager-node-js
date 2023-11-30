import mongoose, { InferSchemaType } from 'mongoose';
import { AutoIncrementID } from '@typegoose/auto-increment';
import { ObjectId } from 'mongodb';
import { Tasks } from './taskModel';
import { Users } from './userModel';

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: Number,
    },
    author: {
      ref: 'users',
      type: ObjectId,
    },
    name: {
      type: String,
      required: [true, 'A project must have a name'],
      maxLength: [40, 'This project exceeds the max length of 40 characters'],
      minLength: [6, 'This project exceeds the min length of 10 characters'],
    },
    description: {
      type: String,
      default: '',
      maxLength: [500, 'A description must not exceed 500 characters.'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    contributors: [
      {
        ref: 'users',
        type: ObjectId,
      },
    ],
    tasks: [
      {
        ref: 'tasks',
        type: ObjectId,
      },
    ],
    paused: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectSchema.plugin(AutoIncrementID, { field: 'projectId', startAt: 1 });

projectSchema.pre('save', async function (next) {
  const user = await Users.findByIdAndUpdate(this.author, {
    $addToSet: {
      projects: {
        project: this._id,
        permission: 'author',
      },
    },
  });

  const contributingUser = await Users.findByIdAndUpdate(this.contributors[0], {
    $addToSet: {
      projects: {
        project: this._id,
        permission: 'contributor',
      },
    },
  });

  next();
});
projectSchema.post('findOne', async function (doc) {
  if (doc) {
    await doc.populate([
      { path: 'tasks', select: '' },
      { path: 'author', select: 'name userId _id email' },
      { path: 'contributors', select: 'name userId _id email' },
    ]);
  }
});
projectSchema.post('find', async function (docs) {
  if (docs) {
    for (const doc in docs) {
      await docs[doc].populate([
        { path: 'tasks', select: '' },
        { path: 'author', select: 'name userId _id email' },
        { path: 'contributors', select: 'name userId _id email' },
      ]);
    }
  }
});

projectSchema.post('findOneAndDelete', async function (doc) {
  const project = doc;

  if (project.tasks.length > 0) {
    await Tasks.deleteMany({ _id: { $in: project.tasks } }).exec();
  }
  await Users.updateOne(
    { _id: project.author },
    {
      $pull: {
        projects: {
          project: project._id,
        },
      },
    }
  );
});

projectSchema.post('deleteMany', async function (doc) {});

export type Project = InferSchemaType<typeof projectSchema>;

projectSchema.index(
  { name: 1, author: 1 },
  {
    unique: true,
    sparse: true,
  }
);

export const Projects = mongoose.model('projects', projectSchema);
