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

    if (!project) {
        throw new AppError('Project not found or you do not have access.', 404);
    }

    res.status(200).json({
        status: 'success',
        data: { project }
    });
});

//4.update project