import { Router } from 'express';
import { getPolls, createPoll, voteOnPoll } from '../controllers/polls';
import { protect } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router({ mergeParams: true });

router.use(protect);
router.use(apiLimiter);

router.route('/')
    .get(getPolls)
    .post(createPoll);

// A specific route to cast a vote on an option
router.route('/:pollId/options/:optionId/vote')
    .post(voteOnPoll);

export default router;
