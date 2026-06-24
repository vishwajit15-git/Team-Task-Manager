import { Router } from "express";
import { addMember, removeMember } from "../controllers/members";
import { protect } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimiter";

//mergeParams:true allows us to access the :projectId from the parent router
const router = Router({ mergeParams: true });

router.use(protect);
router.use(apiLimiter);


//Matches: /api/projects/:projectId/members
router.route('/')
    .post(addMember);

//Matches: /api/projects/:projectId/members/:userId
router.route('/:userId')
    .delete(removeMember);

export default router;