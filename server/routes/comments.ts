import { Router } from 'express';
import { getComments, addComment } from '../controllers/comments';
import { protect } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router({ mergeParams: true });

router.use(protect);
router.use(apiLimiter);

router.route('/')
    .get(getComments)
    .post(addComment);

export default router;
