import { Projects } from '../models/projectModel';
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from '../utils/helperFunctions';

export const getProjects = getAll(Projects);

export const createProject = createOne(Projects);

export const deleteProject = deleteOne(Projects, 'projectId');

export const getProject = getOne(Projects, 'project');

export const updateProject = updateOne(Projects, 'project');
