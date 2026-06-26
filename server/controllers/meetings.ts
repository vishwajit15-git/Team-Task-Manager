import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { createMeetingSchema } from '../schemas';

export const getMeetings = catchAsync(async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true }
    });

    if (!project) throw new AppError('Project not found', 404);
    if (!project.members.some(m => m.id === req.user.id)) {
        throw new AppError('You do not have access to these meetings.', 403);
    }

    const meetings = await prisma.meeting.findMany({
        where: { projectId },
        orderBy: { date: 'asc' } // Soonest meetings first
    });

    res.status(200).json({ status: 'success', data: { meetings } });
});

export const scheduleMeeting = catchAsync(async (req: Request, res: Response) => {
    const validatedData = createMeetingSchema.parse(req.body);
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true }
    });

    if (!project) throw new AppError('Project not found', 404);
    if (!project.members.some(m => m.id === req.user.id)) {
        throw new AppError('You do not have permission to schedule meetings.', 403);
    }

    const newMeeting = await prisma.meeting.create({
        data: {
            title: validatedData.title,
            description: validatedData.description,
            date: new Date(validatedData.date),
            projectId
        }
    });

    res.status(201).json({ status: 'success', data: { meeting: newMeeting } });
});
