import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { createPollSchema } from '../schemas';

export const getPolls = catchAsync(async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true }
    });

    if (!project) throw new AppError('Project not found', 404);
    if (!project.members.some(m => m.id === req.user.id)) {
        throw new AppError('You do not have access to these polls.', 403);
    }

    const polls = await prisma.poll.findMany({
        where: { projectId },
        include: {
            creator: { select: { id: true, name: true, avatar: true } },
            options: {
                include: {
                    votes: { select: { userId: true } } // Returns user IDs so frontend knows who voted what
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: { polls } });
});

export const createPoll = catchAsync(async (req: Request, res: Response) => {
    const validatedData = createPollSchema.parse(req.body);
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true }
    });

    if (!project) throw new AppError('Project not found', 404);
    if (!project.members.some(m => m.id === req.user.id)) {
        throw new AppError('You do not have permission to create polls.', 403);
    }

    const newPoll = await prisma.poll.create({
        data: {
            question: validatedData.question,
            projectId,
            creatorId: req.user.id,
            options: {
                create: validatedData.options.map(text => ({ text }))
            }
        },
        include: {
            options: true
        }
    });

    // Grab WebSockets to notify team of new poll
    const io = req.app.get('io');
    if (io) {
        io.to(projectId).emit('new_poll', newPoll);
    }

    res.status(201).json({ status: 'success', data: { poll: newPoll } });
});

export const voteOnPoll = catchAsync(async (req: Request, res: Response) => {
    const { projectId, pollId, optionId } = req.params;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true }
    });

    if (!project || !project.members.some(m => m.id === req.user.id)) {
        throw new AppError('Unauthorized', 403);
    }

    // Ensure the option actually exists and belongs to this poll
    const option = await prisma.pollOption.findUnique({
        where: { id: optionId },
        include: { poll: true }
    });

    if (!option || option.poll.id !== pollId) {
        throw new AppError('Invalid poll option', 404);
    }

    // Ensure user hasn't voted on this poll before (across any option)
    const existingVote = await prisma.vote.findFirst({
        where: {
            userId: req.user.id,
            pollOption: { pollId }
        }
    });

    if (existingVote) {
        // If they already voted, change their vote
        await prisma.vote.update({
            where: { id: existingVote.id },
            data: { pollOptionId: optionId }
        });
    } else {
        // First time voting
        await prisma.vote.create({
            data: {
                userId: req.user.id,
                pollOptionId: optionId
            }
        });
    }

    res.status(200).json({ status: 'success', message: 'Vote recorded' });
});
