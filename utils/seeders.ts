import mongoose from 'mongoose';
import { Projects } from '../models/projectModel';
import { Tasks } from '../models/taskModel';
import { db } from '../db';

import { dbConnection } from '../server';

interface IProjectSeed {
  name: string;
  description: string;
  paused: boolean;
}

// Type for an individual task seed
interface ITaskSeed {
  name: string;
  priority: string;
  estimatedTime: string;
  projectId: number; // Assuming projectId is a number
  description: string;
}

interface TasksSeedType {
  projects: IProjectSeed[];
  tasks: ITaskSeed[];
}

export const projectsSeed: IProjectSeed[] = [
  {
    name: 'Project 9',
    description: 'This is a new test project',
    paused: true,
  },
  {
    name: 'Project 8',
    description: 'This is a new test project',
    paused: true,
  },
  {
    name: 'Project 7',
    description: 'This is a new test project',
    paused: true,
  },
  {
    name: 'Project 6',
    description: 'This is a new test project',
    paused: true,
  },
  {
    name: 'Project 5',
    description: 'This is a new test project',
    paused: true,
  },
  {
    name: 'Project 4',
    description: 'This is a new test project',
    paused: true,
  },
  {
    name: 'Project 3',
    description: 'This is a new test project',
    paused: true,
  },
  {
    name: 'Project 2',
    description: 'This is a new test project',
    paused: true,
  },
  {
    name: 'Project 1',
    description: 'This is a new test project',
    paused: true,
  },
];

export const tasksSeed: TasksSeedType = {
  projects: [
    {
      name: 'Project 1',
      description: 'This is a new test project',
      paused: true,
    },
    {
      name: 'Project 2',
      description: 'This is a new test project',
      paused: true,
    },
  ],
  tasks: [
    {
      name: 'Task 1',
      priority: 'high',
      estimatedTime: '2023-10-06T01:41:27.971Z',
      projectId: 1,
      description: 'This is a brand new project',
    },
    {
      name: 'Task 2',
      priority: 'high',
      estimatedTime: '2023-10-06T01:41:27.971Z',
      projectId: 1,
      description: 'This is a brand new project',
    },
    {
      name: 'Task 3',
      priority: 'high',
      estimatedTime: '2023-10-06T01:41:27.971Z',
      projectId: 1,
      description: 'This is a brand new project',
    },
    {
      name: 'Task 4',
      priority: 'high',
      estimatedTime: '2023-10-06T01:41:27.971Z',
      projectId: 1,
      description: 'This is a brand new project',
    },
    {
      name: 'Task 5',
      priority: 'high',
      estimatedTime: '2023-10-06T01:41:27.971Z',
      projectId: 2,
      description: 'This is a brand new project',
    },
    {
      name: 'Task 6',
      priority: 'high',
      estimatedTime: '2023-10-06T01:41:27.971Z',
      projectId: 2,
      description: 'This is a brand new project',
    },
    {
      name: 'Task 7',
      priority: 'high',
      estimatedTime: '2023-10-06T01:41:27.971Z',
      projectId: 2,
      description: 'This is a brand new project',
    },
    {
      name: 'Task 8',
      priority: 'high',
      estimatedTime: '2023-10-06T01:41:27.971Z',
      projectId: 2,
      description: 'This is a brand new project',
    },
  ],
};

export type seedTypes = TasksSeedType | IProjectSeed[];
