import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from '../controllers/projectController';

const router = Router();
router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProject).delete(deleteProject).patch(updateProject);

export default router;
