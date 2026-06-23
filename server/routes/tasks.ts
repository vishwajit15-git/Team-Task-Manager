import { Router } from 'express';
import { createTask, getTasks, updateTask, deleteTask } from '../controllers/tasks';
import { protect } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

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


export default router; 