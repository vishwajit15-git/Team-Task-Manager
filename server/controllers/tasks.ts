import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { createTaskSchema, updateTaskSchema } from "../schemas";

//1.create task
export const createTask = catchAsync(async (req: Request, res: Response) => {
    const validatedData = createTaskSchema.parse(req.body);

    const { projectId } = req.query  //expecting : POST /api/tasks?projectId=1234

    if (!projectId || typeof projectId !== 'string') {
        throw new AppError('Please select a project to view its tasks.', 400);
    }

    //verify the project exista and the user is the member 
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { id: true } } }
    });

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const isMember = project.members.some(m => m.id === req.user.id);

    if (!isMember) {
        throw new AppError('You do not have permission to add tasks to this project.', 403);
    }

    //create the task and link the creator
    const task = await prisma.task.create({
        data: {
            ...validatedData,
            projectId,
            creatorId: req.user.id  //automatically assign the logged in user as creator
        }
    });

    res.status(201).json({
        status: 'success',
        data: { task }
    });
});

//2.get all tasks for a project 
export const getTasks = catchAsync(async (req: Request, res: Response) => {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
        throw new AppError('Please select a project to view its tasks.', 400);
    }

    //verify the project exists and the user is the member 
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { id: true } } }
    });

    if (!project) {
        throw new AppError("Project not found", 404);
    }

    const isMember = project.members.some(m => m.id === req.user.id);

    if (!isMember) {
        throw new AppError('You do not have access to this project', 403);
    }

    //fetch task with assignee and creator data
    const tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            creator: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
        status: 'success',
        results: tasks.length,
        data: { tasks }
    });
});

//3.update task
export const updateTask = catchAsync(async (req: Request, res: Response) => {
    const validatedData = updateTaskSchema.parse(req.body);

    const task = await prisma.task.findUnique({
        where: { id: req.params.id },
        include: { project: { include: { members: { select: { id: true } } } } }
    });

    if (!task) {
        throw new AppError("Task not found", 404);
    }

    const isMember = task.project.members.some(m => m.id === req.user.id);

    if (!isMember) throw new AppError('You do not have permission to update this task', 403);

    const updatedTask = await prisma.task.update({
        where: { id: req.params.id },
        data: validatedData,
        include: {
            assignee: { select: { id: true, name: true, avatar: true } }
        }
    });

    // If the task was just assigned to a new user, notify them!
    if (validatedData.assigneeId) {
        const notification = await prisma.notification.create({
            data: {
                userId: validatedData.assigneeId,
                title: "New Task Assigned",
                message: `You have been assigned a new task.`,
                type: "task_assigned"
            }
        });

        // Grab WebSockets
        const io = req.app.get('io');
        if (io) {
            // We emit directly to the User's personal ID room!
            io.to(validatedData.assigneeId).emit('new_notification', notification);
        }
    }


    res.status(200).json({ status: 'success', data: { task: updatedTask } });
});

//4.delete task
export const deleteTask = catchAsync(async (req: Request, res: Response) => {
    const task = await prisma.task.findUnique({
        where: { id: req.params.id },
        include: { project: { include: { members: { select: { id: true } } } } }
    });

    if (!task) {
        throw new AppError("Task not found", 404);
    }

    const isMember = task.project.members.some(m => m.id === req.user.id);

    if (!isMember) {
        throw new AppError("You do not have permission to delete this task", 403);
    }

    //strict ownership rule, only creator or admin can delete
    if (task.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new AppError('Only the task creator or an admin can delete this task', 403);
    }

    await prisma.task.delete({
        where: { id: req.params.id }
    });

    res.status(204).send();
});