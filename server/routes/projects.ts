import { Router } from 'express';
import { createProject, getProjects, getProjectById, updateProject, deleteProject } from '../controllers/projects';
import { protect } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

//apply auth and rate limiting to all project routes globally
router.use(protect);
router.use(apiLimiter);

//  /api/projects
router.route('/')
    .post(createProject)
    .get(getProjects);

//  /api/projects/:id
router.route('/:id')
    .get(getProjectById)
    .patch(updateProject)
    .delete(deleteProject);


export default router;