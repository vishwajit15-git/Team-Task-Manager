import { Request, Response } from "express";
import { prisma } from '../lib/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { commentSchema } from '../schemas';
import { data } from "react-router-dom";

export const getComments = catchAsync(async (req: Request, res: Response) => {
    const { taskId } = req.params;

    //verify task exists and get its projectId to check its permissions
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: { include: { members: true } } }
    });

    if (!task) {
        throw new AppError('Task not found', 404);
    }

    if (!task.project.members.some(m => m.id === req.user.id)) {
        throw new AppError('You do not have access to this task.', 403);
    }

    const comments = await prisma.comment.findMany({
        where: { taskId },
        include: { author: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'asc' }
    });

    res.status(200).json({
        status: 'success',
        data: { comments }
    });
});

export const addComment = catchAsync(async (req: Request, res: Response) => {
    const validatedData = commentSchema.parse(req.body);
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: { include: { members: true } } }
    });

    if (!task) throw new AppError('Task not found', 404);
    if (!task.project.members.some(m => m.id === req.user.id)) {
        throw new AppError('You do not have permission to comment here.', 403);
    }

    const newComment = await prisma.comment.create({
        data: {
            content: validatedData.content,
            taskId,
            authorId: req.user.id
        },
        include: { author: { select: { id: true, name: true, avatar: true } } }
    });

    res.status(201).json({
        status: 'success',
        data: {
            comment: newComment
        }
    });
});