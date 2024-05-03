import { Document, ObjectId } from 'mongoose';
interface IUserProjects {
  project: ObjectId;
  permission: 'author' | 'contributor';
}
export interface IUser extends Document {
  userId: number;
  name: string;
  authentication?: {
    password: string;
    passwordConfirm: string | undefined;
    salt?: string;
    jwt?: string | null;
  };
  projects: IUserProjects[];
  email: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  photo: string;
  createPasswordResetToken: () => string;
  correctPassword: (
    candidatePassword: string,
    userPassword: string
  ) => Promise<Boolean>;
  changedPasswordAt: () => boolean;
}

export interface ITask extends Document {
  length: any;
  taskId?: number;
  projectId: number;
  project: ObjectId;
  author: ObjectId;
  assignedTo: ObjectId;
  name: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: Date;
  status?: 'backlog' | 'in progress' | 'done';
}
