import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { messageSchema } from "../schemas";

export const getMessages = catchAsync(async (req: Request, res: Response) => {
    const { projectId } = req.params;

    //verify membership

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { id: true } } }
    });

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    if (!project.members.some(m => m.id === req.user.id)) {
        throw new AppError('You do not have access to these messages.', 403);
    }

    //fetch messages with sender details
    const messages = await prisma.message.findMany({
        where: { projectId },
        include: {
            sender: { select: { id: true, name: true, avatar: true } }
        },
        orderBy: { createdAt: 'asc' }//oldest first like chat app
    });

    res.status(200).json({
        status: 'success',
        data: { messages }
    });
});


export const sendMessage = catchAsync(async (req: Request, res: Response) => {
    const validatedData = messageSchema.parse(req.body);
    const { projectId } = req.params;

    //verify membership
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { id: true } } }
    });

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    if (!project.members.some(m => m.id === req.user.id)) {
        throw new AppError('You do not have permission to send messages here.', 403);
    }

    //save mesg to DB
    const newMessage = await prisma.message.create({
        data: {
            content: validatedData.content,
            projectId,
            senderId: req.user.id
        },
        include: {
            sender: { select: { id: true, name: true, avatar: true } }
        }
    });

    //WEBSOCKET MAGIC

    //grab the instance that we will attach to the Express App later
    const io = req.app.get('io');

    if (io) {
        //Broadcast to every one in the project's room
        io.to(projectId).emit('new_message', newMessage);
    }

    res.status(201).json({
        status: 'success',
        data: {
            message: newMessage
        }
    });
});