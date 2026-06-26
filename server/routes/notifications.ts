import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notifications';
import { protect } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(protect);
router.use(apiLimiter);

router.route('/')
    .get(getNotifications);

// We use PUT here because marking "all" as read is a bulk operation, but PATCH is fine too.
router.route('/read-all')
    .patch(markAllAsRead);

router.route('/:notificationId/read')
    .patch(markAsRead);

export default router;
