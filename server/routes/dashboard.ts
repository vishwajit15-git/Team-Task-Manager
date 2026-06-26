import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.route('/')
    .get(getDashboardStats);

export default router;
