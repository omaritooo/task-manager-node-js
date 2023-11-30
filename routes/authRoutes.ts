import { Router } from 'express';
import {
  createUser,
  forgotPassword,
  login,
  logout,
} from '../controllers/authController';

const router = Router();

router.route('/signup').post(createUser);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/forgotPassword').post(forgotPassword);

export default router;
