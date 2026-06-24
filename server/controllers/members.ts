import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { addMemberSchema } from "../schemas";

//1.add member to project 
export const addMember = catchAsync(async (req: Request, res: Response) => {
    const validatedData = addMemberSchema.parse(req.body);
    const projectId = req.params.projectId;

    //verify the project exists and the requeaster is a member
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { id: true } } }
    });

    if (!project) {
        throw new AppError('Project not found.', 404);
    }

    const isRequesterMember = project.members.some(m => m.id === req.user.id);

    if (!isRequesterMember) {
        throw new AppError('You do not have permission to invite users to this project.', 403)
    }

    //2.Find the user they are trying to invite by email
    const userToAdd = await prisma.user.findUnique({
        where: { email: validatedData.email }
    });

    if (!userToAdd) {
        throw new AppError('No user found with that email address. They must register first.', 404);
    }

    //3.check if they are already in project
    const isAlreadyMember = project.members.some(m => m.id === userToAdd.id);

    if (isAlreadyMember) {
        throw new AppError('This user is already a member of the project.', 400);
    }

    //4.Connect the user to the members array
    await prisma.project.update({
        where: { id: projectId },
        data: {
            members: {
                connect: { id: userToAdd.id }
            }
        }
    });

    res.status(200).json({
        status: 'success',
        message: 'User successfully added to this project.',
        data: {
            user: { id: userToAdd.id, name: userToAdd.name, email: userToAdd.email }
        }
    });
});

//2.Remove member from project 
export const removeMember = catchAsync(async (req: Request, res: Response) => {
    const { projectId, userId } = req.params;

    //1.verify the project exists
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { id: true } } }
    });

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const isRequesterMember = project.members.some(m => m.id === req.user.id);

    if (!isRequesterMember) {
        throw new AppError('You do not have permission to remove users from this project.', 403)
    }

    //2.prevent removing yourself
    if (userId === req.user.id) {
        throw new AppError('You cannot remove yourself. Use the leave project feature instead.', 400);
    }

    //disconnect the user
    await prisma.project.update({
        where: { id: projectId },
        data: {
            members: {
                disconnect: { id: userId }
            }
        }
    });

    res.status(200).json({
        status: 'success',
        message: 'User successfully removed from the project.'
    });
});