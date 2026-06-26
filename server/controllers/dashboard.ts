import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { catchAsync } from '../utils/catchAsync';

export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    
    // 1. Active Projects Count
    const activeProjects = await prisma.project.count({
        where: {
            members: { some: { id: userId } },
            status: 'ACTIVE'
        }
    });

    // 2. My Open Tasks (Tasks assigned to you that are not completed)
    const openTasks = await prisma.task.count({
        where: {
            assigneeId: userId,
            status: { not: 'COMPLETED' }
        }
    });

    // 3. Completed Tasks
    const completedTasks = await prisma.task.count({
        where: {
            assigneeId: userId,
            status: 'COMPLETED'
        }
    });

    // 4. Team Capacity (Total members across all your projects)
    // We get all your projects, and count unique members inside them
    const projects = await prisma.project.findMany({
        where: { members: { some: { id: userId } } },
        include: { members: { select: { id: true } } }
    });
    
    const uniqueMemberIds = new Set();
    projects.forEach(p => p.members.forEach(m => uniqueMemberIds.add(m.id)));
    const teamCapacity = uniqueMemberIds.size;

    res.status(200).json({
        status: 'success',
        data: {
            stats: {
                activeProjects,
                openTasks,
                completedTasks,
                teamCapacity
            }
        }
    });
});
