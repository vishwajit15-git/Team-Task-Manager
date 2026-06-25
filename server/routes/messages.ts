import { Router } from "express";
import { getMessages, sendMessage } from "../controllers/messages";
import { protect } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimiter";

//mergeParams is required so we ca access : projectId
const router = Router({ mergeParams: true });

router.use(protect);
router.use(apiLimiter);

router.route('/')
    .get(getMessages)
    .post(sendMessage);

export default router;