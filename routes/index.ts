import { Router } from 'express';
import Tasks from './taskRoutes';
import Users from './userRoutes';
import Projects from './projectsRoutes';
import Auth from './authRoutes';
import { protectRoute } from '../controllers/authController';

const router = Router();

router.use('/api/v1/tasks', protectRoute, Tasks);
router.use('/api/v1/users', protectRoute, Users);
router.use('/api/v1/auth', Auth);
router.use('/api/v1/projects', protectRoute, Projects);

export default router;
