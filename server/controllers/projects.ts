import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { createProjectSchema, updateProjectSchema } from '../schemas';


//1.create project
export const createProject = catchAsync(async (req: Request, res: Response) => {
    const validatedData = createProjectSchema.parse(req.body);

    //automatically add the creator as a project member
    const project = await prisma.project.create({
        data: {
            ...validatedData,
            members: {
                connect: {
                    id: req.user.id
                }
            }
        }
    });

    res.status(201).json({
        status: 'success',
        data: { project }
    });
});

//2.get all projects (for loogged in users)
export const getProjects = catchAsync(async (req: Request, res: Response) => {
    //tenant isolation: only return the projects that the user is member of
    const projects = await prisma.project.findMany({
        where: {
            members: {
                some: { id: req.user.id }
            }
        },
        //include counts fri dashboard ui cards
        include: {
            _count: {
                select: { tasks: true, members: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
        status: 'success',
        results: projects.length,
        data: { projects }
    });
});

//3.get single project
export const getProjectById = catchAsync(async (req: Request, res: Response) => {
    const project = await prisma.project.findFirst({
        where: {
            id: req.params.id,
            members: {
                some: { id: req.user.id }
            }
        },
        include: {
            //return member but exclude passsword hashes
            members: {
                select: { id: true, name: true, email: true, avatar: true, role: true }
            },
            //return recent tasks
            tasks: {
                orderBy: { createdAt: 'desc' },
                take: 10
            }
        }
    });

    if (!project) { //project doesn't exist in the database
        throw new AppError('Project not found.', 404);
    }
    //project exits,but this user is not in the members array
    const isMember = project.members.some(member => member.id === req.user.id);
    if (!isMember) {
        throw new AppError('You do not have access to this project', 403); //403 means forbidden
    }

    res.status(200).json({
        status: 'success',
        data: { project }
    });
});

// 4. UPDATE PROJECT
export const updateProject = catchAsync(async (req: Request, res: Response) => {
    const validatedData = updateProjectSchema.parse(req.body);

    const existingProject = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: { members: { select: { id: true } } } // Only need ID to verify access
    });

    if (!existingProject) {
        throw new AppError("Project not found", 404);
    }

    const isMember = existingProject.members.some(m => m.id === req.user.id);
    if (!isMember) {
        throw new AppError('You do not have permission to update this project', 403);
    }

    const project = await prisma.project.update({
        where: { id: req.params.id },
        data: validatedData
    });

    res.status(200).json({
        status: 'success',
        data: { project }
    });
});


// 5. DELETE PROJECT
export const deleteProject = catchAsync(async (req: Request, res: Response) => {
    // Only ADMINs can delete
    if (req.user.role !== 'ADMIN') {
        throw new AppError('Only administrators can delete projects', 403);
    }

    const existingProject = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: { members: { select: { id: true } } }
    });

    if (!existingProject) {
        throw new AppError("Project not found", 404);
    }

    // Even if they are an admin, they must still be a member of the project to delete it
    const isMember = existingProject.members.some(m => m.id === req.user.id);
    if (!isMember) {
        throw new AppError('You do not have permission to delete this project', 403);
    }

    await prisma.project.delete({
        where: { id: req.params.id }
    });

    res.status(204).send(); // 204 means No Content
});
