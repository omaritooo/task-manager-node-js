import { Router } from 'express';
import {
  deleteUser,
  getAllUsers,
  getUser,
} from '../controllers/userControllers';

const router = Router();

router.route('/').get(getAllUsers).delete(deleteUser);
router.route('/:id').get(getUser);

export default router;
