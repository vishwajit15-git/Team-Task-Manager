import { Router } from 'express';
import { createTask, getTasks, updateTask, deleteTask } from '../controllers/tasks';
import { protect } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import commentRoutes from './comments';

const router = Router();

//auth and rate limiting to all task globally 
router.use(protect);
router.use(apiLimiter);


//  /api/tasks     (also expects ?projectId=1234  for POST and GET)
router.route('/')
    .post(createTask)
    .get(getTasks);


//   /api/tasks/:id
router.route('/:id')
    .patch(updateTask)
    .delete(deleteTask);

//nested routes for comments in tasks
router.use('/:taskId/comments', commentRoutes);


export default router; 