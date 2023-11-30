import { Request, Router, Response, RequestHandler } from 'express';
import { Task, Tasks } from '../models/taskModel';
import {
  assignTask,
  createTask,
  deleteTask,
  getProjectTasks,
  getTask,
  getTasks,
  updateTask,
} from '../controllers/taskController';
import { checkProjectAuthor } from '../controllers/authController';
// import { protectRoute } from '../controllers/authController';

const router = Router();

router.route('/').get(getTasks).post(checkProjectAuthor, createTask);
router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask);
router.route('/:taskId/user/:userId').get(assignTask);
router.route('/project/:id').get(getProjectTasks);

export default router;
